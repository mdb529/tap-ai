"use client";

import { useState } from "react";
import { SCENARIOS, computeRoi, fmtMoney, NOT_COUNTED, ASSUMPTION, RATE } from "@/lib/roi";

/**
 * ROI.
 *
 * The design constraint here is credibility, not persuasion. A finance buyer has
 * been shown a hundred ROI slides and discounts all of them, so this section is
 * built to survive being argued with:
 *
 *   * Every number is COMPUTED from published assumptions (see lib/roi.ts).
 *     Nothing is asserted.
 *   * The arithmetic for each line is on screen, not in a footnote.
 *   * The 45% attribution haircut is shown as a line item that SUBTRACTS, rather
 *     than being quietly applied. Visibly discarding value is the single most
 *     persuasive thing on the page.
 *   * What we deliberately do not count is listed. A model with no stated limits
 *     reads as a model with hidden ones.
 *
 * The result is 2-3x, and it says so. That is a credible enterprise return; a
 * bigger claim would cost more trust than it buys.
 */
export function Roi() {
  const [i, setI] = useState(1); // 600-employee Growth case: the modal buyer.
  const s = SCENARIOS[i];
  const r = computeRoi(s);
  const [open, setOpen] = useState(false);

  return (
    <div>
      {/* ------------------------------------------------------- org size picker */}
      <div className="mb-7 flex flex-wrap items-center justify-center gap-1.5">
        {SCENARIOS.map((sc, k) => (
          <button
            key={sc.key}
            onClick={() => setI(k)}
            aria-pressed={k === i}
            className={`rounded-full px-3.5 py-2 text-[12.5px] font-medium transition-all duration-300 ${
              k === i
                ? "bg-slate-900 text-white shadow-lg"
                : "text-slate-500 ring-1 ring-inset ring-slate-300 hover:text-slate-900"
            }`}
          >
            {sc.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-6">
        {/* ------------------------------------------------------------- lines */}
        <div className="space-y-2.5">
          {r.lines.map((l) => (
            <div key={l.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[14px] font-semibold leading-snug text-slate-900 sm:text-[15px]">
                  {l.label}
                </p>
                <p className="shrink-0 text-[17px] font-semibold tabular-nums text-slate-900 sm:text-[19px]">
                  {fmtMoney(l.gross)}
                </p>
              </div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-600">{l.claim}</p>
              <p className="mt-2.5 rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-[10.5px] leading-relaxed text-slate-500">
                {l.workings}
              </p>
            </div>
          ))}

          {/* The haircut, as a visible subtraction. */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[14px] font-semibold leading-snug text-amber-900 sm:text-[15px]">
                Less: value we do not claim
              </p>
              <p className="shrink-0 text-[17px] font-semibold tabular-nums text-amber-800 sm:text-[19px]">
                −{fmtMoney(r.discarded)}
              </p>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-amber-800">
              Some of these decisions would have been made anyway — later, and more expensively. We
              discard {Math.round((1 - ASSUMPTION.attribution) * 100)}% of modelled value on that
              basis.
            </p>
          </div>
        </div>

        {/* -------------------------------------------------------- the total */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-slate-900 p-5 text-white sm:p-6">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-teal-300">
              Annual value claimed
            </p>
            <p className="mt-1.5 text-[2.1rem] font-semibold leading-none tracking-[-0.03em] tabular-nums sm:text-[2.6rem]">
              {fmtMoney(r.claimed)}
            </p>

            <dl className="mt-5 space-y-2 border-t border-white/10 pt-4 text-[12.5px]">
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-slate-400">{s.plan} plan</dt>
                <dd className="font-medium tabular-nums text-slate-200">
                  {r.fee === 0 ? "Free" : `−${fmtMoney(r.fee)}`}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2 border-t border-white/10 pt-2">
                <dt className="font-semibold text-white">Net</dt>
                <dd className="text-[15px] font-semibold tabular-nums text-teal-300">
                  {fmtMoney(r.net)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-slate-400">Return on fee</dt>
                <dd className="font-medium tabular-nums text-slate-200">
                  {r.multiple === null ? "No fee to return" : `${r.multiple.toFixed(1)}×`}
                </dd>
              </div>
            </dl>

            <div className="mt-4 rounded-xl bg-white/[0.06] px-3.5 py-3">
              <p className="text-[11.5px] leading-relaxed text-slate-300">
                <strong className="font-semibold text-white">
                  {Math.round(r.engineerHours).toLocaleString()} engineering hours
                </strong>{" "}
                returned to the backlog — roughly{" "}
                {(r.engineerHours / 1800).toFixed(1)} full-time years of capacity that was going
                into rework.
              </p>
            </div>

            <p className="mt-3.5 text-[11px] leading-relaxed text-slate-500">
              {s.contributors} contributors of {s.employees.toLocaleString()} employees. Rates:
              ${RATE.engineer}/h engineering, ${RATE.stakeholder}/h stakeholder time.
            </p>
          </div>

          {/* What we left out. */}
          <button
            onClick={() => setOpen(!open)}
            className="mt-2.5 flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:bg-slate-50"
          >
            <span className="text-[12.5px] font-medium text-slate-700">
              What this model does not count
            </span>
            <span className="shrink-0 text-[11px] text-slate-400">{open ? "Hide" : "Show"}</span>
          </button>
          {open && (
            <ul className="mt-1.5 animate-[fadeIn_.3s_ease-out] space-y-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3.5">
              {NOT_COUNTED.map((n) => (
                <li key={n} className="flex gap-2 text-[12px] leading-relaxed text-slate-600">
                  <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                  {n}
                </li>
              ))}
              <li className="mt-1 border-t border-slate-100 pt-2 text-[11.5px] italic leading-relaxed text-slate-500">
                All plausible. None measurable enough to put a number on, so none of it is in the
                figure above.
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
