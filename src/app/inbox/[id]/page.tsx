import Link from "next/link";
import { notFound } from "next/navigation";
import { q } from "@/lib/duckdb";
import { domains, employees, tapType } from "@/lib/config";
import { TapAlert, ctxOf, type TapRow } from "@/components/tap-alert";
import { Badge, Card, Note, PageHeader, Table, Td, classTone, statusTone, radiusTone } from "@/components/ui";
import { duration, titleize, pct } from "@/lib/format";

export const dynamic = "force-dynamic";

interface TriggerRow {
  trigger_id: string;
  triggered_at: string;
  trigger_source: string;
  object_path: string;
  entity_key: string;
  classified_domain: string;
  blast_radius: string;
  dependent_count: number;
  outcome: string;
}

export default async function TapDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const rows = await q<TapRow & { trigger_id: string; reviewer_email: string | null; within_sla: boolean | null; impact_type: string | null; impact_magnitude: number | null; est_minutes_saved: number | null; routed_via: string }>(
    `SELECT tap_id, trigger_id, tap_type_id, tap_class, domain_key, object_name, object_id, entity_key,
            recipient_name, recipient_email, recipient_department, recipient_authority,
            routed_via, channel,
            CAST(generated_at AS VARCHAR) AS generated_at,
            CAST(delivered_at AS VARCHAR) AS delivered_at,
            CAST(due_at       AS VARCHAR) AS due_at,
            sla_hours, blast_radius, dependent_count, status, context_json,
            CAST(responded_at AS VARCHAR) AS responded_at,
            minutes_to_respond, answer, deflected_to, rationale, quality_score,
            rated_worth_asking, durable, CAST(reversed_at AS VARCHAR) AS reversed_at,
            writeback_target, writeback_ref, writeback_status,
            CAST(writeback_landed_at AS VARCHAR) AS writeback_landed_at,
            reviewer_email, within_sla, impact_type, impact_magnitude, est_minutes_saved
     FROM v_tap_detail WHERE tap_id = ?`,
    [id]
  );
  if (!rows.length) notFound();
  const tap = rows[0];
  const type = tapType(tap.tap_type_id);

  const trg = await q<TriggerRow>(
    `SELECT trigger_id, CAST(triggered_at AS VARCHAR) AS triggered_at, trigger_source,
            object_path, entity_key, classified_domain, blast_radius, dependent_count, outcome
     FROM triggers WHERE trigger_id = ?`,
    [tap.trigger_id]
  );
  const trigger = trg[0];

  const dom = domains().domains.find((d) => d.key === tap.domain_key);
  const people = employees();
  const recipient = people.find((e) => e.email === tap.recipient_email);
  const ctx = ctxOf(tap);

  const stages: { name: string; when: string | null; detail: React.ReactNode; ok: boolean }[] = [
    {
      name: "1. Trigger",
      when: trigger?.triggered_at ?? null,
      ok: true,
      detail: (
        <>
          <Badge tone="slate">{titleize(trigger?.trigger_source ?? "")}</Badge>{" "}
          fired on <code className="text-[11px]">{trigger?.object_path}</code>
          <div className="mt-1 text-[11px] text-slate-500">
            Dedupe key <code>{tap.entity_key}</code> · cooldown {type?.dedupe.cooldown_days}d
          </div>
        </>
      ),
    },
    {
      name: "2. Classification",
      when: null,
      ok: true,
      detail: (
        <>
          Domain <code className="text-[11px]">{tap.domain_key}</code>
          {type?.classification.domain === "inferred" && (
            <Badge tone="amber" title="This tap type does not hardcode a domain">
              inferred
            </Badge>
          )}
          <div className="mt-1 flex items-center gap-1.5">
            <Badge tone={radiusTone(tap.blast_radius)}>{tap.blast_radius}</Badge>
            <span className="text-[11px] text-slate-500">
              {tap.dependent_count} downstream dependents · method{" "}
              {type?.classification.blast_radius.method}
            </span>
          </div>
        </>
      ),
    },
    {
      name: "3. Routing",
      when: null,
      ok: tap.status !== "deflected",
      detail: (
        <>
          {tap.recipient_name}{" "}
          <span className="text-[11px] text-slate-500">
            ({recipient?.title}, {tap.recipient_department})
          </span>
          <div className="mt-1 text-[11px] text-slate-500">
            Resolved via <Badge tone={tap.routed_via === "codeowners" ? "teal" : "slate"}>{titleize(tap.routed_via)}</Badge>{" "}
            · min authority {type?.routing.min_authority} · held{" "}
            {tap.recipient_authority}
            {dom && <> · domain owner on record: {dom.owner}</>}
          </div>
          {tap.status === "deflected" && (
            <p className="mt-1 text-[11px] text-amber-700">
              Recipient deflected to {tap.deflected_to}. This is the highest-signal training data
              for org/domains.yml.
            </p>
          )}
        </>
      ),
    },
    {
      name: "4. Tap delivered",
      when: tap.delivered_at,
      ok: true,
      detail: (
        <>
          <Badge tone="slate">{titleize(tap.channel)}</Badge>{" "}
          <span className="text-[11px] text-slate-500">
            SLA {tap.sla_hours}h · due {new Date(tap.due_at).toLocaleString("en-US")} · on
            timeout {titleize(type?.sla.on_timeout ?? "")}
          </span>
        </>
      ),
    },
    {
      name: "5. Response",
      when: tap.responded_at ?? null,
      ok: tap.status === "answered",
      detail:
        tap.status === "answered" ? (
          <>
            <span className="font-medium text-slate-900">{tap.answer}</span>
            <div className="mt-1 text-[11px] text-slate-500">
              {duration(tap.minutes_to_respond)} to respond ·{" "}
              {tap.within_sla ? (
                <span className="text-teal-700">within SLA</span>
              ) : (
                <span className="text-rose-700">missed SLA</span>
              )}{" "}
              · quality {tap.quality_score}
              {tap.durable === false && (
                <span className="text-rose-700"> · did not survive the durability window</span>
              )}
            </div>
          </>
        ) : (
          <span className="text-slate-500">
            {tap.status === "pending" ? "Still open." : `No answer -- ${titleize(tap.status)}.`}
          </span>
        ),
    },
    {
      name: "6. Write-back",
      when: tap.writeback_landed_at ?? null,
      ok: ["merged", "applied"].includes(tap.writeback_status ?? ""),
      detail: tap.writeback_ref ? (
        <>
          <Badge tone={statusTone(tap.writeback_status ?? "")}>{tap.writeback_status}</Badge>{" "}
          <code className="text-[11px]">{tap.writeback_ref}</code>
          <div className="mt-1 text-[11px] text-slate-500">
            Target <Badge tone="slate">{titleize(tap.writeback_target ?? "")}</Badge>
            {tap.reviewer_email && <> · reviewed by {tap.reviewer_email}</>}
            {tap.writeback_target === "override_table" && (
              <> · batched daily, no engineer review required</>
            )}
          </div>
        </>
      ) : (
        <span className="text-slate-500">Nothing written back.</span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Link href="/inbox" className="hover:underline">
              Tap inbox
            </Link>{" "}
            / {tap.tap_id}
          </>
        }
        title={type?.name ?? tap.tap_type_id}
        lede={type?.description}
      />

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-5">
          <Card title="As delivered" subtitle={`${titleize(tap.channel)} -- simulated`}>
            <TapAlert tap={tap} type={type} surface={tap.channel === "email" ? "email" : "slack"} interactive={false} />
          </Card>

          <Card title="Trace" subtitle="Every stage that could have dropped this tap.">
            <ol className="space-y-4">
              {stages.map((s) => (
                <li key={s.name} className="flex gap-3">
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${s.ok ? "bg-teal-600" : "bg-amber-500"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-xs font-semibold text-slate-900">{s.name}</p>
                      {s.when && (
                        <span className="shrink-0 font-mono text-[10px] text-slate-400">
                          {new Date(s.when).toLocaleString("en-US")}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-700">{s.detail}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Tap type" subtitle={`${tap.tap_type_id} v${type?.version}`}>
            <dl className="space-y-2 text-xs">
              {[
                ["Class", <Badge key="c" tone={classTone(tap.tap_class)}>{tap.tap_class}</Badge>],
                ["Status", <Badge key="s" tone={type?.status === "active" ? "teal" : "amber"}>{type?.status}</Badge>],
                ["Trigger source", titleize(type?.trigger.source ?? "")],
                ["Min authority", type?.routing.min_authority],
                ["SLA", `${type?.sla.respond_within_hours}h, then ${type?.sla.on_timeout}`],
                ["Write-back", titleize(type?.write_back.target ?? "")],
                ["Reward weight", type?.economics.reward_weight],
                ["Est. minutes saved", type?.economics.est_minutes_saved],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex items-baseline justify-between gap-3 border-b border-slate-50 pb-1.5">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-right font-medium text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
            <Link
              href={`/tap-types/${tap.tap_type_id}`}
              className="mt-3 inline-block text-[11px] text-teal-700 underline decoration-dotted"
            >
              Full spec →
            </Link>
          </Card>

          <Card title="Trigger context" subtitle="Values that filled the question template.">
            <Table head={["Field", "Value"]} dense>
              {Object.entries(ctx).map(([k, v]) => (
                <tr key={k}>
                  <Td mono className="w-2/5 text-slate-500">
                    {k}
                  </Td>
                  <Td className="text-xs">{String(v)}</Td>
                </tr>
              ))}
            </Table>
          </Card>

          {tap.impact_type && (
            <Card title="Modeled impact" subtitle="An assumption from the tap type, not a measurement.">
              <p className="text-sm text-slate-800">{titleize(tap.impact_type)}</p>
              <p className="mt-1 text-xs text-slate-600">
                Magnitude {tap.impact_magnitude} · {tap.est_minutes_saved} minutes saved (from{" "}
                <code>economics.est_minutes_saved</code>)
              </p>
            </Card>
          )}

          <Note title="Why this trace exists">
            The five-second tap is the visible product. The trace is the sellable one. A compliance
            officer asking “who decided this, when, and what changed as a result” is the
            reason the tap ledger is a first-class table rather than a log line.
          </Note>
        </div>
      </div>
    </>
  );
}
