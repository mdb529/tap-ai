import { q } from "@/lib/duckdb";
import { plan } from "@/lib/config";
import {
  Badge,
  BarList,
  Card,
  Lines,
  Note,
  PALETTE,
  PageHeader,
  StackedBars,
  Stat,
  StatRow,
  Table,
  Td,
  classTone,
} from "@/components/ui";
import { money, monthLabel, pct, titleize } from "@/lib/format";

export const dynamic = "force-dynamic";

interface PlanCfg {
  account: { company: string; account_id: string; billing_contact: string };
  subscription: {
    plan: string;
    period_start: string;
    period_end: string;
    platform_fee_annual: number;
    included_resolved_taps: number;
    overage_rate_per_tap: number;
    metered_on: string;
  };
  plan_tiers: {
    name: string;
    platform_fee_annual: number;
    included_resolved_taps: number;
    overage_rate_per_tap: number;
    features: string[];
  }[];
  incentive_pool: {
    fiscal_year: string;
    funded_by: string;
    total_funded: number;
    durability_window_days: number;
    payout_cadence: string;
    eligibility: { exclude_authority_levels: string[]; min_response_quality_score: number };
    caps: { max_per_person_per_quarter: number; max_per_department_per_quarter: number };
    department_allocations: Record<string, number>;
  };
  roi_assumptions: Record<string, number>;
}

