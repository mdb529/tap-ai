"use client";

import { useState } from "react";
import { TAP_CLASSES, type TapClass } from "@/lib/scenarios";
import {
  FAMILIES,
  DETECTION,
  PLAN_LABEL,
  PLAN_ORDER,
  CLASS_LABEL,
  CLASS_MEANS,
  cellsForPlan,
  detectionForPlan,
  planIncludes,
  type PlanKey,
} from "@/lib/taxonomy";

/**
 * THE FAMILY × CLASS GRID, filtered by plan.
 *
 * This sits inside the pricing section on purpose. The two axes are a product
 * concept, but "which of these do I get" is a pricing question, and separating
 * them meant a visitor reading the taxonomy and then scrolling past the tiers
 * without ever connecting the two.
 *
 * The plan selector DIMS rather than hides. Showing someone the cell they are not
 * buying is the entire mechanic of a good upgrade path — hiding it just makes the
 * cheap tier look complete.
 *
 * MOBILE. A 5×3 grid does not fit in 360px, so below `sm` this becomes a stack of
 * families, each with its three class rows. Same data, same dimming, no
 * horizontal scroll.
 */

const TONE: Record<TapClass, { text: string; ring: string; soft: string }> = {
  tactical: { text: "text-sky-700", ring: "ring-sky-200", soft: "bg-sky-50" },
  operational: { text: "text-emerald-700", ring: "ring-emerald-200", soft: "bg-emerald-50" },
  strategic: { text: "text-violet-700", ring: "ring-violet-200", soft: "bg-violet-50" },
};

export function TapMatrix() {
  const [plan, setPlan] = useState<PlanKey>("growth");

  return (
    <div>
      {/* ------------------------------------------------------- plan selector */}
      <div className="mb-5 flex flex-col items-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {PLAN_ORDER.map((p) => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              aria-pressed={p === plan}
              className={`rounded-full px-3.5 py-2 text-[12.5px] font-medium transition-all duration-300 ${
                p === plan
                  ? "bg-slate-900 text-white shadow-lg"
                  : "text-slate-500 ring-1 ring-inset ring-slate-300 hover:text-slate-900"
              }`}
            >
              {PLAN_LABEL[p]}
            </button>
          ))}
        </div>
        <p className="text-[12px] text-slate-500">
          <strong className="font-semibold text-slate-800">{cellsForPlan(plan)} of 14</strong>{" "}
          question types included ·{" "}
          {detectionForPlan(plan)
            .map((m) => DETECTION[m].label.toLowerCase())
            .join(", ")}
        </p>
      </div>

      {/* ============================================================ desktop */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-[minmax(0,1.15fr)_repeat(3,minmax(0,1fr))] gap-2">
          <div />
          {TAP_CLASSES.map((c) => (
            <div key={c} className="px-1 pb-1">
              <p className={`text-[11.5px] font-bold uppercase tracking-wide ${TONE[c].text}`}>
                {CLASS_LABEL[c]}
              </p>
              <p className="mt-0.5 text-[10.5px] leading-snug text-slate-500">{CLASS_MEANS[c]}</p>
            </div>
          ))}

          {FAMILIES.map((f) => (
            <div key={f.id} className="contents">
              <div className="flex items-start gap-2 rounded-xl bg-slate-100/70 px-3 py-3">
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="mt-0.5 h-4 w-4 shrink-0 stroke-slate-500"
                  fill="none"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                >
                  <path d={f.glyph} />
                </svg>
                <div>
                  <p className="text-[13px] font-semibold leading-tight text-slate-900">{f.label}</p>
                  <p className="mt-1 text-[11px] leading-snug text-slate-500">{f.asks}</p>
                  <p className="mt-1.5 text-[10.5px] italic text-slate-400">{f.answeredBy}</p>
                </div>
              </div>

              {TAP_CLASSES.map((c) => {
                const cell = f.cells[c];
                const on = planIncludes(plan, cell);
                if (!cell) {
                  return (
                    <div
                      key={c}
                      className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 px-3 py-3"
                    >
                      <p className="text-[10.5px] text-slate-300">not applicable</p>
                    </div>
                  );
                }
                return (
                  <div
                    key={c}
                    className={`rounded-xl px-3 py-3 ring-1 ring-inset transition-all duration-300 ${
                      on
                        ? `${TONE[c].soft} ${TONE[c].ring}`
                        : "bg-white ring-slate-200 opacity-45"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                          on ? "bg-white/70 text-slate-600" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {DETECTION[cell.detection].label.replace("Triggered by an event", "triggered").replace("Detected automatically", "automatic").replace("Found by an AI agent audit", "AI audit")}
                      </span>
                      {on ? (
                        <svg
                          aria-hidden
                          viewBox="0 0 24 24"
                          className="h-3.5 w-3.5 shrink-0 stroke-teal-600"
                          fill="none"
                          strokeWidth={2.6}
                          strokeLinecap="round"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                          {PLAN_LABEL[cell.plan]}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[11.5px] leading-relaxed text-slate-700">
                      “{cell.example}”
                    </p>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================= mobile */}
      <div className="space-y-2.5 sm:hidden">
        {FAMILIES.map((f) => (
          <div key={f.id} className="rounded-2xl border border-slate-200 bg-white p-3.5">
            <div className="flex items-start gap-2">
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="mt-0.5 h-4 w-4 shrink-0 stroke-slate-500"
                fill="none"
                strokeWidth={1.7}
                strokeLinecap="round"
              >
                <path d={f.glyph} />
              </svg>
              <div>
                <p className="text-[13.5px] font-semibold leading-tight text-slate-900">{f.label}</p>
                <p className="mt-1 text-[11.5px] leading-snug text-slate-500">{f.asks}</p>
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              {TAP_CLASSES.map((c) => {
                const cell = f.cells[c];
                if (!cell) return null;
                const on = planIncludes(plan, cell);
                return (
                  <div
                    key={c}
                    className={`rounded-xl px-3 py-2.5 ring-1 ring-inset transition-all duration-300 ${
                      on ? `${TONE[c].soft} ${TONE[c].ring}` : "bg-slate-50 ring-slate-200 opacity-55"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${TONE[c].text}`}>
                        {CLASS_LABEL[c]}
                      </span>
                      <span className="shrink-0 text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">
                        {on ? "included" : PLAN_LABEL[cell.plan]}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-700">
                      “{cell.example}”
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ------------------------------------------------- the detection axis */}
      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        {(["triggered", "automatic", "audit"] as const).map((m) => {
          const on = detectionForPlan(plan).includes(m);
          const d = DETECTION[m];
          return (
            <div
              key={m}
              className={`rounded-xl px-3.5 py-3 ring-1 ring-inset transition-all duration-300 ${
                on ? "bg-white ring-slate-200" : "bg-slate-50 ring-slate-200 opacity-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className={`h-4 w-4 shrink-0 ${on ? "stroke-teal-600" : "stroke-slate-400"}`}
                  fill="none"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                >
                  <path d={d.glyph} />
                </svg>
                <p className="text-[12.5px] font-semibold text-slate-900">{d.label}</p>
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-600">{d.how}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{d.needs}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
