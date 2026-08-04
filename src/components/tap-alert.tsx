import { Badge, classTone, radiusTone } from "./ui";
import { duration, renderTemplate, titleize, ago } from "@/lib/format";
import type { TapType } from "@/lib/config";

export interface TapRow {
  tap_id: string;
  tap_type_id: string;
  tap_class: string;
  domain_key: string;
  object_name: string;
  entity_key: string;
  recipient_name: string;
  recipient_email: string;
  recipient_department: string;
  recipient_authority: string;
  routed_via: string;
  channel: string;
  generated_at: string;
  delivered_at: string;
  due_at: string;
  sla_hours: number;
  blast_radius: string;
  dependent_count: number;
  status: string;
  context_json: string;
  responded_at?: string | null;
  minutes_to_respond?: number | null;
  answer?: string | null;
  quality_score?: number | null;
  durable?: boolean | null;
  writeback_target?: string | null;
  writeback_ref?: string | null;
  writeback_status?: string | null;
}

export const ctxOf = (t: TapRow): Record<string, unknown> => {
  try {
    return JSON.parse(t.context_json ?? "{}");
  } catch {
    return {};
  }
};

/**
 * The tap as the recipient sees it.
 *
 * This is the whole product in one component, so the constraints are worth
 * naming: one question, at most three context lines, every option a single
 * click, an explicit uncertainty escape, and a deflect action. If a tap needs
 * scrolling, the tap type is wrong -- not the renderer.
 */
export function TapAlert({
  tap,
  type,
  surface = "slack",
  interactive = true,
}: {
  tap: TapRow;
  type: TapType | undefined;
  surface?: "slack" | "email" | "claude";
  interactive?: boolean;
}) {
  const ctx = ctxOf(tap);
  const question = type ? renderTemplate(type.question.template, ctx) : tap.tap_type_id;
  const lines = (type?.question.context ?? []).map((l) => renderTemplate(l, ctx));
  const options = type?.question.response.options ?? [];
  const requireRationale = new Set(type?.question.response.require_rationale_on ?? []);

  const chrome = {
    slack: { name: "TapIQ", handle: "APP", accent: "border-l-teal-600" },
    email: { name: "TapIQ digest", handle: "no-reply@tapiq.dev", accent: "border-l-slate-400" },
    claude: { name: "Claude", handle: "assistant", accent: "border-l-violet-500" },
  }[surface];

  return (
    <div className={`rounded-md border border-slate-200 bg-white ${surface === "slack" ? "" : ""}`}>
      {/* surface chrome -- makes it legible that this is a simulation of a
          channel we have not built the integration for yet */}
      <div className="flex items-center gap-2 rounded-t-md border-b border-slate-100 bg-slate-50 px-3 py-1.5">
        <span className="flex h-4 w-4 items-center justify-center rounded bg-teal-700 text-[9px] font-bold text-white">
          T
        </span>
        <span className="text-xs font-semibold text-slate-800">{chrome.name}</span>
        <span className="rounded bg-slate-200 px-1 py-px text-[9px] font-semibold uppercase text-slate-600">
          {chrome.handle}
        </span>
        <span className="ml-auto text-[10px] text-slate-400">
          to {tap.recipient_name} · {ago(tap.delivered_at)}
        </span>
      </div>

      <div className={`border-l-2 ${chrome.accent} px-4 py-3.5`}>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <Badge tone={classTone(tap.tap_class)}>{tap.tap_class}</Badge>
          <Badge tone={radiusTone(tap.blast_radius)} title={`${tap.dependent_count} downstream dependents`}>
            {tap.blast_radius} blast radius
          </Badge>
          <span className="text-[11px] text-slate-400">
            {tap.domain_key} · {tap.object_name}
          </span>
        </div>

        <p className="text-[15px] font-medium leading-snug text-slate-900">{question}</p>

        {lines.length > 0 && (
          <ul className="mt-2.5 space-y-1">
            {lines.map((l, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-slate-600">
                <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                {l}
              </li>
            ))}
          </ul>
        )}

        {options.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {options.map((o) => {
              const answered = tap.answer === o;
              const needsWhy = requireRationale.has(o);
              return (
                <button
                  key={o}
                  disabled={!interactive}
                  className={`rounded border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    answered
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 disabled:hover:border-slate-300 disabled:hover:bg-white"
                  }`}
                >
                  {o}
                  {needsWhy && !answered && (
                    <span className="ml-1 text-[9px] font-normal opacity-60">+ why</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 pt-2.5 text-[11px] text-slate-400">
          {type?.routing.deflection_allowed && (
            <button
              disabled={!interactive}
              className="text-slate-500 underline decoration-dotted hover:text-slate-800"
            >
              Not me — reassign
            </button>
          )}
          <span>
            Due in {duration(tap.sla_hours * 60)} · on timeout:{" "}
            {titleize(type?.sla.on_timeout ?? "--")}
          </span>
          <span className="ml-auto">
            {tap.tap_id} · v{type?.version ?? "?"}
          </span>
        </div>
      </div>
    </div>
  );
}
