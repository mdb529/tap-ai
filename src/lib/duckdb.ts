import "server-only";
import { DuckDBInstance } from "@duckdb/node-api";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

/** Derived rather than imported by name -- the package's exported type names
 *  move around between releases, and a rename should not break the build. */
type Conn = Awaited<ReturnType<Awaited<ReturnType<typeof DuckDBInstance.create>>["connect"]>>;

/**
 * Server-only DuckDB access.
 *
 * One instance per process, cached across hot reloads (Next dev re-evaluates
 * modules; without the global cache you leak a connection per save).
 */

const DB_PATH = resolve(process.cwd(), "db/tap-ai.duckdb");

declare global {
  // eslint-disable-next-line no-var
  var __tapAiConn: Promise<Conn> | undefined;
}

function connect(): Promise<Conn> {
  if (!existsSync(DB_PATH)) {
    throw new Error(
      `No warehouse at db/tap-ai.duckdb.\nRun: npm run setup   (generates seeds, then builds the database)`
    );
  }
  return DuckDBInstance.create(DB_PATH).then((i) => i.connect());
}

function conn(): Promise<Conn> {
  if (!globalThis.__tapAiConn) globalThis.__tapAiConn = connect();
  return globalThis.__tapAiConn;
}

/**
 * DuckDB's node bindings return BIGINT as bigint and temporal/decimal types as
 * wrapper objects. React cannot render either. Normalize once, here, rather
 * than defensively at every call site.
 */
function normalize(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  const t = typeof value;
  if (t === "bigint") return Number(value as bigint);
  if (t === "string" || t === "number" || t === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalize);
  if (t === "object") return String(value);
  return value;
}

/** Run a query and return plain JS row objects. */
export async function q<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const c = await conn();
  const reader = params.length
    ? await c.runAndReadAll(sql, params as never[])
    : await c.runAndReadAll(sql);
  return reader.getRowObjects().map((row) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) out[k] = normalize(v);
    return out as T;
  });
}

/** Run a query expected to return exactly one row. */
export async function q1<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T> {
  const rows = await q<T>(sql, params);
  if (!rows.length) throw new Error(`Query returned no rows:\n${sql}`);
  return rows[0];
}

export const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};
export const str = (v: unknown, fallback = ""): string =>
  v === null || v === undefined ? fallback : String(v);
