import Link from "next/link";
import { q } from "@/lib/duckdb";
import { tapTypes } from "@/lib/config";
import { TapAlert, type TapRow } from "@/components/tap-alert";
import {
  Badge,
  Card,
  Note,
  PageHeader,
  Stat,
  StatRow,
  Table,
  Td,
  classTone,
  statusTone,
} from "@/components/ui";
import { ago, duration, titleize } from "@/lib/format";

export const dynamic = "force-dynamic";

const SELECT = `
  tap_id, tap_type_id, tap_class, domain_key, object_name, entity_key,
  recipient_name, recipient_email, recipient_department, recipient_authority,
  routed_via, channel,
  CAST(generated_at AS VARCHAR) AS generated_at,
  CAST(delivered_at AS VARCHAR) AS delivered_at,
  CAST(due_at       AS VARCHAR) AS due_at,
  sla_hours, blast_radius, dependent_count, status, context_json,
  CAST(responded_at AS VARCHAR) AS responded_at,
  minutes_to_respond, answer, quality_score, durable,
  writeback_target, writeback_ref, writeback_status
`;

export default async function InboxPage() {
  const types = tapTypes();
  const byId = new Map(types.map((t) => [t.id, t]));

  const [open, recent, counts] = await Promise.all([
    q<TapRow>(`SELECT ${SELECT} FROM v_tap_detail WHERE status = 'pending'
               ORDER BY delivered_at DESC LIMIT 6`),
    q<TapRow>(`SELECT ${SELECT} FROM v_tap_detail WHERE status <> 'pending'
               ORDER BY delivered_at DESC LIMIT 25`),
    q<{ status: string; n: number }>(
      `SELECT status, COUNT(*) AS n FROM taps GROUP BY status ORDER BY n DESC`
    ),
  ]);

  const total = counts.reduce((s, c) => s + c.n, 0);
  const get = (s: string) => counts.find((c) => c.status === s)?.n ?? 0;
  const answered = get("answered");

  return (
    <>
      <PageHeader
        eyebrow="The form factor"
        title="Tap inbox"
        lede="Standing in for Slack, email, and the assistant surface until those integrations exist. The alert below is the real deliverable of this MVP -- every other page exists to configure, route, or account for it."
      />

      <StatRow>
        <Stat label="Taps delivered" value={total.toLocaleString()} sub="all time, this account" />
        <Stat
          label="Answered"
          value={`${Math.round((answered / total) * 100)}%`}
          sub={`${answered.toLocaleString()} resolved`}
          tone={answered / total > 0.6 ? "good" : "warn"}
        />
        <Stat label="Deflected" value={get("deflected").toLocaleString()} sub="reassigned by recipient" tone="warn" />
        <Stat
          label="Never answered"
          value={(get("timed_out") + get("expired")).toLocaleString()}
          sub="timed out or expired"
          tone="bad"
        />
      </StatRow>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <Card
            title="Awaiting a response"
            subtitle="Rendered as the recipient would see it in Slack. Buttons are inert in this MVP."
            right={<span>{open.length} open</span>}
          >
            <div className="space-y-3">
              {open.length === 0 && (
                <p className="py-4 text-sm text-slate-500">Nothing pending right now.</p>
              )}
              {open.map((t) => (
                <div key={t.tap_id}>
                  <TapAlert tap={t} type={byId.get(t.tap_type_id)} surface={t.channel === "email" ? "email" : "slack"} />
                  <div className="mt-1 px-1 text-right">
                    <Link
                      href={`/inbox/${t.tap_id}`}
                      className="text-[11px] text-teal-700 underline decoration-dotted hover:text-teal-900"
                    >
                      Trace this tap end to end →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Recently resolved"
            subtitle="Click any row to see the full trigger → routing → write-back trace."
          >
            <Table head={["Tap", "Type", "Recipient", "Answer", "Latency", "Write-back"]} dense>
              {recent.map((t) => (
                <tr key={t.tap_id} className="hover:bg-slate-50/70">
                  <Td mono>
                    <Link href={`/inbox/${t.tap_id}`} className="text-teal-700 hover:underline">
                      {t.tap_id}
                    </Link>
                    <div className="mt-0.5 text-[10px] text-slate-400">{ago(t.delivered_at)}</div>
                  </Td>
                  <Td>
                    <Badge tone={classTone(t.tap_class)}>{t.tap_class}</Badge>
                    <div className="mt-1 text-[11px] text-slate-500">{titleize(t.tap_type_id)}</div>
                  </Td>
                  <Td>
                    <div className="text-xs">{t.recipient_name}</div>
                    <div className="text-[10px] text-slate-400">{t.recipient_department}</div>
                  </Td>
                  <Td>
                    <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                    {t.answer && (
                      <div className="mt-1 max-w-[15rem] truncate text-[11px] text-slate-600">{t.answer}</div>
                    )}
                  </Td>
                  <Td className="tabular-nums text-xs">{duration(t.minutes_to_respond)}</Td>
                  <Td>
                    {t.writeback_ref ? (
                      <>
                        <Badge tone={statusTone(t.writeback_status ?? "")}>{t.writeback_status}</Badge>
                        <div className="mt-1 max-w-[13rem] truncate font-mono text-[10px] text-slate-400">
                          {t.writeback_ref}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">--</span>
                    )}
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="The tap loop" subtitle="Five stages. Each one can silently drop a tap.">
            <ol className="space-y-3">
              {[
                ["Trigger", "A diff, an annotation, an anomaly, or an audit fires. Four sources, one interface.", "config/sources.yml"],
                ["Classify", "Infer the business domain touched and estimate blast radius from lineage.", "tap-types/*.yml"],
                ["Route", "Resolve the owner: CODEOWNERS first, then domains.yml. IdP supplies authority only.", "org/domains.yml"],
                ["Tap", "Deliver in the persona-appropriate channel, capped and batched by seniority.", "org/notifications.yml"],
                ["Write back", "PR for strategic. Override table for tactical. Never a PR per record.", "tap-types/*.yml"],
              ].map(([name, desc, file], i) => (
                <li key={name} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{name}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">{desc}</p>
                    <code className="mt-1 inline-block text-[10px] text-slate-400">{file}</code>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card title="Same tap, three surfaces" subtitle="Form factor flexes by persona; the tap does not.">
            {open[0] ? (
              <div className="space-y-3">
                <TapAlert tap={open[0]} type={byId.get(open[0].tap_type_id)} surface="slack" interactive={false} />
                <TapAlert tap={open[0]} type={byId.get(open[0].tap_type_id)} surface="claude" interactive={false} />
              </div>
            ) : (
              <p className="text-sm text-slate-500">No open tap to preview.</p>
            )}
          </Card>

          <Note title="What this page is not testing">
            Question relevance. Every tap here was generated by a tap type a human authored, so
            relevance is assumed. Whether a machine can generate taps people find worth answering is
            a separate experiment and should be run on paper before it is built — see the README.
          </Note>
        </div>
      </div>
    </>
  );
}
