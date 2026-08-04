import Link from "next/link";
import { q } from "@/lib/duckdb";
import { tapTypes } from "@/lib/config";
import {
  Badge,
  BarList,
  Card,
  Funnel,
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
import { duration, monthLabel, pct, titleize } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const types = tapTypes();

  const [funnel, decay, deptMix, routing, leaders, impacts, authMix, precision] = await Promise.all([
    q<{
      month: string;
      triggers_fired: number;
      suppressed_dedupe: number;
      suppressed_rate_limit: number;
      suppressed_low_confidence: number;
      taps_generated: number;
      taps_delivered: number;
      answered: number;
      deflected: number;
      timed_out: number;
      expired: number;
      pending: number;
      writebacks_landed: number;
      answer_rate_pct: number;
    }>(`SELECT * FROM v_funnel_by_month`),
    q<{ tap_type_id: string; month: string; taps: number }>(
      `SELECT tap_type_id, month, taps FROM v_type_decay`
    ),
    q<{ department: string; tap_class: string; taps: number; answered: number; answer_rate_pct: number; people_tapped: number }>(
      `SELECT * FROM v_department_mix`
    ),
    q<{ domain_key: string; routed_via: string; taps: number; deflected: number; deflection_rate_pct: number; answer_rate_pct: number }>(
      `SELECT * FROM v_routing_quality WHERE taps >= 5`
    ),
    q<{ name: string; department: string; authority: string; taps_resolved: number; strategic_resolved: number; avg_quality: number; durability_pct: number; median_minutes: number; incentive_usd: number }>(
      `SELECT * FROM v_leaderboard LIMIT 12`
    ),
    q<{ impact_type: string; tap_class: string; n: number; magnitude: number; minutes: number }>(
      `SELECT impact_type, tap_class, COUNT(*) AS n, SUM(magnitude) AS magnitude,
              SUM(est_minutes_saved) AS minutes
       FROM tap_impacts GROUP BY 1, 2 ORDER BY n DESC`
    ),
    q<{ recipient_authority: string; tap_class: string; taps: number; answer_rate_pct: number; median_minutes: number }>(
      `SELECT t.recipient_authority, t.tap_class, COUNT(*) AS taps,
              ROUND(100.0 * COUNT(*) FILTER (WHERE t.status='answered') / COUNT(*), 1) AS answer_rate_pct,
              ROUND(MEDIAN(r.minutes_to_respond), 0) AS median_minutes
       FROM taps t LEFT JOIN tap_responses r USING (tap_id)
       GROUP BY 1, 2 ORDER BY taps DESC`
    ),
    q<{ tap_type_id: string; precision_pct: number | null; ratings: number; verdict: string }>(
      `SELECT tap_type_id, precision_pct, ratings, verdict FROM v_precision_by_type`
    ),
  ]);

  const months = funnel.map((f) => f.month);
  const labels = months.map(monthLabel);
  const T = (n: number) => n.toLocaleString();

  const totals = funnel.reduce(
    (a, f) => ({
      triggers: a.triggers + f.triggers_fired,
      suppressed: a.suppressed + f.suppressed_dedupe + f.suppressed_rate_limit + f.suppressed_low_confidence,
      dedupe: a.dedupe + f.suppressed_dedupe,
      delivered: a.delivered + f.taps_delivered,
      answered: a.answered + f.answered,
      deflected: a.deflected + f.deflected,
      unresolved: a.unresolved + f.timed_out + f.expired,
      landed: a.landed + f.writebacks_landed,
    }),
    { triggers: 0, suppressed: 0, dedupe: 0, delivered: 0, answered: 0, deflected: 0, unresolved: 0, landed: 0 }
  );

  // per-type monthly series for the decay chart
  const typeIds = [...new Set(decay.map((d) => d.tap_type_id))];
  const decaySeries = typeIds.map((id) => ({
    name: titleize(id).replace(/ /g, " "),
    values: months.map((m) => decay.find((d) => d.tap_type_id === id && d.month === m)?.taps ?? null),
  }));

  const clsMonth = await q<{ month: string; tap_class: string; taps: number }>(
    `SELECT month, tap_class, COUNT(*) AS taps FROM taps GROUP BY 1, 2`
  );
  const classSeries = ["tactical", "strategic"].map((cls) => ({
    name: cls,
    color: cls === "strategic" ? PALETTE[1] : PALETTE[2],
    values: months.map((m) => clsMonth.find((c) => c.month === m && c.tap_class === cls)?.taps ?? 0),
  }));

  const deptTotals = Object.entries(
    deptMix.reduce<Record<string, number>>((a, d) => {
      a[d.department] = (a[d.department] ?? 0) + d.taps;
      return a;
    }, {})
  )
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const totalMinutes = impacts.reduce((s, i) => s + i.minutes, 0);

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Decisions, and what they cost to get"
        lede="Four questions this page has to answer: where taps die, whether they were worth asking, who is carrying the load, and what the answers changed downstream."
      />

      <StatRow>
        <Stat label="Triggers fired" value={T(totals.triggers)} sub={`${T(totals.suppressed)} suppressed before delivery`} />
        <Stat
          label="Taps answered"
          value={T(totals.answered)}
          sub={`${pct((totals.answered / totals.delivered) * 100)} of delivered`}
          tone={totals.answered / totals.delivered > 0.6 ? "good" : "warn"}
        />
        <Stat label="Artifacts landed" value={T(totals.landed)} sub="merged PRs and applied overrides" />
        <Stat
          label="Modeled hours saved"
          value={T(Math.round(totalMinutes / 60))}
          sub="assumption-based -- see plan.yml"
          tone="good"
        />
      </StatRow>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <Card
          title="The funnel"
          subtitle="Suppression is the system working. Timeouts are the system failing quietly."
        >
          <Funnel
            stages={[
              { label: "Triggers fired", value: totals.triggers, note: "four trigger sources" },
              { label: "Survived suppression", value: totals.triggers - totals.suppressed, note: `${T(totals.dedupe)} deduped` },
              { label: "Delivered as taps", value: totals.delivered },
              { label: "Answered", value: totals.answered, note: `${T(totals.deflected)} deflected, ${T(totals.unresolved)} never answered` },
              { label: "Artifact landed", value: totals.landed, note: "PR closed unmerged or override rejected" },
            ]}
          />
          <Note title="Read the second stage as a feature">
            Just over a third of triggers never become taps, mostly dedupe. That suppression is what
            keeps the channel usable — and it is also why per-tap pricing is structurally
            awkward. The better the system gets, the fewer taps it bills for.
          </Note>
        </Card>

        <div className="space-y-5">
          <Card
            title="Volume by tap class"
            subtitle="Strategic taps are ~4% of volume and carry most of the modeled value."
          >
            <StackedBars categories={labels} series={classSeries} height={170} />
          </Card>

          <Card
            title="Per-type decay under net growth"
            subtitle="The most commercially important chart here."
          >
            <Lines categories={labels} series={decaySeries} height={200} />
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Seven of eight tap types are bounded by a fixed taxonomy and exhaust their question
              space. Only <code>phi_column_classification</code> sustains, because new columns are
              created continuously by ordinary engineering work. Net volume grows because coverage
              expands, not because any one type scales.
            </p>
          </Card>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card title="Precision by tap type" subtitle="Rated 'worth asking' by the recipient. The 60% line is the ship gate.">
          <BarList
            rows={[...precision]
              .sort((a, b) => (a.precision_pct ?? 0) - (b.precision_pct ?? 0))
              .map((p) => ({
                label: titleize(p.tap_type_id),
                value: Math.round(p.precision_pct ?? 0),
                note: p.verdict === "low sample" ? `n=${p.ratings}` : undefined,
              }))}
            unit="%"
            colorFor={(r) => (r.value < 60 ? "#be123c" : r.value < 80 ? "#b45309" : "#0f766e")}
          />
        </Card>

        <Card title="Taps by department" subtitle="Where the context actually lives.">
          <BarList rows={deptTotals} />
          <div className="mt-4">
            <Table head={["Department", "Class", "Taps", "Answer rate", "People"]} dense>
              {deptMix.map((d) => (
                <tr key={`${d.department}-${d.tap_class}`}>
                  <Td className="text-xs">{d.department}</Td>
                  <Td>
                    <Badge tone={classTone(d.tap_class)}>{d.tap_class}</Badge>
                  </Td>
                  <Td className="tabular-nums text-xs">{d.taps}</Td>
                  <Td className="tabular-nums text-xs">{pct(d.answer_rate_pct)}</Td>
                  <Td className="tabular-nums text-xs">{d.people_tapped}</Td>
                </tr>
              ))}
            </Table>
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card
          title="Routing quality"
          subtitle="Deflection rate is the honest measure of whether org/domains.yml is right."
        >
          <Table head={["Domain", "Resolved via", "Taps", "Deflection", "Answer rate"]} dense>
            {routing.map((r) => (
              <tr key={`${r.domain_key}-${r.routed_via}`}>
                <Td mono className="text-[11px]">
                  {r.domain_key}
                </Td>
                <Td>
                  <Badge tone={r.routed_via === "codeowners" ? "teal" : "slate"}>
                    {titleize(r.routed_via)}
                  </Badge>
                </Td>
                <Td className="tabular-nums text-xs">{r.taps}</Td>
                <Td className={`tabular-nums text-xs ${r.deflection_rate_pct > 15 ? "font-medium text-rose-700" : ""}`}>
                  {pct(r.deflection_rate_pct)}
                </Td>
                <Td className="tabular-nums text-xs">{pct(r.answer_rate_pct)}</Td>
              </tr>
            ))}
          </Table>
          <Note title="High deflection is training data, not failure">
            Every “not me, ask Dana” is a correction to the domain ownership map. That is
            why deflection is a first-class button rather than an error state — it lets the
            ownership file start wrong on purpose and converge.
          </Note>
        </Card>

        <Card title="Response behavior by authority" subtitle="The case for batching by seniority.">
          <Table head={["Authority", "Class", "Taps", "Answer rate", "Median"]} dense>
            {authMix.map((a) => (
              <tr key={`${a.recipient_authority}-${a.tap_class}`}>
                <Td className="text-xs">{a.recipient_authority}</Td>
                <Td>
                  <Badge tone={classTone(a.tap_class)}>{a.tap_class}</Badge>
                </Td>
                <Td className="tabular-nums text-xs">{a.taps}</Td>
                <Td className="tabular-nums text-xs">{pct(a.answer_rate_pct)}</Td>
                <Td className="tabular-nums text-xs">{duration(a.median_minutes)}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card
          title="Who is carrying the context load"
          subtitle="Ranked by resolved taps. Durability matters more than volume -- an answer that gets reversed cost the org twice."
        >
          <Table head={["Person", "Resolved", "Strategic", "Quality", "Durability", "Median", "Incentive"]} dense>
            {leaders.map((l) => (
              <tr key={l.name}>
                <Td>
                  <div className="text-xs font-medium">{l.name}</div>
                  <div className="text-[10px] text-slate-400">
                    {l.department} · {l.authority}
                  </div>
                </Td>
                <Td className="tabular-nums text-xs">{l.taps_resolved}</Td>
                <Td className="tabular-nums text-xs">{l.strategic_resolved || "--"}</Td>
                <Td className="tabular-nums text-xs">{l.avg_quality}</Td>
                <Td className={`tabular-nums text-xs ${l.durability_pct < 80 ? "text-amber-700" : ""}`}>
                  {pct(l.durability_pct)}
                </Td>
                <Td className="tabular-nums text-xs">{duration(l.median_minutes)}</Td>
                <Td className="tabular-nums text-xs">
                  {l.incentive_usd ? `$${Math.round(l.incentive_usd).toLocaleString()}` : "--"}
                </Td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card title="Downstream ramifications" subtitle="What the answers actually changed.">
          <Table head={["Impact", "Class", "Count", "Magnitude"]} dense>
            {impacts.map((i) => (
              <tr key={`${i.impact_type}-${i.tap_class}`}>
                <Td className="text-xs">{titleize(i.impact_type)}</Td>
                <Td>
                  <Badge tone={classTone(i.tap_class)}>{i.tap_class}</Badge>
                </Td>
                <Td className="tabular-nums text-xs">{i.n}</Td>
                <Td className="tabular-nums text-xs">{i.magnitude}</Td>
              </tr>
            ))}
          </Table>
          <Note title="These are modeled, not measured">
            Magnitude comes from lineage dependent counts; minutes saved comes from{" "}
            <code>economics.est_minutes_saved</code> on each tap type. Both are assumptions declared
            in config. Measuring real avoided rework needs a control group, and pretending otherwise
            is how these dashboards lose a technical buyer in the first five minutes.
          </Note>
        </Card>
      </div>

      <div className="mt-5">
        <Card title="Monthly detail" subtitle="Raw funnel by month.">
          <Table
            head={["Month", "Triggers", "Deduped", "Rate-limited", "Delivered", "Answered", "Deflected", "Timed out", "Landed", "Answer rate"]}
            dense
          >
            {funnel.map((f) => (
              <tr key={f.month}>
                <Td className="text-xs font-medium">{monthLabel(f.month)}</Td>
                <Td className="tabular-nums text-xs">{f.triggers_fired}</Td>
                <Td className="tabular-nums text-xs text-slate-500">{f.suppressed_dedupe}</Td>
                <Td className="tabular-nums text-xs text-slate-500">{f.suppressed_rate_limit}</Td>
                <Td className="tabular-nums text-xs">{f.taps_delivered}</Td>
                <Td className="tabular-nums text-xs">{f.answered}</Td>
                <Td className="tabular-nums text-xs">{f.deflected}</Td>
                <Td className="tabular-nums text-xs">{f.timed_out + f.expired}</Td>
                <Td className="tabular-nums text-xs">{f.writebacks_landed}</Td>
                <Td className="tabular-nums text-xs font-medium">{pct(f.answer_rate_pct)}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}
