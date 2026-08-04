import { q } from "@/lib/duckdb";
import { plan } from "@/lib/config";
import { Badge, Card, Lines, Note, PALETTE, PageHeader, Stat, StatRow, Table, Td } from "@/components/ui";
import { money, monthLabel, pct } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * Pricing and value.
 *
 * Replaces the old billing page. Two things it deliberately no longer shows:
 *
 *   * per-tap consumption against an allowance -- taps are unlimited on every
 *     tier now, because most tap types exhaust their own question space and
 *     metering a number that structurally decays means revenue falls as the
 *     product succeeds
 *   * the incentive pool -- paying per contribution bought administrative
 *     weight to purchase something the product should earn on its own
 *
 * What it shows instead: what tier you are on and why, adoption over time, and
 * the value arithmetic in full so a CFO can argue with the assumptions rather
 * than distrust the total.
 */

interface Gates {
  connectors: number | string;
  tap_classes: string[];
  channels: string[];
  decision_ledger: string;
  ai_agent_access: boolean;
  sso: boolean;
  audit_export: boolean;
  custom_tap_types: boolean;
  support: string;
}
interface PlanCfg {
  account: { company: string; account_id: string; billing_contact: string };
  subscription: {
    plan: string;
    period_start: string;
    period_end: string;
    annual_fee: number;
    connectors_used: number;
    domains_governed: number;
    taps_included: string;
  };
  plan_tiers: { name: string; annual_fee: number; tagline: string; gates: Gates }[];
  gate_labels: Record<string, string>;
  tier_rationale: Record<string, string>;
  value_assumptions: Record<string, number>;
}

const fmtGate = (v: unknown): string => {
  if (typeof v === "boolean") return v ? "✓" : "—";
  if (Array.isArray(v)) return v.length > 3 ? `all ${v.length}` : v.join(", ");
  if (v === "unlimited") return "Unlimited";
  return String(v).replace(/_/g, " ");
};

