import Link from "next/link";
import { notFound } from "next/navigation";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { q } from "@/lib/duckdb";
import { domains, lintTapType, tapType } from "@/lib/config";
import {
  Badge,
  Card,
  Lines,
  Note,
  PageHeader,
  Stat,
  StatRow,
  Table,
  Td,
  classTone,
} from "@/components/ui";
import { duration, monthLabel, pct, titleize } from "@/lib/format";

export const dynamic = "force-dynamic";

/** Show the raw YAML. If a tap type is really config-as-code, the file is the
 *  source of truth and the reader should be able to see it. */
function rawYaml(id: string): string | null {
  const dir = resolve(process.cwd(), "tap-types");
  const f = readdirSync(dir).find(
    (n) => n.endsWith(".yml") && !n.startsWith("_") && readFileSync(join(dir, n), "utf8").includes(`id: ${id}\n`)
  );
  return f ? readFileSync(join(dir, f), "utf8") : null;
}

export default async function TapTypeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = tapType(id);
  if (!t) notFound();

  const findings = lintTapType(t);
  const dom = domains().domains.find((d) => d.key === t.routing.domain_key);
  const yaml = rawYaml(id);

  const [perf, decay, recipients, recent] = await Promise.all([
    q<{ ratings: number; precision_pct: number | null; durability_pct: number; median_minutes: number; avg_quality: number; verdict: string }>(
      `SELECT ratings, precision_pct, durability_pct, median_minutes, avg_quality, verdict
       FROM v_precision_by_type WHERE tap_type_id = ?`,
      [id]
    ),
    q<{ month: string; taps: number }>(
      `SELECT month, COUNT(*) AS taps FROM taps WHERE tap_type_id = ? GROUP BY month ORDER BY month`,
      [id]
    ),
    q<{ recipient_name: string; recipient_department: string; taps: number; answered: number }>(
      `SELECT recipient_name, recipient_department, COUNT(*) AS taps,
              COUNT(*) FILTER (WHERE status = 'answered') AS answered
       FROM taps WHERE tap_type_id = ?
       GROUP BY 1, 2 ORDER BY taps DESC LIMIT 8`,
      [id]
    ),
    q<{ tap_id: string; answer: string | null; status: string; minutes_to_respond: number | null }>(
      `SELECT tap_id, answer, status, minutes_to_respond FROM v_tap_detail
       WHERE tap_type_id = ? ORDER BY delivered_at DESC LIMIT 8`,
      [id]
    ),
  ]);
  const p = perf[0];

  const answerMix = await q<{ answer: string; n: number }>(
    `SELECT answer, COUNT(*) AS n FROM tap_responses
     WHERE tap_type_id = ? AND outcome = 'answered' GROUP BY answer ORDER BY n DESC`,
    [id]
  );
  const totalAnswers = answerMix.reduce((s, a) => s + a.n, 0);

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Link href="/tap-types" className="hover:underline">
              Tap types
            </Link>{" "}
            / {t.id}
          </>
        }
        title={t.name}
        lede={t.description}
      >
        <div className="flex gap-1.5">
          <Badge tone={classTone(t.class)}>{t.class}</Badge>
          <Badge tone={t.status === "active" ? "teal" : "amber"}>{t.status}</Badge>
          <Badge tone="slate">v{t.version}</Badge>
        </div>
      </PageHeader>

      {t.status === "paused" && t.paused_reason && (
        <div className="mb-5">
          <Note title="Why this type is paused">{t.paused_reason}</Note>
        </div>
      )}

      <StatRow>
        <Stat
          label="Precision"
          value={pct(p?.precision_pct)}
          sub={`n=${p?.ratings ?? 0} rated${p?.verdict === "low sample" ? " -- low sample" : ""}`}
          tone={(p?.precision_pct ?? 0) < 60 ? "bad" : (p?.precision_pct ?? 0) < 80 ? "warn" : "good"}
        />
        <Stat label="Durability" value={pct(p?.durability_pct)} sub={`answers surviving ${60}d`} />
        <Stat label="Median response" value={duration(p?.median_minutes)} sub={`SLA ${t.sla.respond_within_hours}h`} />
        <Stat
          label="Question space"
          value={`${t.dedupe.cooldown_days}d`}
          sub={`cooldown on [${t.dedupe.key.join(", ")}]`}
        />
      </StatRow>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          <Card title="Spec" subtitle="The five decisions a tap type encodes.">
            <dl className="grid gap-x-6 gap-y-2.5 text-xs sm:grid-cols-2">
              {[
                ["Trigger source", titleize(t.trigger.source)],
                ["Rate limit", t.trigger.rate_limit ? `${t.trigger.rate_limit}/day org-wide` : "none"],
                ["Domain", t.classification.domain],
                ["Blast radius method", t.classification.blast_radius.method],
                ["Routes to", dom ? `${dom.owner} (${dom.label})` : t.routing.domain_key],
                ["Min authority", t.routing.min_authority],
                ["Fallback", titleize(t.routing.fallback)],
                ["Deflection", t.routing.deflection_allowed ? "allowed" : "blocked"],
                ["Response kind", titleize(t.question.response.kind)],
                ["SLA", `${t.sla.respond_within_hours}h then ${t.sla.on_timeout}`],
                ["Default on timeout", t.sla.default_response ?? "none"],
                ["Write-back", `${titleize(t.write_back.target)} (${t.write_back.batch})`],
                ["Requires review", t.write_back.requires_review ? "yes" : "no"],
                ["Reward weight", t.economics.reward_weight],
                ["Est. minutes saved", t.economics.est_minutes_saved],
                ["Dedupe cooldown", `${t.dedupe.cooldown_days} days`],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex items-baseline justify-between gap-3 border-b border-slate-50 pb-1.5">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-right font-medium text-slate-900">{String(v)}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card title="Monthly volume" subtitle="Watch the shape -- most tap types exhaust their question space.">
            {decay.length > 1 ? (
              <Lines
                categories={decay.map((d) => monthLabel(d.month))}
                series={[{ name: "taps", values: decay.map((d) => d.taps) }]}
              />
            ) : (
              <p className="text-sm text-slate-500">Not enough history to plot.</p>
            )}
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Dedupe is keyed on <code>[{t.dedupe.key.join(", ")}]</code> with a{" "}
              {t.dedupe.cooldown_days}-day cooldown. That bounds how many distinct questions this
              type can ever ask. A type bound to a fixed taxonomy is a one-time migration; a type
              bound to ongoing creation is a subscription.
            </p>
          </Card>

          {yaml && (
            <Card title="Source" subtitle="tap-types/*.yml -- the file is the source of truth.">
              <pre className="max-h-[26rem] overflow-auto rounded bg-slate-900 p-3.5 font-mono text-[11px] leading-relaxed text-slate-200">
                {yaml}
              </pre>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card title="Question as rendered" subtitle="Template plus context lines.">
            <p className="text-sm font-medium leading-snug text-slate-900">
              {t.question.template.replace(/\s+/g, " ").trim()}
            </p>
            <ul className="mt-2.5 space-y-1">
              {t.question.context.map((c, i) => (
                <li key={i} className="flex gap-2 text-[11px] leading-relaxed text-slate-500">
                  <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                  {c.replace(/\s+/g, " ").trim()}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
              {(t.question.response.options ?? []).map((o) => (
                <span
                  key={o}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700"
                >
                  {o}
                  {(t.question.response.require_rationale_on ?? []).includes(o) && (
                    <span className="ml-1 text-[9px] text-slate-400">+ why</span>
                  )}
                </span>
              ))}
            </div>
          </Card>

          {totalAnswers > 0 && (
            <Card title="Answer distribution" subtitle={`${totalAnswers} resolved`}>
              <Table head={["Answer", "n", "Share"]} dense>
                {answerMix.map((a) => (
                  <tr key={a.answer}>
                    <Td className="text-xs">{a.answer}</Td>
                    <Td className="tabular-nums text-xs">{a.n}</Td>
                    <Td className="tabular-nums text-xs text-slate-500">
                      {Math.round((a.n / totalAnswers) * 100)}%
                    </Td>
                  </tr>
                ))}
              </Table>
            </Card>
          )}

          <Card title="Who answers this" subtitle="Routing in practice, not on paper.">
            <Table head={["Person", "Taps", "Answered"]} dense>
              {recipients.map((r) => (
                <tr key={r.recipient_name}>
                  <Td>
                    <div className="text-xs">{r.recipient_name}</div>
                    <div className="text-[10px] text-slate-400">{r.recipient_department}</div>
                  </Td>
                  <Td className="tabular-nums text-xs">{r.taps}</Td>
                  <Td className="tabular-nums text-xs">
                    {r.answered}
                    <span className="ml-1 text-slate-400">
                      {Math.round((r.answered / r.taps) * 100)}%
                    </span>
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>

          {findings.length > 0 && (
            <Card title="Lint" subtitle="Findings for this type.">
              <ul className="space-y-2">
                {findings.map((f, i) => (
                  <li key={i} className="flex gap-2">
                    <Badge tone={f.severity === "error" ? "rose" : "amber"}>{f.severity}</Badge>
                    <p className="text-[11px] leading-relaxed text-slate-700">{f.message}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card title="Recent taps" subtitle="">
            <Table head={["Tap", "Outcome", "Latency"]} dense>
              {recent.map((r) => (
                <tr key={r.tap_id}>
                  <Td mono>
                    <Link href={`/inbox/${r.tap_id}`} className="text-teal-700 hover:underline">
                      {r.tap_id}
                    </Link>
                  </Td>
                  <Td className="text-[11px]">{r.answer ?? titleize(r.status)}</Td>
                  <Td className="tabular-nums text-xs">{duration(r.minutes_to_respond)}</Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      </div>
    </>
  );
}
