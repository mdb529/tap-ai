/**
 * Build db/tap-ai.duckdb from db/schema.sql.
 *
 * Run from the repo root: `npm run db:build`
 * Config (YAML) is NOT loaded here -- the app reads it from disk directly.
 * Only activity data lands in the warehouse.
 */
import { DuckDBInstance } from "@duckdb/node-api";
import { readFileSync, existsSync, rmSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const root = resolve(import.meta.dirname, "..");
process.chdir(root);                     // schema.sql uses paths relative to root

const dbPath = resolve(root, "db/tap-ai.duckdb");
mkdirSync(dirname(dbPath), { recursive: true });
for (const p of [dbPath, `${dbPath}.wal`]) if (existsSync(p)) rmSync(p);

const sql = readFileSync(resolve(root, "db/schema.sql"), "utf8");

const instance = await DuckDBInstance.create(dbPath);
const conn = await instance.connect();

// Split on semicolons at end-of-line so the multi-statement file runs cleanly.
const statements = sql
  .split(/;\s*$/m)
  .map((s) => s.trim())
  .filter((s) => s && !s.split("\n").every((l) => l.trim().startsWith("--")));

let n = 0;
for (const stmt of statements) {
  try {
    await conn.run(stmt);
    n++;
  } catch (err) {
    console.error(`\nFAILED statement #${n + 1}:\n${stmt.slice(0, 400)}\n`);
    throw err;
  }
}

const tables = await conn.runAndReadAll(
  `select table_name, table_type from information_schema.tables
   where table_schema = 'main' order by table_type, table_name`
);
console.log(`\nran ${n} statements -> db/tap-ai.duckdb\n`);
for (const row of tables.getRowObjects()) {
  const name = String(row.table_name);
  const c = await conn.runAndReadAll(`select count(*) as n from "${name}"`);
  const cnt = c.getRowObjects()[0].n;
  console.log(`  ${String(row.table_type).padEnd(10)} ${name.padEnd(24)} ${String(cnt).padStart(6)}`);
}
console.log("\nok");