export default async function BillingPage() {
  const cfg = plan() as unknown as PlanCfg;
  const sub = cfg.subscription;
  const pool = cfg.incentive_pool;
  const a = cfg.roi_assumptions;

  const [usage, ledgerByDept, ledgerByQuarter, impactByClass, topEarners] = await Promise.all([
    q<{
      month: string;
      triggers: number;
      suppressed: number;
      delivered_taps: number;
      resolved_taps: number;
      unresolved_taps: number;
      cumulative_resolved: number;
      included_allowance_to_date: number;
      overage_taps: number;
      overage_amount_usd: number;
    }>(`SELECT * FROM billing_usage ORDER BY month`),
    q<{ department: string; paid: number; entries: number; people: number }>(
      `SELECT department, SUM(amount_usd) AS paid, COUNT(*) AS entries,
              COUNT(DISTINCT employee_email) AS people
       FROM incentive_ledger GROUP BY department ORDER BY paid DESC`
    ),
    q<{ quarter: string; amount: number; entries: number; status: string }>(
      `SELECT quarter, SUM(amount_usd) AS amount, COUNT(*) AS entries, MAX(status) AS status
       FROM incentive_ledger GROUP BY quarter ORDER BY quarter`
    ),
    q<{ tap_class: string; n: number; minutes: number; inconsistencies: number; incidents: number }>(
      `SELECT tap_class, COUNT(*) AS n, SUM(est_minutes_saved) AS minutes,
              COALESCE(SUM(magnitude) FILTER (WHERE impact_type = 'inconsistency_prevented'), 0) AS inconsistencies,
              COUNT(*) FILTER (WHERE impact_type = 'incident_avoided') AS incidents
       FROM tap_impacts GROUP BY tap_class`
    ),
    q<{ employee_name: string; department: string; authority_level: string; amount: number; entries: number }>(
      `SELECT employee_name, department, authority_level, SUM(amount_usd) AS amount, COUNT(*) AS entries
       FROM incentive_ledger GROUP BY 1, 2, 3 ORDER BY amount DESC LIMIT 10`
    ),
  ]);

  const months = usage.map((u) => u.month);
  const labels = months.map(monthLabel);
  const resolvedTotal = usage.reduce((s, u) => s + u.resolved_taps, 0);
  const overageTotal = usage.reduce((s, u) => s + u.overage_amount_usd, 0);
  const pctUsed = (resolvedTotal / sub.included_resolved_taps) * 100;

  // months elapsed in the term, for run-rate
  const monthsElapsed = usage.length;
  const runRateAnnual = Math.round((resolvedTotal / monthsElapsed) * 12);

  const poolPaid = ledgerByDept.reduce((s, d) => s + d.paid, 0);
  const poolRemaining = pool.total_funded - poolPaid;

  // ---- ROI, shown as arithmetic ------------------------------------------
  const strat = impactByClass.find((i) => i.tap_class === "strategic");
  const tact = impactByClass.find((i) => i.tap_class === "tactical");
  const stratHours = (strat?.n ?? 0) * a.rework_hours_avoided_per_strategic_tap;
  const tactHours = (tact?.n ?? 0) * a.rework_hours_avoided_per_tactical_tap;
  const stratValue = stratHours * a.blended_hourly_cost_analytics_engineer;
  const tactValue = tactHours * a.blended_hourly_cost_analytics_engineer;
  const incidentValue = (strat?.incidents ?? 0) * a.incident_cost_avoided_per_prevented_inconsistency;
  const grossValue = stratValue + tactValue + incidentValue;
  const netValue = grossValue * a.attribution_haircut;
  const feeToDate = (sub.platform_fee_annual / 12) * monthsElapsed;
  const cost = feeToDate + overageTotal + poolPaid;
  const multiple = cost > 0 ? netValue / cost : 0;

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Plan, pool, and return"
        lede={`${cfg.account.company} -- ${cfg.account.account_id}. Two money flows kept deliberately apart: what you pay TapIQ, and what you pay your own people for contributing context. TapIQ never touches the second one.`}
      />

      <StatRow>
        <Stat
          label={`${sub.plan} plan`}
          value={money(sub.platform_fee_annual)}
          sub={`annual platform fee · term ends ${sub.period_end}`}
        />
        <Stat
          label="Resolved taps used"
          value={`${resolvedTotal.toLocaleString()} / ${sub.included_resolved_taps.toLocaleString()}`}
          sub={`${pct(pctUsed)} of tier · run rate ${runRateAnnual.toLocaleString()}/yr`}
          tone={pctUsed > 90 ? "warn" : "good"}
        />
        <Stat
          label="Overage"
          value={money(overageTotal)}
          sub={`at ${money(sub.overage_rate_per_tap, true)}/tap beyond tier`}
          tone={overageTotal > 0 ? "warn" : "good"}
        />
        <Stat
          label="Incentive pool remaining"
          value={money(poolRemaining)}
          sub={`${money(poolPaid)} allocated of ${money(pool.total_funded)}`}
        />
      </StatRow>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          <Card
            title="Consumption against tier"
            subtitle={`Metered on ${titleize(sub.metered_on)}. Delivered-but-ignored taps are never billed.`}
          >
            <Lines
              categories={labels}
              series={[
                {
                  name: "cumulative resolved",
                  values: usage.map((u) => u.cumulative_resolved),
                  color: PALETTE[0],
                },
                {
                  name: "included allowance",
                  values: usage.map((u) => u.included_allowance_to_date),
                  color: "#94a3b8",
                },
              ]}
            />
            <Table
              head={["Month", "Triggers", "Suppressed", "Delivered", "Resolved (billable)", "Unresolved", "Overage $"]}
              dense
            >
              {usage.map((u) => (
                <tr key={u.month}>
                  <Td className="text-xs font-medium">{monthLabel(u.month)}</Td>
                  <Td className="tabular-nums text-xs text-slate-500">{u.triggers}</Td>
                  <Td className="tabular-nums text-xs text-slate-500">{u.suppressed}</Td>
                  <Td className="tabular-nums text-xs">{u.delivered_taps}</Td>
                  <Td className="tabular-nums text-xs font-medium">{u.resolved_taps}</Td>
                  <Td className="tabular-nums text-xs text-slate-500">{u.unresolved_taps}</Td>
                  <Td className="tabular-nums text-xs">{u.overage_amount_usd ? money(u.overage_amount_usd) : "--"}</Td>
                </tr>
              ))}
            </Table>
            <Note title="The pricing problem, stated plainly">
              Run rate is {runRateAnnual.toLocaleString()} resolved taps a year against a{" "}
              {sub.included_resolved_taps.toLocaleString()} tier. That is roughly the right tier
              — but it is ten times smaller than the original assumption, because most tap
              types exhaust their own question space once the org has answered them. Metering a
              product on a number that structurally decays means revenue falls as the product
              succeeds. Weight the platform fee, or meter something that grows — source
              objects under coverage, say — but do not pretend per-tap volume compounds.
            </Note>
          </Card>

          <Card
            title="Return on the program"
            subtitle="Shown as arithmetic. A single headline number gets discounted the moment its derivation is hidden."
          >
            <Table head={["Line", "Basis", "Amount"]} dense>
              {[
                [
                  "Strategic taps -- rework avoided",
                  `${strat?.n ?? 0} durable decisions x ${a.rework_hours_avoided_per_strategic_tap}h x ${money(a.blended_hourly_cost_analytics_engineer)}/h`,
                  stratValue,
                ],
                [
                  "Tactical taps -- rework avoided",
                  `${tact?.n ?? 0} durable decisions x ${a.rework_hours_avoided_per_tactical_tap}h x ${money(a.blended_hourly_cost_analytics_engineer)}/h`,
                  tactValue,
                ],
                [
                  "Incidents avoided",
                  `${strat?.incidents ?? 0} x ${money(a.incident_cost_avoided_per_prevented_inconsistency)}`,
                  incidentValue,
                ],
              ].map(([label, basis, amt]) => (
                <tr key={String(label)}>
                  <Td className="text-xs">{label}</Td>
                  <Td className="text-[11px] text-slate-500">{basis}</Td>
                  <Td className="tabular-nums text-xs font-medium">{money(amt as number)}</Td>
                </tr>
              ))}
              <tr className="bg-slate-50">
                <Td className="text-xs font-semibold">Gross modeled value</Td>
                <Td className="text-[11px] text-slate-500">sum of the above</Td>
                <Td className="tabular-nums text-xs font-semibold">{money(grossValue)}</Td>
              </tr>
              <tr>
                <Td className="text-xs">Attribution haircut</Td>
                <Td className="text-[11px] text-slate-500">
                  x{a.attribution_haircut} — TapIQ does not claim full credit for a decision a
                  human made
                </Td>
                <Td className="tabular-nums text-xs text-rose-700">
                  −{money(grossValue - netValue)}
                </Td>
              </tr>
              <tr className="bg-slate-50">
                <Td className="text-xs font-semibold">Net modeled value</Td>
                <Td className="text-[11px] text-slate-500">to date, {monthsElapsed} months</Td>
                <Td className="tabular-nums text-xs font-semibold text-teal-700">{money(netValue)}</Td>
              </tr>
              <tr>
                <Td className="text-xs">Total cost</Td>
                <Td className="text-[11px] text-slate-500">
                  {money(feeToDate)} platform + {money(overageTotal)} overage + {money(poolPaid)}{" "}
                  incentive pool
                </Td>
                <Td className="tabular-nums text-xs">{money(cost)}</Td>
              </tr>
            </Table>
            <div className="mt-3 flex items-baseline gap-2 rounded bg-teal-50 px-3 py-2">
              <span className="text-xs font-medium text-teal-900">Modeled return</span>
              <span className="text-lg font-semibold tabular-nums text-teal-800">
                {multiple.toFixed(1)}x
              </span>
              <span className="text-[11px] text-teal-900/70">
                on {money(cost)} of program cost
              </span>
            </div>
            <Note title="What would make this defensible">
              Every figure above traces to an assumption in <code>config/plan.yml</code>, which is
              honest but not the same as proven. Measuring real avoided rework needs a holdout: a set
              of models with taps disabled, compared on incident and revision rate. Until that
              exists, present this as a model, not a result.
            </Note>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Plan tiers" subtitle="Current tier highlighted.">
            <div className="space-y-2.5">
              {cfg.plan_tiers.map((t) => {
                const current = t.name === sub.plan;
                return (
                  <div
                    key={t.name}
                    className={`rounded-md border px-3.5 py-3 ${
                      current ? "border-teal-600 bg-teal-50/40" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {t.name}
                        {current && (
                          <Badge tone="teal">current</Badge>
                        )}
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-slate-900">
                        {t.platform_fee_annual ? money(t.platform_fee_annual) : "Free"}
                      </p>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600">
                      {t.included_resolved_taps.toLocaleString()} resolved taps included
                      {t.overage_rate_per_tap
                        ? ` · ${money(t.overage_rate_per_tap, true)}/tap over`
                        : ""}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {t.features.map((f) => (
                        <span
                          key={f}
                          className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
                        >
                          {f.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card
            title="Incentive pool"
            subtitle={`${pool.fiscal_year} · funded and allocated by ${pool.funded_by}`}
          >
            <div className="mb-3">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-600">Allocated</span>
                <span className="tabular-nums font-medium">
                  {money(poolPaid)} / {money(pool.total_funded)}
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-teal-600"
                  style={{ width: `${Math.min(100, (poolPaid / pool.total_funded) * 100)}%` }}
                />
              </div>
            </div>
            <BarList
              rows={Object.entries(pool.department_allocations).map(([dept, budget]) => {
                const spent = ledgerByDept.find((d) => d.department === dept)?.paid ?? 0;
                return { label: dept, value: Math.round(spent), note: `of ${money(budget)}` };
              })}
              unit=""
            />
            <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-[11px]">
              {[
                ["Durability window", `${pool.durability_window_days} days -- an answer must survive to earn`],
                ["Payout cadence", titleize(pool.payout_cadence)],
                ["Ineligible", `${pool.eligibility.exclude_authority_levels.join(", ")} -- execs allocate, never receive`],
                ["Min quality score", pool.eligibility.min_response_quality_score],
                ["Cap per person / quarter", money(pool.caps.max_per_person_per_quarter)],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between gap-3">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-right font-medium text-slate-800">{String(v)}</dd>
                </div>
              ))}
            </dl>
            <Note title="Why the durability window has teeth">
              Rewarding click volume buys you fast, wrong answers. Paying only on decisions that
              survive {pool.durability_window_days} days without reversal is the difference between
              an incentive and a bounty on noise.
            </Note>
          </Card>

          <Card title="Pool by quarter" subtitle="">
            <Table head={["Quarter", "Entries", "Amount", "Status"]} dense>
              {ledgerByQuarter.map((r) => (
                <tr key={r.quarter}>
                  <Td className="text-xs font-medium">{r.quarter}</Td>
                  <Td className="tabular-nums text-xs">{r.entries}</Td>
                  <Td className="tabular-nums text-xs">{money(r.amount)}</Td>
                  <Td>
                    <Badge tone={r.status === "paid" ? "teal" : "amber"}>{r.status}</Badge>
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card title="Top contributors" subtitle="Frontline only -- by design.">
            <Table head={["Person", "Decisions", "Earned"]} dense>
              {topEarners.map((e) => (
                <tr key={e.employee_name}>
                  <Td>
                    <div className="text-xs">{e.employee_name}</div>
                    <div className="text-[10px] text-slate-400">
                      {e.department} · {e.authority_level}
                    </div>
                  </Td>
                  <Td className="tabular-nums text-xs">{e.entries}</Td>
                  <Td className="tabular-nums text-xs font-medium">{money(e.amount)}</Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      </div>
    </>
  );
}
