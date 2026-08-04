import { q } from "@/lib/duckdb";
import { authority, domains, employees, notifications, sources, sso } from "@/lib/config";
import {
  Badge,
  Card,
  Note,
  PageHeader,
  Stat,
  StatRow,
  Table,
  Td,
} from "@/components/ui";
import { titleize } from "@/lib/format";

export const dynamic = "force-dynamic";

interface SourcesCfg {
  adapters: { key: string; label: string; status: string; write_back_targets: string[]; notes?: string }[];
  connections: {
    id: string;
    name: string;
    adapter: string;
    status: string;
    connected_at?: string;
    connected_by?: string;
    repo: { provider: string; url: string; default_branch?: string; codeowners_path?: string; prefer_codeowners?: boolean };
    object_counts?: Record<string, number>;
    domain_hints?: Record<string, string>;
    triggers_enabled?: Record<string, boolean>;
    health?: Record<string, string | number>;
  }[];
}
interface SsoCfg {
  provider: string;
  status: string;
  display_name: string;
  protocol: string;
  connection: Record<string, string>;
  claim_mapping: Record<string, string>;
  group_to_authority: Record<string, string>;
  provisioning: Record<string, unknown>;
  local_simulation: Record<string, unknown>;
}
interface NotifCfg {
  channels: { key: string; label: string; status: string; supports: string[] }[];
  defaults_by_authority: Record<
    string,
    { channel: string; delivery: string; max_taps_per_day: number; quiet_hours: string; digest_time: string | null }
  >;
  interrupt_policy: Record<string, unknown>;
  overrides_by_user: Record<string, Record<string, unknown>>;
}

