import { cellsForPlan, TOTAL_CELLS, type PlanKey } from "./taxonomy";

/**
 * PRICING TIERS.
 *
 * THE SHAPE OF THE PRICE. Three things scale together, and all three grow as the
 * product succeeds — which per-tap metering did not:
 *
 *   1. END USERS who can answer taps (10 / 50 / unlimited). Contribution is the
 *      value, so contributors are what we meter. A buyer can also verify this
 *      number without trusting our telemetry.
 *   2. QUESTION CATEGORIES unlocked — see FAMILIES in ./taxonomy.
 *   3. HOW TAPS GET RAISED — deterministic triggers, then automatic pattern
 *      detection, then an AI agent audit. Each needs strictly more inference
 *      than the last, so the axis prices itself.
 *
 * WHY ROWS ARE DECLARED ONCE, SEPARATELY FROM TIERS. Every tier used to carry its
 * own free-form list of gates. That let a row exist on one tier and quietly go
 * missing on another — which is exactly the comparison a buyer is trying to make.
 * ROWS is now the single ordered spec and each tier must supply a value for every
 * key, so a missing cell is a type error instead of a hole in the table.
 *
 * The count in `categories` is COMPUTED from the taxonomy rather than typed.
 * "12 of 14" is a derived fact, and derived facts that get typed by hand are the
 * ones that go stale.
 *
 * MVP PARITY. config/plan.yml is the editable source for an admin; this file is
 * the site's copy, since the site has no filesystem or YAML at runtime.
 * scripts/drift_check.py fails the build when the two disagree.
 */

export type RowKey =
  | "endUsers"
  | "connectors"
  | "categories"
  | "classes"
  | "strategic"
  | "triggered"
  | "automatic"
  | "audit"
  | "channels"
  | "ledger"
  | "agentAccess"
  | "sso"
  | "support";

export interface GateRow {
  key: RowKey;
  /** Section heading in the full comparison table. */
  group: string;
  label: string;
  /**
   * Shown on the tier card itself. Only the handful of rows that genuinely
   * differentiate — a card listing thirteen rows is a card nobody reads.
   */
  hero?: boolean;
}

export const ROWS: GateRow[] = [
  { key: "endUsers", group: "Reach", label: "People who can answer taps", hero: true },
  { key: "connectors", group: "Reach", label: "Source systems connected" },
  { key: "categories", group: "What gets asked", label: "Question categories", hero: true },
  { key: "classes", group: "What gets asked", label: "Tap classes" },
  { key: "strategic", group: "What gets asked", label: "Company-level decisions", hero: true },
  { key: "triggered", group: "How taps are found", label: "Triggered by an event" },
  {
    key: "automatic",
    group: "How taps are found",
    label: "Automatic pattern detection",
    hero: true,
  },
  { key: "audit", group: "How taps are found", label: "AI agent audit", hero: true },
  { key: "channels", group: "Platform", label: "Delivery channels" },
  { key: "ledger", group: "Platform", label: "Decision ledger" },
  { key: "agentAccess", group: "Platform", label: "AI agent access (MCP)" },
  { key: "sso", group: "Platform", label: "SSO" },
  { key: "support", group: "Platform", label: "Support" },
];

export const ROW_GROUPS = ["Reach", "What gets asked", "How taps are found", "Platform"] as const;

export interface Cell {
  text: string;
  /** true → tick, false → dash, undefined → a plain value with no verdict. */
  yes?: boolean;
}

export interface Tier {
  name: string;
  planKey: PlanKey;
  price: string;
  cadence: string;
  tagline: string;
  /** The one number worth setting in large type. */
  headline: { stat: string; unit: string };
  /** What this tier adds over the one below it. null on the entry tier. */
  adds: string | null;
  highlight?: boolean;
  cells: Record<RowKey, Cell>;
}

const categories = (p: PlanKey): Cell => ({ text: `${cellsForPlan(p)} of ${TOTAL_CELLS}` });

export const TIERS: Tier[] = [
  {
    name: "Starter",
    planKey: "starter",
    price: "Free",
    cadence: "",
    tagline: "Prove the loop with a small group.",
    headline: { stat: "10", unit: "people can answer taps" },
    adds: null,
    cells: {
      endUsers: { text: "Up to 10" },
      connectors: { text: "1" },
      categories: categories("starter"),
      classes: { text: "Tactical only" },
      strategic: { text: "Not included", yes: false },
      triggered: { text: "Included", yes: true },
      automatic: { text: "Not included", yes: false },
      audit: { text: "Not included", yes: false },
      channels: { text: "Slack, in-app" },
      ledger: { text: "Read-only" },
      agentAccess: { text: "Not included", yes: false },
      sso: { text: "Not included", yes: false },
      support: { text: "Community" },
    },
  },
  {
    name: "Growth",
    planKey: "growth",
    price: "$54,000",
    cadence: "per year",
    tagline: "Govern the decisions that cross team boundaries.",
    headline: { stat: "50", unit: "people can answer taps" },
    adds:
      "Everything in Starter, plus company-level decisions, automatic detection, and five times the contributors.",
    highlight: true,
    cells: {
      endUsers: { text: "Up to 50" },
      connectors: { text: "Up to 5" },
      categories: categories("growth"),
      classes: { text: "All three" },
      strategic: { text: "Included", yes: true },
      triggered: { text: "Included", yes: true },
      automatic: { text: "Included", yes: true },
      audit: { text: "Not included", yes: false },
      channels: { text: "Slack, Teams, email, Claude" },
      ledger: { text: "Exportable" },
      agentAccess: { text: "MCP server", yes: true },
      sso: { text: "With audit export", yes: true },
      support: { text: "Business hours" },
    },
  },
  {
    name: "Enterprise",
    planKey: "enterprise",
    price: "$145,000",
    cadence: "per year",
    tagline: "Company-wide, with an agent finding what nobody configured.",
    headline: { stat: "Unlimited", unit: "people can answer taps" },
    adds:
      "Everything in Growth, plus the AI agent audit, unlimited contributors, and your own question categories.",
    cells: {
      endUsers: { text: "Unlimited" },
      connectors: { text: "Unlimited" },
      categories: categories("enterprise"),
      classes: { text: "All three, plus your own" },
      strategic: { text: "Included", yes: true },
      triggered: { text: "Included", yes: true },
      automatic: { text: "Included", yes: true },
      audit: { text: "Included", yes: true },
      channels: { text: "All, plus custom" },
      ledger: { text: "Exportable" },
      agentAccess: { text: "MCP server", yes: true },
      sso: { text: "With SCIM", yes: true },
      support: { text: "Dedicated, with an SLA" },
    },
  },
];

/** Stated plainly because it is the thing people ask about first. */
export const PRICING_PRINCIPLE = {
  headline: "We never charge per question.",
  body:
    "Taps are unlimited on every tier. Price scales with how many people you include, how many categories of question you unlock, and how much of the detection we do for you. Charging per question would put us in the business of sending more of them — and every tap answered is a question we should never need to ask again.",
};
