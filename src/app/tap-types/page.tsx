import Link from "next/link";
import { q } from "@/lib/duckdb";
import { lintAll, tapTypes } from "@/lib/config";
import {
  Badge,
  BarList,
  Card,
  Note,
  PageHeader,
  Stat,
  StatRow,
  Table,
  Td,
  classTone,
} from "@/components/ui";
import { duration, pct, titleize } from "@/lib/format";

export const dynamic = "force-dynamic";

interface Perf {
  tap_type_id: string;
  ratings: number;
  precision_pct: number | null;
  durability_pct: number;
  median_minutes: number;
  verdict: string;
}

export default async function TapTypesPage() {
  const types = tapTypes();
  const findings = lintAll();

  const [perf, volume] = await Promise.all([
    q<Perf>(`SELECT tap_type_id, ratings, precision_pct, durability_pct, median_minutes, verdict
             FROM v_precision_by_type`),
    q<{ tap_type_id: string; taps: number; answered: number }>(
      `SELECT tap_type_id, COUNT(*) AS taps,
              COUNT(*) FILTER (WHERE status = 'answered') AS answered
       FROM taps GROUP BY tap_type_id`
    ),
  ]);
  const perfBy = new Map(perf.map((p) => [p.tap_type_id, p]));
  const volBy = new Map(volume.map((v) => [v.tap_type_id, v]));

  const active = types.filter((t) => t.status === "active").length;
  const belowBar = perf.filter((p) => p.verdict === "below bar").length;
  const errors = findings.filter((f) => f.severity === "error").length;

  return (
    <>
      <PageHeader
        eyebrow="The primitive"
        title="Tap types"
        lede="A tap type is to a tap what a dbt test definition is to a test failure: a versioned, declarative spec that generates instances. Making it first-class moves the four hardest questions -- when to interrupt, who may answer, what a valid answer looks like, and where it becomes durable -- out of application code and into config a customer can author and audit."
      />

      <StatRow>
        <Stat label="Tap types" value={types.length} sub={`${active} active, ${types.length - active} paused`} />
        <Stat
          label="Below the 60% precision bar"
          value={belowBar}
          sub="burning a channel, not creating value"
          tone={belowBar ? "bad" : "good"}
        />
        <Stat label="Lint errors" value={errors} sub={`${findings.length - errors} warnings`} tone={errors ? "bad" : "good"} />
        <Stat
          label="Write-back split"
          value={`${types.filter((t) => t.write_back.target === "pull_request").length} PR`}
          sub={`${types.filter((t) => t.write_back.target !== "pull_request").length} table or metadata patch`}
        />
      </StatRow>

      <div className="mt-6 space-y-5">
        <Card
          title="Registry"
          subtitle="Precision is the column that decides whether a tap type ships. Everything else is a detail."
        >
          <Table
            head={["Type", "Class", "Trigger", "Routing", "Write-back", "Volume", "Precision", "Durability", "Median"]}
            dense
          >
            {types.map((t) => {
              const p = perfBy.get(t.id);
              const v = volBy.get(t.id);
              const bad = p?.verdict === "below bar";
              return (
                <tr key={t.id} className={`hover:bg-slate-50/70 ${t.status === "paused" ? "opacity-60" : ""}`}>
                  <Td>
                    <Link href={`/tap-types/${t.id}`} className="text-xs font-medium text-teal-700 hover:underline">
                      {t.name}
                    </Link>
                    <div className="mt-0.5 font-mono text-[10px] text-slate-400">
                      {t.id} v{t.version}
                      {t.status === "paused" && (
                        <Badge tone="amber" title={t.paused_reason}>
                          paused
                        </Badge>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <Badge tone={classTone(t.class)}>{t.class}</Badge>
                  </Td>
                  <Td className="text-[11px]">{titleize(t.trigger.source)}</Td>
                  <Td className="text-[11px]">
                    {t.routing.min_authority}+
                    <div className="text-[10px] text-slate-400">{t.routing.domain_key}</div>
                  </Td>
                  <Td className="text-[11px]">
                    {titleize(t.write_back.target)}
                    <div className="text-[10px] text-slate-400">
                      {t.write_back.batch}
                      {t.write_back.requires_review ? " / reviewed" : ""}
                    </div>
                  </Td>
                  <Td className="tabular-nums text-xs">
                    {v?.taps ?? 0}
                    <div className="text-[10px] text-slate-400">{v?.answered ?? 0} answered</div>
                  </Td>
                  <Td className={`tabular-nums text-xs font-medium ${bad ? "text-rose-700" : "text-slate-900"}`}>
                    {pct(p?.precision_pct)}
                    <div className="text-[10px] font-normal text-slate-400">n={p?.ratings ?? 0}</div>
                  </Td>
                  <Td className="tabular-nums text-xs">{pct(p?.durability_pct)}</Td>
                  <Td className="tabular-nums text-xs">{duration(p?.median_minutes)}</Td>
                </tr>
              );
            })}
          </Table>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card
            title="Precision by type"
            subtitle="The 60% bar is not arbitrary: a good tap saves an hour, a bad tap costs you the channel permanently."
          >
            <BarList
              rows={[...perf]
                .sort((a, b) => (a.precision_pct ?? 0) - (b.precision_pct ?? 0))
                .map((p) => ({
                  label: titleize(p.tap_type_id),
                  value: Math.round(p.precision_pct ?? 0),
                  note: p.verdict === "low sample" ? "low sample" : undefined,
                }))}
              unit="%"
              colorFor={(r) => (r.value < 60 ? "#be123c" : r.value < 80 ? "#b45309" : "#0f766e")}
            />
            <Note title="charge_capture_variance is paused on purpose">
              41% precision in its first two weeks. Statistical outliers turned out to be a poor
              proxy for “a human knows something the pipeline does not.” It stays in the
              registry as a worked example: the ability to kill a tap type quickly is a feature.
            </Note>
          </Card>

          <Card
            title="Lint"
            subtitle="Every rule maps to a real failure mode. None of them are style preferences."
          >
            {findings.length === 0 ? (
              <p className="text-sm text-teal-700">All tap types pass.</p>
            ) : (
              <ul className="space-y-2.5">
                {findings.map((f, i) => (
                  <li key={i} className="flex gap-2.5">
                    <Badge tone={f.severity === "error" ? "rose" : "amber"}>{f.severity}</Badge>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-800">{f.message}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                        {f.tapTypeId} · {f.rule}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card title="Why write-back forks by class" subtitle="The one place the original architecture needed correcting.">
          <div className="grid gap-4 text-xs leading-relaxed text-slate-700 sm:grid-cols-2">
            <div>
              <p className="mb-1 font-semibold text-slate-900">Strategic → pull request</p>
              <p>
                A change to shared logic belongs in git: version control, review, staging, and CI
                already exist there, and a director’s decision about the canonical revenue
                definition should be as reviewable as the code that implements it.
              </p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-slate-900">Tactical → override table</p>
              <p>
                A record-level answer (“this denial is a coding issue”) is data, not a
                code change. Opening a PR per tactical tap drowns the repo and buries the strategic
                taps that actually need human review. The original spine said “write-back is a
                PR” universally — that does not survive contact with tactical volume.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