export default async function ConfigPage() {
  const src = sources() as unknown as SourcesCfg;
  const id = sso() as unknown as SsoCfg;
  const notif = notifications() as unknown as NotifCfg;
  const auth = authority();
  const doms = domains();
  const people = employees();

  const [perUser, unmapped] = await Promise.all([
    q<{ recipient_email: string; taps: number; answered: number; median_minutes: number }>(
      `SELECT t.recipient_email, COUNT(*) AS taps,
              COUNT(*) FILTER (WHERE t.status = 'answered') AS answered,
              ROUND(MEDIAN(r.minutes_to_respond), 0) AS median_minutes
       FROM taps t LEFT JOIN tap_responses r USING (tap_id)
       GROUP BY 1 ORDER BY taps DESC LIMIT 14`
    ),
    q<{ n: number }>(`SELECT COUNT(*) AS n FROM source_objects WHERE has_domain_mapping = false`),
  ]);
  const byEmail = new Map(people.map((p) => [p.email, p]));
  const conn = src.connections.find((c) => c.status === "connected");

  return (
    <>
      <PageHeader
        eyebrow="Project configuration"
        title="Sources, identity, and delivery"
        lede="Three things an admin sets up, and all three are files in this repo rather than rows in a database. Config that lives in git inherits review, blame, and rollback for free — which is the same argument the product makes to its users."
      />

      <StatRow>
        <Stat
          label="Sources connected"
          value={`${src.connections.filter((c) => c.status === "connected").length} / ${src.connections.length}`}
          sub={`${src.adapters.filter((a) => a.status !== "planned").length} adapters available`}
        />
        <Stat label="Objects under coverage" value={(conn?.object_counts?.models ?? 0) + (conn?.object_counts?.metrics ?? 0)} sub={`${unmapped[0]?.n ?? 0} unmapped to a domain`} tone={unmapped[0]?.n ? "warn" : "good"} />
        <Stat label="SSO" value={titleize(id.provider)} sub={`${id.protocol.toUpperCase()} · ${id.status}`} tone="warn" />
        <Stat label="Directory" value={people.length} sub={`${doms.domains.length} business domains mapped`} />
      </StatRow>

      <div className="mt-6 space-y-5">
        {/* ---------------------------------------------------------------- 1 */}
        <Card
          title="1. Source system connection"
          subtitle="A source is any git-backed system whose logic encodes business meaning. dbt is the first adapter, not the foundation."
          right={<code className="text-[10px]">config/sources.yml</code>}
        >
          <div className="space-y-3">
            {src.connections.map((c) => (
              <div key={c.id} className="rounded-md border border-slate-200 px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {c.name}{" "}
                      <Badge tone={c.status === "connected" ? "teal" : "slate"}>
                        {c.status.replace("_", " ")}
                      </Badge>
                      <Badge tone="slate">{c.adapter}</Badge>
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-500">{c.repo.url}</p>
                  </div>
                  {c.connected_at && (
                    <p className="text-[11px] text-slate-400">
                      connected {c.connected_at} by {c.connected_by}
                    </p>
                  )}
                </div>

                {c.object_counts && (
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-100 pt-2.5 text-[11px]">
                    {Object.entries(c.object_counts).map(([k, v]) => (
                      <span key={k} className="text-slate-600">
                        <span className="font-semibold tabular-nums text-slate-900">{v}</span>{" "}
                        {k.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}

                {c.repo.codeowners_path && (
                  <p className="mt-2 text-[11px] text-slate-600">
                    Ownership resolution prefers{" "}
                    <code className="text-[10px]">{c.repo.codeowners_path}</code>
                    {c.repo.prefer_codeowners ? " over org/domains.yml" : ""} — ride the file the repo
                    already maintains.
                  </p>
                )}

                {c.triggers_enabled && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {Object.entries(c.triggers_enabled).map(([k, v]) => (
                      <Badge key={k} tone={v ? "teal" : "slate"} title={v ? "enabled" : "disabled"}>
                        {titleize(k)} {v ? "on" : "off"}
                      </Badge>
                    ))}
                  </div>
                )}

                {c.domain_hints && (
                  <div className="mt-3">
                    <p className="mb-1 text-[11px] font-semibold text-slate-700">
                      Path → domain hints (the cheapest possible classifier)
                    </p>
                    <Table head={["Path prefix", "Domain"]} dense>
                      {Object.entries(c.domain_hints).map(([p, d]) => (
                        <tr key={p}>
                          <Td mono className="text-[11px]">
                            {p}
                          </Td>
                          <Td mono className="text-[11px] text-slate-600">
                            {d}
                          </Td>
                        </tr>
                      ))}
                    </Table>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4">
            <p className="mb-1.5 text-[11px] font-semibold text-slate-700">Adapter interface</p>
            <Table head={["Adapter", "Status", "Write-back targets"]} dense>
              {src.adapters.map((a) => (
                <tr key={a.key}>
                  <Td className="text-xs">
                    {a.label}
                    <div className="font-mono text-[10px] text-slate-400">{a.key}</div>
                  </Td>
                  <Td>
                    <Badge tone={a.status === "seeded" ? "amber" : a.status === "planned" ? "slate" : "teal"}>
                      {a.status}
                    </Badge>
                  </Td>
                  <Td className="text-[11px] text-slate-600">{a.write_back_targets.join(", ")}</Td>
                </tr>
              ))}
            </Table>
          </div>

          <Note title="What makes something a source">
            Four calls: <code>discover()</code>, <code>diff(a,b)</code>, <code>annotations()</code>,{" "}
            <code>write_back()</code>. Anything that can satisfy those is a source, and that is the
            entire portability claim. The next step for this MVP is swapping the seeded dbt adapter
            for the live dbt platform Discovery and Administrative APIs — lineage gives real blast
            radius, manifest diffs give real triggers.
          </Note>
        </Card>

        {/* ---------------------------------------------------------------- 2 */}
        <div className="grid gap-5 lg:grid-cols-2">
          <Card
            title="2. SSO connection"
            subtitle={`${id.display_name} — simulated in this MVP, no network calls.`}
            right={<code className="text-[10px]">config/sso.yml</code>}
          >
            <dl className="space-y-1.5 text-[11px]">
              {[
                ["Provider", `${titleize(id.provider)} (${id.protocol.toUpperCase()})`],
                ["Issuer", id.connection.issuer],
                ["Client ID", id.connection.client_id],
                ["Client secret", id.connection.client_secret_ref],
                ["Redirect URI", id.connection.redirect_uri],
                ["Scopes", String(id.connection.scopes ?? "")],
                ["Provisioning", `${String((id.provisioning as { mode: string }).mode).toUpperCase()} — no SCIM required`],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between gap-3 border-b border-slate-50 pb-1">
                  <dt className="shrink-0 text-slate-500">{k}</dt>
                  <dd className="truncate text-right font-mono text-[10px] text-slate-800">{String(v)}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-4 mb-1.5 text-[11px] font-semibold text-slate-700">
              IdP group → authority level
            </p>
            <Table head={["IdP group", "Authority", "Can resolve"]} dense>
              {Object.entries(id.group_to_authority).map(([g, a]) => {
                const lvl = auth.levels.find((l) => l.key === a);
                return (
                  <tr key={g}>
                    <Td mono className="text-[11px]">
                      {g}
                    </Td>
                    <Td className="text-xs">
                      {lvl?.label}
                    </Td>
                    <Td className="text-[11px] text-slate-600">{lvl?.can_resolve.join(", ")}</Td>
                  </tr>
                );
              })}
            </Table>

            <Note title="The honest scope of what the IdP gives us">
              Identity and authority. Nothing else. Okta does not know who owns the canonical revenue
              definition — that mapping lives in <code>org/domains.yml</code> and is the one piece of
              ontology Tap AI cannot avoid. It converges from tap deflections rather than being
              authored up front.
            </Note>
          </Card>

          <Card
            title="Business domain ownership"
            subtitle="CODEOWNERS for business meaning. Small, flat, and expected to start wrong."
            right={<code className="text-[10px]">org/domains.yml</code>}
          >
            <Table head={["Domain", "Owner", "Backup", "Min authority"]} dense>
              {doms.domains.map((d) => (
                <tr key={d.key}>
                  <Td>
                    <div className="text-xs">{d.label}</div>
                    <div className="font-mono text-[10px] text-slate-400">{d.key}</div>
                  </Td>
                  <Td className="text-[11px]">
                    {byEmail.get(d.owner)?.full_name ?? d.owner}
                    <div className="text-[10px] text-slate-400">{byEmail.get(d.owner)?.title}</div>
                  </Td>
                  <Td className="text-[11px] text-slate-600">
                    {byEmail.get(d.backup)?.full_name ?? d.backup}
                  </Td>
                  <Td className="text-[11px]">{d.min_authority_strategic}</Td>
                </tr>
              ))}
            </Table>
            <p className="mt-3 text-[11px] text-slate-500">
              Unresolved domains route to the steward{" "}
              <code className="text-[10px]">{doms.default_steward}</code> with &ldquo;who should own
              this?&rdquo; as the tap itself. An unmapped domain never blocks a tap.
            </p>
          </Card>
        </div>

        {/* ---------------------------------------------------------------- 3 */}
        <Card
          title="3. Notification settings"
          subtitle="Where the lightweight principle lives or dies. Hard caps, quiet hours, and batching by seniority."
          right={<code className="text-[10px]">org/notifications.yml</code>}
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-slate-700">
                Org defaults by authority (admin-set)
              </p>
              <Table head={["Authority", "Channel", "Delivery", "Cap/day", "Quiet hours"]} dense>
                {Object.entries(notif.defaults_by_authority).map(([k, v]) => (
                  <tr key={k}>
                    <Td className="text-xs font-medium">{k}</Td>
                    <Td className="text-[11px]">{v.channel.replace("_", " ")}</Td>
                    <Td className="text-[11px]">{v.delivery.replace(/_/g, " ")}</Td>
                    <Td className="tabular-nums text-xs">{v.max_taps_per_day}</Td>
                    <Td className="text-[11px] text-slate-500">{v.quiet_hours}</Td>
                  </tr>
                ))}
              </Table>
              <div className="mt-3 rounded border border-slate-200 px-3 py-2">
                <p className="text-[11px] font-semibold text-slate-700">Interrupt policy</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  Only <strong>strategic</strong> taps at <strong>high</strong> blast radius may
                  pierce batching, capped at{" "}
                  {String((notif.interrupt_policy as { max_interrupts_per_week: number }).max_interrupts_per_week)}{" "}
                  per week. Without a ceiling on interrupts, &ldquo;urgent&rdquo; becomes the default
                  and the channel dies.
                </p>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-slate-700">
                Per-user overrides (self-service)
              </p>
              <Table head={["Person", "Channel", "Delivery", "Cap", "Note"]} dense>
                {Object.entries(notif.overrides_by_user).map(([email, o]) => (
                  <tr key={email}>
                    <Td>
                      <div className="text-xs">{byEmail.get(email)?.full_name ?? email}</div>
                      <div className="text-[10px] text-slate-400">{byEmail.get(email)?.title}</div>
                    </Td>
                    <Td className="text-[11px]">{String(o.channel ?? "").replace("_", " ")}</Td>
                    <Td className="text-[11px]">{String(o.delivery ?? "").replace(/_/g, " ")}</Td>
                    <Td className="tabular-nums text-xs">{String(o.max_taps_per_day ?? "--")}</Td>
                    <Td className="text-[10px] text-slate-500">{String(o.note ?? "")}</Td>
                  </tr>
                ))}
              </Table>

              <p className="mt-4 mb-1.5 text-[11px] font-semibold text-slate-700">
                Channels
              </p>
              <div className="flex flex-wrap gap-1.5">
                {notif.channels.map((c) => (
                  <Badge key={c.key} tone={c.status === "active" ? "teal" : "amber"} title={c.supports.join(", ")}>
                    {c.label} — {c.status}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card
          title="Observed load per person"
          subtitle="Check the configured caps against what people are actually absorbing."
        >
          <Table head={["Person", "Authority", "Configured cap/day", "Taps received", "Answered", "Median response"]} dense>
            {perUser.map((u) => {
              const p = byEmail.get(u.recipient_email);
              const override = notif.overrides_by_user[u.recipient_email] as
                | { max_taps_per_day?: number }
                | undefined;
              const cap =
                override?.max_taps_per_day ??
                notif.defaults_by_authority[p?.authority_level ?? "ic"]?.max_taps_per_day;
              return (
                <tr key={u.recipient_email}>
                  <Td>
                    <div className="text-xs">{p?.full_name ?? u.recipient_email}</div>
                    <div className="text-[10px] text-slate-400">{p?.department}</div>
                  </Td>
                  <Td className="text-[11px]">{p?.authority_level}</Td>
                  <Td className="tabular-nums text-xs">
                    {cap}
                    {override && (
                      <Badge tone="violet" title="Self-service override">
                        custom
                      </Badge>
                    )}
                  </Td>
                  <Td className="tabular-nums text-xs">{u.taps}</Td>
                  <Td className="tabular-nums text-xs">
                    {u.answered}
                    <span className="ml-1 text-slate-400">
                      {Math.round((u.answered / u.taps) * 100)}%
                    </span>
                  </Td>
                  <Td className="tabular-nums text-xs">{u.median_minutes ? `${u.median_minutes}m` : "--"}</Td>
                </tr>
              );
            })}
          </Table>
        </Card>
      </div>
    </>
  );
}