export default async function PricingPage() {
  const cfg = plan() as unknown as PlanCfg;
  const sub = cfg.subscription;
  const a = cfg.value_assumptions;
  const current = cfg.plan_tiers.find((t) => t.name === sub.plan) ?? cfg.plan_tiers[1];

  const [adoption, impactByClass, deptMix] = await Promise.all([
    q<{
      month: string;
      triggers: number;
      suppressed: number;
      delivered_taps: number;
      resolved_taps: number;
      unresolved_taps: number;
      cumulative_resolved: number;
    }>(`SELECT * FROM adoption_by_month ORDER BY month`),
    q<{ tap_class: string; n: number; minutes: number; incidents: number }>(
      `SELECT tap_class, COUNT(*) AS n, SUM(est_minutes_saved) AS minutes,
              COUNT(*) FILTER (WHERE impact_type = 'incident_avoided') AS incidents
       FROM tap_impacts GROUP BY tap_class`
    ),
    q<{ department: string; people: number; resolved: number }>(
      `SELECT responder_department AS department,
              COUNT(DISTINCT responder_email) AS people,
              COUNT(*) AS resolved
       FROM tap_responses WHERE outcome = 'answered'
       GROUP BY 1 ORDER BY resolved DESC`
    ),
  ]);

  const months = adoption.map((u) => u.month);
  const resolvedTotal = adoption.reduce((s, u) => s + u.resolved_taps, 0);
  const monthsElapsed = adoption.length;
  const contributors = deptMix.reduce((s, d) => s + d.people, 0);

  // ---- value, shown as arithmetic ----------------------------------------
  const strat = impactByClass.find((i) => i.tap_class === "strategic");
  const tact = impactByClass.filter((i) => i.tap_class !== "strategic");
  const tactN = tact.reduce((s, i) => s + i.n, 0);
  const stratValue = (strat?.n ?? 0) * a.rework_hours_avoided_per_strategic_decision * a.blended_hourly_cost_analytics_engineer;
  const tactValue = tactN * a.rework_hours_avoided_per_routine_decision * a.blended_hourly_cost_analytics_engineer;
  const incidentValue = (strat?.incidents ?? 0) * a.incident_cost_avoided_per_prevented_inconsistency;
  const gross = stratValue + tactValue + incidentValue;
  const net = gross * a.attribution_haircut;
  const feeToDate = (sub.annual_fee / 12) * monthsElapsed;
  const multiple = feeToDate > 0 ? net / feeToDate : 0;

  const GATE_ORDER: (keyof Gates)[] = [
    "connectors",
    "tap_classes",
    "channels",
    "decision_ledger",
    "ai_agent_access",
    "sso",
    "audit_export",
    "custom_tap_types",
    "support",
  ];

  return (
    <>
      <PageHeader
        eyebrow="Pricing"
        title="Priced on how much you govern, not how often we interrupt"
        lede={`${cfg.account.company} · ${cfg.account.account_id}. Taps are unlimited on every tier — charging per tap would put us in the business of sending more of them.`}
      />

      <StatRow>
        <Stat label={`${sub.plan} plan`} value={money(sub.annual_fee)} sub={`annual · term ends ${sub.period_end}`} />
        <Stat
          label="Source systems connected"
          value={`${sub.connectors_used} of ${fmtGate(current.gates.connectors)}`}
          sub="the closest honest proxy for governed surface"
        />
        <Stat label="Domains governed" value={sub.domains_governed} sub="business areas with an owner on record" />
        <Stat
          label="People contributing"
          value={contributors}
          sub={`${resolvedTotal.toLocaleString()} decisions captured`}
          tone="good"
        />
      </StatRow>

      <div className="mt-6 space-y-5">
        <Card
          title="Tiers"
          subtitle="Only the rows that genuinely change between tiers are listed. If a capability is the same everywhere it does not belong in a pricing table."
        >
          <Table head={["", ...cfg.plan_tiers.map((t) => t.name)]} dense>
            <tr>
              <Td className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Annual</Td>
              {cfg.plan_tiers.map((t) => (
                <Td key={t.name} className={t.name === sub.plan ? "font-semibold text-teal-800" : "font-medium"}>
                  {t.annual_fee ? money(t.annual_fee) : "Free"}
                  {t.name === sub.plan && <Badge tone="teal">current</Badge>}
                </Td>
              ))}
            </tr>
            <tr>
              <Td className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">For</Td>
              {cfg.plan_tiers.map((t) => (
                <Td key={t.name} className="text-[11.5px] text-slate-600">
                  {t.tagline}
                </Td>
              ))}
            </tr>
            {GATE_ORDER.map((g) => (
              <tr key={g}>
                <Td className="text-xs text-slate-700">{cfg.gate_labels[g] ?? g}</Td>
                {cfg.plan_tiers.map((t) => {
                  const v = t.gates[g];
                  const strategic = g === "tap_classes" && Array.isArray(v) && v.includes("strategic");
                  return (
                    <Td
                      key={t.name}
                      className={`text-[11.5px] ${
                        v === false ? "text-slate-300" : strategic ? "font-medium text-violet-700" : "text-slate-700"
                      }`}
                    >
                      {g === "tap_classes" && Array.isArray(v)
                        ? v.map((c) => c[0].toUpperCase() + c.slice(1)).join(" · ")
                        : fmtGate(v)}
                    </Td>
                  );
                })}
              </tr>
            ))}
          </Table>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(cfg.tier_rationale).map(([k, v]) => (
              <Note key={k} title={k === "strategic_taps" ? "Why strategic taps are gated" : "Why connectors are the meter"}>
                {v}
              </Note>
            ))}
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <Card
            title="Adoption"
            subtitle="Not consumption. The question is whether people are answering, not how many notifications we sent."
          >
            <Lines
              categories={months.map(monthLabel)}
              series={[
                { name: "decisions captured (cumulative)", values: adoption.map((u) => u.cumulative_resolved), color: PALETTE[0] },
              ]}
            />
            <Table head={["Month", "Signals", "Suppressed", "Asked", "Answered", "Unanswered"]} dense>
              {adoption.map((u) => (
                <tr key={u.month}>
                  <Td className="text-xs font-medium">{monthLabel(u.month)}</Td>
                  <Td className="tabular-nums text-xs text-slate-500">{u.triggers}</Td>
                  <Td className="tabular-nums text-xs text-slate-500">{u.suppressed}</Td>
                  <Td className="tabular-nums text-xs">{u.delivered_taps}</Td>
                  <Td className="tabular-nums text-xs font-medium text-teal-700">{u.resolved_taps}</Td>
                  <Td className="tabular-nums text-xs text-slate-500">{u.unresolved_taps}</Td>
                </tr>
              ))}
            </Table>
            <Note title="Suppression is a feature we are not paid to reduce">
              Roughly a third of signals never become a tap, mostly because the same question was
              already answered. Under per-tap pricing that column would be lost revenue. Under tier
              pricing it is just the product working.
            </Note>
          </Card>

          <div className="space-y-5">
            <Card
              title="Value"
              subtitle="Arithmetic, not a headline. Every input is an assumption declared in config/plan.yml."
            >
              <Table head={["Line", "Basis", "Amount"]} dense>
                {[
                  [
                    "Company decisions",
                    `${strat?.n ?? 0} × ${a.rework_hours_avoided_per_strategic_decision}h × ${money(a.blended_hourly_cost_analytics_engineer)}`,
                    stratValue,
                  ],
                  [
                    "Routine decisions",
                    `${tactN} × ${a.rework_hours_avoided_per_routine_decision}h × ${money(a.blended_hourly_cost_analytics_engineer)}`,
                    tactValue,
                  ],
                  [
                    "Incidents avoided",
                    `${strat?.incidents ?? 0} × ${money(a.incident_cost_avoided_per_prevented_inconsistency)}`,
                    incidentValue,
                  ],
                ].map(([l, b, v]) => (
                  <tr key={String(l)}>
                    <Td className="text-xs">{l}</Td>
                    <Td className="text-[11px] text-slate-500">{b}</Td>
                    <Td className="tabular-nums text-xs font-medium">{money(v as number)}</Td>
                  </tr>
                ))}
                <tr>
                  <Td className="text-xs">Attribution haircut</Td>
                  <Td className="text-[11px] text-slate-500">
                    ×{a.attribution_haircut} — we do not claim full credit for a decision a human made
                  </Td>
                  <Td className="tabular-nums text-xs text-rose-700">−{money(gross - net)}</Td>
                </tr>
                <tr className="bg-slate-50">
                  <Td className="text-xs font-semibold">Net modeled value</Td>
                  <Td className="text-[11px] text-slate-500">{monthsElapsed} months</Td>
                  <Td className="tabular-nums text-xs font-semibold text-teal-700">{money(net)}</Td>
                </tr>
                <tr>
                  <Td className="text-xs">Cost</Td>
                  <Td className="text-[11px] text-slate-500">subscription only — taps are unlimited</Td>
                  <Td className="tabular-nums text-xs">{money(feeToDate)}</Td>
                </tr>
              </Table>
              <div className="mt-3 flex items-baseline gap-2 rounded bg-teal-50 px-3 py-2">
                <span className="text-xs font-medium text-teal-900">Modeled return</span>
                <span className="text-lg font-semibold tabular-nums text-teal-800">{multiple.toFixed(1)}×</span>
              </div>
              <Note title="What would make this defensible">
                Every figure traces to an assumption, which is honest but is not proof. Measuring real
                avoided rework needs a holdout — a set of models with taps disabled, compared on
                incident and revision rate. Until that exists, present this as a model.
              </Note>
            </Card>

            <Card title="Who is contributing" subtitle="Breadth matters more than volume here.">
              <Table head={["Department", "People", "Decisions"]} dense>
                {deptMix.map((d) => (
                  <tr key={d.department}>
                    <Td className="text-xs">{d.department}</Td>
                    <Td className="tabular-nums text-xs">{d.people}</Td>
                    <Td className="tabular-nums text-xs">{d.resolved}</Td>
                  </tr>
                ))}
              </Table>
              <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                A tier upgrade is justified by more of the business participating, not by more
                notifications being sent to the same people.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
