/**
 * The decision ledger — the format every resolved tap lands in.
 *
 * This is the strategic asset, and it is worth being precise about why the
 * format matters rather than just calling it "AI-ready".
 *
 * An agent editing your warehouse today has your schemas, your column names,
 * and your lineage. What it does not have is the set of decisions those objects
 * encode. So when it needs to know whether self-pay belongs in revenue, it
 * infers — plausibly, confidently, and sometimes wrongly. Schemas describe
 * shape. They say nothing about intent.
 *
 * Six properties make this corpus usable by a model rather than merely
 * machine-readable:
 *
 *   1. ONE RECORD PER DECISION, not per event. An agent needs the current
 *      answer, not an event log to fold.
 *   2. SCOPE BINDING. Each record names the code objects it governs, so
 *      retrieval keys on lineage — the thing the agent is editing — instead of
 *      hoping text similarity finds it.
 *   3. EXPLICIT SUPERSESSION. status + supersedes means a stale decision is
 *      unusable rather than something to infer from timestamps.
 *   4. AUTHORITY AND DURABILITY AS TRUST SIGNALS. A CFO's decision that
 *      survived 60 days unreversed is not the same evidence as an analyst's
 *      that got reverted. The record says which is which.
 *   5. PRE-RENDERED RETRIEVAL TEXT. One record is one chunk. No chunking
 *      heuristic gets to split a decision from its scope.
 *   6. SERVED OVER MCP. Tools, not a schema the agent has to learn first.
 *
 * Honest limit: this corpus is only as useful as it is dense. An org with nine
 * decisions recorded has a curiosity, not a knowledge base. The value compounds,
 * which means it starts near zero — worth saying out loud to a buyer rather
 * than letting them discover it in month two.
 *
 * No server-only imports. Bundled to the client for the homepage viewer.
 */

export interface DecisionRecord {
  decision_id: string;
  tap_id: string;
  version: number;
  supersedes: string | null;
  status: "active" | "superseded" | "reversed";
  question: string;
  answer: string;
  rationale: string | null;
  class: "tactical" | "operational" | "strategic";
  domain: string;
  scope: { objects: string[]; downstream_count: number };
  decided_by: { name: string; role: string; authority: string };
  decided_at: string;
  valid_from: string;
  valid_until: string | null;
  artifact: { type: string; ref: string; merged_at: string | null };
  provenance: { trigger: string; source: string; commit: string };
  durability: { window_days: number; survived: boolean; reversed_at: string | null };
  /** One chunk, pre-rendered. This is what gets embedded and retrieved. */
  retrieval_text: string;
}

export const SAMPLE_DECISION: DecisionRecord = {
  decision_id: "dec_01JQ8F2K7Y3M",
  tap_id: "TAP-004182",
  version: 2,
  supersedes: "dec_01HZ4A9P2C1B",
  status: "active",
  question: "Should net patient revenue exclude self-pay accounts?",
  answer: "Yes — exclude self-pay",
  rationale: "Self-pay is tracked separately against the bad-debt reserve.",
  class: "strategic",
  domain: "finance.revenue",
  scope: {
    objects: [
      "metric:net_patient_revenue",
      "model:marts.core.fct_net_patient_revenue",
      "column:fct_net_patient_revenue.net_revenue_amount",
    ],
    downstream_count: 31,
  },
  decided_by: { name: "Robert Marsh", role: "chief financial officer", authority: "cxo" },
  decided_at: "2026-08-04T09:47:12Z",
  valid_from: "2026-08-04T11:02:44Z",
  valid_until: null,
  artifact: {
    type: "pull_request",
    ref: "northharbor/analytics#1284",
    merged_at: "2026-08-04T11:02:44Z",
  },
  provenance: {
    trigger: "code_change",
    source: "dbt:northharbor-analytics",
    commit: "a3f91c7",
  },
  durability: { window_days: 60, survived: true, reversed_at: null },
  retrieval_text:
    "Net patient revenue excludes self-pay accounts. Decided by Robert Marsh (CFO) on 2026-08-04, " +
    "because self-pay is tracked separately against the bad-debt reserve. Governs the metric " +
    "net_patient_revenue and the model fct_net_patient_revenue, which 31 reports depend on. " +
    "Supersedes an earlier definition that included self-pay. Active; survived the 60-day " +
    "durability window without reversal.",
};

/** The MCP surface an agent actually talks to. */
export const MCP_TOOLS = [
  {
    name: "decisions.for_object",
    args: '{ "object": "metric:net_patient_revenue" }',
    returns: "Active decisions governing an object, newest first. The primary retrieval path.",
  },
  {
    name: "decisions.search",
    args: '{ "query": "how do we treat self-pay?", "domain": "finance.revenue" }',
    returns: "Semantic search over retrieval_text, filtered by domain and status.",
  },
  {
    name: "decisions.why",
    args: '{ "object": "model:fct_net_patient_revenue" }',
    returns: "The decision chain behind an object, including what each version superseded.",
  },
  {
    name: "decisions.open_tap",
    args: '{ "question": "...", "domain": "finance.revenue", "class": "strategic" }',
    returns:
      "No governing decision exists — so the agent asks a human instead of guessing. This is the closing of the loop.",
  },
] as const;

export const MCP_EXCHANGE = {
  request: `→ decisions.for_object
  { "object": "metric:net_patient_revenue" }`,
  response: `← 1 active decision
  {
    "decision_id": "dec_01JQ8F2K7Y3M",
    "answer": "Yes — exclude self-pay",
    "decided_by": "Robert Marsh (cxo)",
    "confidence_signals": {
      "authority": "cxo",
      "durability": "survived 60d",
      "superseded": false
    },
    "governs": 31
  }`,
};

/**
 * The point of the whole section: same task, same agent, one difference in
 * what it was allowed to know.
 */
export const AGENT_COMPARISON = {
  task: "Add a year-over-year growth metric on net patient revenue.",
  without: {
    label: "Schemas only",
    code: [
      { sign: " ", text: "-- inferred from column names and sample data" },
      { sign: "+", text: "sum(gross_charges - contractual_allowance)" },
      { sign: "+", text: "  as net_revenue_yoy_base" },
    ],
    verdict: "Plausible, confident, and wrong.",
    why: "Self-pay is included. The new metric silently disagrees with the board pack, and nobody notices for a quarter.",
  },
  with: {
    label: "Schemas + decision ledger",
    code: [
      { sign: " ", text: "-- dec_01JQ8F2K7Y3M · CFO, 2026-08-04" },
      { sign: "+", text: "sum(gross_charges - contractual_allowance)" },
      { sign: "+", text: "  filter (where payer_type != 'self_pay')" },
      { sign: "+", text: "  as net_revenue_yoy_base" },
    ],
    verdict: "Correct, and it cites why.",
    why: "The agent found the governing decision, applied it, and left the reference in the code for the next reader.",
  },
};
