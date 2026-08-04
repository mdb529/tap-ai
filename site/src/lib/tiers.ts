/**
 * Pricing tiers, inlined as plain data.
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
 * The MVP reads these from config/plan.yml so an admin can edit them. The site
 * cannot: it has no filesystem at runtime and no YAML dependency, by design.
 * Keeping a small hand-maintained copy is the right trade — the alternative is
 * dragging a parser and a build step into a static marketing page.
 *
 * If the tiers change, change them in both places. There are three of them.
 */

export interface Tier {
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  highlight?: boolean;
  gates: { label: string; value: string; strong?: boolean; absent?: boolean }[];
}

export const TIERS: Tier[] = [
  {
    name: "Starter",
    price: "Free",
    cadence: "",
    tagline: "Prove the loop on one system, with ten people.",
    gates: [
      { label: "End users who can tap", value: "Up to 10", strong: true },
      { label: "Source systems", value: "1" },
      { label: "Question categories", value: "Records, quality, logic" },
      { label: "Tap classes", value: "Tactical only" },
      { label: "How taps get raised", value: "Triggered by an event" },
      { label: "Automatic detection", value: "Not included", absent: true },
      { label: "AI agent audit", value: "Not included", absent: true },
      { label: "Channels", value: "Slack and in-app" },
      { label: "Decision ledger", value: "Read-only" },
      { label: "AI agent access", value: "Not included", absent: true },
      { label: "SSO", value: "Not included", absent: true },
      { label: "Support", value: "Community" },
    ],
  },
  {
    name: "Growth",
    price: "$54,000",
    cadence: "per year",
    tagline: "Govern the decisions that cross team boundaries.",
    highlight: true,
    gates: [
      { label: "End users who can tap", value: "Up to 50", strong: true },
      { label: "Source systems", value: "Up to 5" },
      { label: "Question categories", value: "All five" },
      { label: "Tap classes", value: "All three, incl. strategic", strong: true },
      { label: "How taps get raised", value: "Triggered + automatic" },
      { label: "Automatic detection", value: "Included", strong: true },
      { label: "AI agent audit", value: "Not included", absent: true },
      { label: "Channels", value: "Slack, Teams, email, Claude" },
      { label: "Decision ledger", value: "Exportable" },
      { label: "AI agent access", value: "MCP server included", strong: true },
      { label: "SSO", value: "Included, with audit export" },
      { label: "Support", value: "Business hours" },
    ],
  },
  {
    name: "Enterprise",
    price: "$145,000",
    cadence: "per year",
    tagline: "Company-wide, with an agent finding what nobody configured.",
    gates: [
      { label: "End users who can tap", value: "50+, unlimited", strong: true },
      { label: "Source systems", value: "Unlimited" },
      { label: "Question categories", value: "All five, plus your own" },
      { label: "Tap classes", value: "All three, incl. strategic", strong: true },
      { label: "How taps get raised", value: "Triggered + automatic + audit" },
      { label: "Automatic detection", value: "Included", strong: true },
      { label: "AI agent audit", value: "Included", strong: true },
      { label: "Channels", value: "All, plus custom" },
      { label: "Decision ledger", value: "Exportable" },
      { label: "AI agent access", value: "MCP server included", strong: true },
      { label: "SSO", value: "Included, with SCIM" },
      { label: "Support", value: "Dedicated, with an SLA" },
    ],
  },
];

/** Stated plainly because it is the thing people ask about first. */
export const PRICING_PRINCIPLE = {
  headline: "We never charge per question.",
  body:
    "Taps are unlimited on every tier. Price scales with how many people you include, how many categories of question you unlock, and how much of the detection we do for you. Charging per question would put us in the business of sending more of them — and every tap answered is a question we should never need to ask again.",
};
