import Link from "next/link";
import { q } from "@/lib/duckdb";
import { lintAll, tapTypes } from "@/lib/config";
import { Badge, Card, Note, PageHeader, Stat, StatRow, Table, Td, classTone } from "@/components/ui";
import { duration, pct, titleize } from "@/lib/format";

/**
 * MVP overview.
 *
 * The marketing page used to live here. It now lives in `site/` as a separate,
 * fully static project so it can be shared without this warehouse — a demo that
 * can fail because a local database was not built is a demo that will fail.
 *
 * What is left here is the working product: real activity from db/tap-ai.duckdb,
 * with a route into each surface.
 */

export const dynamic = "force-dynamic";

const SURFACES = [
  {
    href: "/inbox",
    name: "Tap inbox",
    desc: "Live taps as recipients see them, plus an end-to-end trace of any single one.",
    value: "Lightweight",
  },
  {
    href: "/tap-types",
    name: "Tap types",
    desc: "The primitive. Every question type is a versioned spec with a lint report and a precision gate.",
    value: "Governed",
  },
  {
    href: "/analytics",
    name: "Analytics",
    desc: "Where taps die, whether they were worth asking, and who is contributing.",
    value: "Active",
  },
  {
    href: "/pricing",
    name: "Pricing",
    desc: "Capability tiers, adoption over time, and value shown as arithmetic.",
    value: "Governed",
  },
  {
    href: "/config",
    name: "Configuration",
    desc: "Source connections, SSO, domain ownership, and delivery pacing — all config as code.",
    value: "Governed",
  },
  {
    href: "/notes",
    name: "Design notes",
    desc: "What this MVP proves, what it does not, and the findings that changed the design.",
    value: "",
  },
];

const VALUE_TONE: Record<string, string> = {
  Lightweight: "bg-amber-50 text-amber-800 ring-amber-200",
  Governed: "bg-sky-50 text-sky-800 ring-sky-200",
  Active: "bg-teal-50 text-teal-800 ring-teal-200",
};

export default async function Overview() {
  const types = tapTypes();
  const errors = lintAll().filter((f) => f.severity === "error").length;

  const [head, recent] = await Promise.all([
    q<{
      taps: number;
      answered: number;
      strategic: number;
      unresolved: number;
      landed: number;
      median: number;
      people: number;
    }>(`SELECT
          (SELECT COUNT(*) FROM taps)                                             AS taps,
          (SELECT COUNT(*) FROM taps WHERE status = 'answered')                   AS answered,
          (SELECT COUNT(*) FROM taps WHERE tap_class = 'strategic')               AS strategic,
          (SELECT COUNT(*) FROM taps WHERE status IN ('timed_out','expired'))     AS unresolved,
          (SELECT COUNT(*) FROM write_backs WHERE status IN ('merged','applied')) AS landed,
          (SELECT ROUND(MEDIAN(minutes_to_respond),0) FROM tap_responses)         AS median,
          (SELECT COUNT(DISTINCT responder_email) FROM tap_responses)             AS people`),
    q<{
      tap_id: string;
      tap_type_id: string;
      tap_class: string;
      recipient_name: string;
      answer: string | null;
      status: string;
      minutes_to_respond: number | null;
    }>(
      `SELECT tap_id, tap_type_id, tap_class, recipient_name, answer, status, minutes_to_respond
       FROM v_tap_detail ORDER BY delivered_at DESC LIMIT 8`
    ),
  ]);
  const h = head[0];

  return (
    <>
      <PageHeader
        eyebrow="Tap AI · MVP"
        title="The working product"
        lede="Real activity from the seeded warehouse. The public site is a separate static project under site/ — it shares none of this data layer, so it can be published anywhere."
      />

      <StatRow>
        <Stat
          label="Taps delivered"
          value={h.taps.toLocaleString()}
          sub={`${h.strategic} company-level · ${(h.taps - h.strategic).toLocaleString()} routine`}
        />
        <Stat
          label="Answer rate"
          value={pct((h.answered / h.taps) * 100)}
          sub={`median ${duration(h.median)} to respond`}
          tone={h.answered / h.taps > 0.6 ? "good" : "warn"}
        />
        <Stat
          label="People contributing"
          value={h.people}
          sub={`${h.landed.toLocaleString()} decisions applied`}
          tone="good"
        />
        <Stat
          label="Tap types"
          value={types.length}
          sub={errors ? `${errors} lint errors` : "all specs pass lint"}
          tone={errors ? "bad" : "good"}
        />
      </StatRow>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card title="Surfaces" subtitle="Each page exists to configure, route, or account for a tap.">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {SURFACES.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group rounded-lg border border-slate-200 px-3.5 py-3 transition-colors hover:border-teal-300 hover:bg-teal-50/40"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-slate-900 group-hover:text-teal-800">
                    {s.name}
                  </span>
                  {s.value && (
                    <span
                      className={`ml-auto rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide ring-1 ring-inset ${VALUE_TONE[s.value]}`}
                    >
                      {s.value}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-slate-600">{s.desc}</p>
              </Link>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          <Card title="Architecture" subtitle="">
            <dl className="space-y-1.5 text-[11.5px]">
              {[
                ["Config", "org/, config/, tap-types/ — YAML read off disk"],
                ["Activity", "seeds/*.csv loaded into db/tap-ai.duckdb"],
                ["Decisions", "v_decision_ledger → exports/decisions.jsonl"],
                ["Source adapter", "dbt — seeded, not yet live"],
                ["SSO", "simulated from org/employees.csv"],
                ["Delivery", "local inbox only"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-slate-50 pb-1">
                  <dt className="shrink-0 text-slate-500">{k}</dt>
                  <dd className="text-right font-medium text-slate-800">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Note title="The site is decoupled on purpose">
            <code>site/</code> is its own Next project with four dependencies and no data layer. It
            builds to a folder of static HTML you can put on GitHub Pages, Vercel, or a USB stick.
            This MVP keeps the warehouse and the architecture to build on.
          </Note>
        </div>
      </div>

      <div className="mt-5">
        <Card title="Latest activity" subtitle="">
          <Table head={["Tap", "Type", "Recipient", "Outcome", "Latency"]} dense>
            {recent.map((r) => (
              <tr key={r.tap_id} className="hover:bg-slate-50/70">
                <Td mono>
                  <Link href={`/inbox/${r.tap_id}`} className="text-teal-700 hover:underline">
                    {r.tap_id}
                  </Link>
                </Td>
                <Td>
                  <Badge tone={classTone(r.tap_class)}>{r.tap_class}</Badge>
                  <div className="mt-1 text-[10px] text-slate-500">{titleize(r.tap_type_id)}</div>
                </Td>
                <Td className="text-xs">{r.recipient_name}</Td>
                <Td className="text-[11px]">{r.answer ?? titleize(r.status)}</Td>
                <Td className="tabular-nums text-xs">{duration(r.minutes_to_respond)}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}
