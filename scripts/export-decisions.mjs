/**
 * Export the decision ledger as JSONL — the format an agent's retrieval layer
 * ingests, and the honest backing for the "optimized for AI agents" claim on
 * the homepage.
 *
 *   npm run export:decisions   ->  exports/decisions.jsonl
 *
 * JSONL rather than a single JSON array on purpose: it streams, it appends, and
 * every embedding pipeline already reads it.
 */
import { DuckDBInstance } from "@duckdb/node-api";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
process.chdir(root);

const dbPath = resolve(root, "db/tap-ai.duckdb");
if (!existsSync(dbPath)) {
  console.error("No warehouse. Run `npm run db:build` first.");
  process.exit(1);
}

const instance = await DuckDBInstance.create(dbPath);
const conn = await instance.connect();
const reader = await conn.runAndReadAll(
  `SELECT * FROM v_decision_ledger ORDER BY decided_at DESC`
);

const rows = reader.getRowObjects().map((r) => {
  const o = {};
  for (const [k, v] of Object.entries(r)) {
    o[k] = typeof v === "bigint" ? Number(v) : v === null ? null : Array.isArray(v) ? v : v;
  }
  // reshape flat SQL columns into the nested record the homepage documents
  return {
    decision_id: String(o.decision_id),
    tap_id: String(o.tap_id),
    status: String(o.status),
    class: String(o.class),
    domain: String(o.domain),
    answer: String(o.answer),
    rationale: o.rationale ? String(o.rationale) : null,
    scope: {
      objects: o.scope_objects,
      downstream_count: Number(o.downstream_count),
    },
    decided_by: {
      name: String(o.decided_by_name),
      role: String(o.decided_by_role),
      authority: String(o.decided_by_authority),
    },
    decided_at: String(o.decided_at),
    artifact: {
      type: String(o.artifact_type),
      ref: String(o.artifact_ref),
      landed_at: o.artifact_landed_at ? String(o.artifact_landed_at) : null,
    },
    provenance: {
      trigger: String(o.provenance_trigger),
      path: String(o.provenance_path),
    },
    durability: {
      survived: Boolean(o.durability_survived),
      reversed_at: o.reversed_at ? String(o.reversed_at) : null,
    },
    quality_score: Number(o.quality_score),
    retrieval_text: String(o.retrieval_text),
  };
});

mkdirSync(resolve(root, "exports"), { recursive: true });
const out = resolve(root, "exports/decisions.jsonl");
writeFileSync(out, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");

const active = rows.filter((r) => r.status === "active").length;
console.log(`\nwrote ${rows.length} decisions -> exports/decisions.jsonl`);
console.log(`  active:      ${active}`);
console.log(`  provisional: ${rows.filter((r) => r.status === "provisional").length}`);
console.log(`  reversed:    ${rows.filter((r) => r.status === "reversed").length}`);
console.log(`\nOnly 'active' rows should be served to an agent.\n`);
