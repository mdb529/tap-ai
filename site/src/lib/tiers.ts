/**
 * Pricing tiers, inlined as plain data.
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
    tagline: "Prove the loop on one system.",
    gates: [
      { label: "Source systems", value: "1" },
      { label: "Question types", value: "Routine and recurring" },
      { label: "Company-level decisions", value: "Not included", absent: true },
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
      { label: "Source systems", value: "Up to 5" },
      { label: "Question types", value: "All three classes" },
      { label: "Company-level decisions", value: "Included", strong: true },
      { label: "Channels", value: "Slack, Teams, email, assistant" },
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
    tagline: "Company-wide, with your own question types.",
    gates: [
      { label: "Source systems", value: "Unlimited" },
      { label: "Question types", value: "All three, plus your own" },
      { label: "Company-level decisions", value: "Included", strong: true },
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
    "Taps are unlimited on every tier. Price is a function of how much of the business you are governing — how many systems are connected, and whether company-level decisions are included. Charging per question would put us in the business of sending more of them.",
};
