"use client";

import { useState } from "react";
import { TIERS, ROWS, ROW_GROUPS, PRICING_PRINCIPLE, type Cell } from "@/lib/tiers";

/**
 * PRICING.
 *
 * The old version was a wall: three cards, thirteen label/value rows each,
 * everything the same size. A buyer could read all of it and still not be able to
 * say what the difference between two tiers was — which is the only question the
 * section exists to answer.
 *
 * Three moves fix that, in order of how much they matter:
 *
 *   1. ONE NUMBER PER TIER, in large type. The end-user cap is the gate people
 *      actually size themselves against, so it gets to be the headline instead of
 *      being row four of thirteen.
 *   2. "EVERYTHING IN X, PLUS…" Tiers are cumulative, and saying so out loud is
 *      faster to read than making someone diff two lists to discover it.
 *   3. FIVE ROWS ON THE CARD, THIRTEEN IN THE TABLE. The card carries only what
 *      differentiates; the full comparison is one click away for the person who
 *      wants it. Progressive disclosure beats a complete table nobody finishes.
 *
 * The table also DIMS rows that are identical across all three tiers, so the eye
 * lands on the differences. Hiding them would be worse — a buyer wants to confirm
 * a feature exists at all, not just that it varies.
 */

function Tick({ on }: { on: boolean }) {
  return on ? (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 stroke-teal-600"
      fill="none"
      strokeWidth={2.8}
      strokeLinecap="round"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 stroke-slate-300"
      fill="none"
      strokeWidth={2.4}
      strokeLinecap="round"
    >
      <path d="M6 12h12" />
    </svg>
  );
}

function CellText({ c, dark }: { c: Cell; dark?: boolean }) {
  if (c.yes === undefined) {
    return (
      <span className={`font-medium ${dark ? "text-slate-100" : "text-slate-800"}`}>{c.text}</span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <Tick on={c.yes} />
      <span
        className={
          c.yes
            ? dark
              ? "font-medium text-slate-100"
              : "font-medium text-slate-800"
            : dark
              ? "text-slate-500"
              : "text-slate-400"
        }
      >
        {c.text}
      </span>
    </span>
  );
}

/** A row whose value is identical across every tier is not a differentiator. */
const isSame = (key: (typeof ROWS)[number]["key"]) =>
  new Set(TIERS.map((t) => t.cells[key].text)).size === 1;

export function Pricing() {
  const [table, setTable] = useState(false);
  const heroRows = ROWS.filter((r) => r.hero);

  return (
    <div>
      <div className="mx-auto mb-9 max-w-2xl text-center">
        <h2 className="text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.03em] text-slate-900 sm:text-[2.5rem]">
          {PRICING_PRINCIPLE.headline}
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-slate-600 sm:text-[16px]">
          {PRICING_PRINCIPLE.body}
        </p>
      </div>

      {/* =============================================================== cards */}
      <div className="grid gap-3.5 lg:grid-cols-3">
        {TIERS.map((t) => {
          const dark = !!t.highlight;
          return (
            <div
              key={t.name}
              className={`relative flex h-full flex-col rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-0.5 sm:p-6 ${
                dark ? "bg-slate-900 ring-2 ring-teal-500" : "border border-slate-200 bg-white"
              }`}
            >
              {dark && (
                <span className="absolute -top-2.5 left-5 rounded-full bg-teal-500 px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-slate-900">
                  most teams
                </span>
              )}

              <h3 className={`text-[19px] font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                {t.name}
              </h3>
              <p className={`mt-1 text-[12.5px] leading-snug ${dark ? "text-slate-400" : "text-slate-500"}`}>
                {t.tagline}
              </p>

              <p className="mt-4 flex items-baseline gap-1.5">
                <span
                  className={`text-[28px] font-semibold tracking-[-0.02em] ${dark ? "text-white" : "text-slate-900"}`}
                >
                  {t.price}
                </span>
                <span className={`text-[12px] ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  {t.cadence}
                </span>
              </p>

              {/* ------ the one number worth setting large ------ */}
              <div
                className={`mt-4 rounded-xl px-4 py-3.5 ${
                  dark ? "bg-white/[0.07]" : "bg-slate-50"
                }`}
              >
                <p
                  className={`text-[1.75rem] font-semibold leading-none tracking-[-0.03em] ${
                    dark ? "text-teal-300" : "text-slate-900"
                  }`}
                >
                  {t.headline.stat}
                </p>
                <p className={`mt-1 text-[11.5px] ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  {t.headline.unit}
                </p>
              </div>

              {/* ------ what this tier adds over the one below ------ */}
              {t.adds ? (
                <p
                  className={`mt-3.5 text-[12px] leading-relaxed ${
                    dark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {t.adds}
                </p>
              ) : (
                <p className="mt-3.5 text-[12px] leading-relaxed text-slate-500">
                  Free forever, on one connected system. No card, no trial clock.
                </p>
              )}

              {/* ------ five differentiating rows, not thirteen ------ */}
              <dl
                className="mt-4 space-y-2 border-t pt-4 text-[12.5px]"
                style={{ borderColor: dark ? "rgba(255,255,255,.12)" : "#e2e8f0" }}
              >
                {heroRows.map((r) => (
                  <div key={r.key} className="flex items-baseline justify-between gap-3">
                    <dt className={dark ? "text-slate-400" : "text-slate-500"}>{r.label}</dt>
                    <dd className="shrink-0 text-right">
                      <CellText c={t.cells[r.key]} dark={dark} />
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 flex-1" />
              <p
                className={`rounded-xl px-3 py-2.5 text-center text-[12px] font-semibold ${
                  dark ? "bg-white text-slate-900" : "bg-slate-100 text-slate-700"
                }`}
              >
                Taps: unlimited on every tier
              </p>
            </div>
          );
        })}
      </div>

      {/* ================================================= full comparison */}
      <div className="mt-4">
        <button
          onClick={() => setTable(!table)}
          aria-expanded={table}
          className="mx-auto flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100"
        >
          {table ? "Hide" : "Compare"} all {ROWS.length} rows
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className={`h-3.5 w-3.5 stroke-slate-500 transition-transform duration-300 ${
              table ? "rotate-180" : ""
            }`}
            fill="none"
            strokeWidth={2.2}
            strokeLinecap="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {table && (
          <div className="mt-4 animate-[fadeIn_.35s_ease-out] overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {/* sticky header so the tier names survive a long scroll */}
            <div className="sticky top-[52px] z-10 grid grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] gap-2 border-b border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur sm:px-4">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                Feature
              </span>
              {TIERS.map((t) => (
                <span
                  key={t.name}
                  className={`text-[11.5px] font-bold ${
                    t.highlight ? "text-teal-700" : "text-slate-700"
                  }`}
                >
                  {t.name}
                </span>
              ))}
            </div>

            {ROW_GROUPS.map((g) => (
              <div key={g}>
                <p className="bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:px-4">
                  {g}
                </p>
                {ROWS.filter((r) => r.group === g).map((r) => {
                  const same = isSame(r.key);
                  return (
                    <div
                      key={r.key}
                      className={`grid grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] items-baseline gap-2 border-t border-slate-100 px-3 py-2.5 text-[11.5px] sm:px-4 sm:text-[12.5px] ${
                        same ? "opacity-55" : ""
                      }`}
                    >
                      <span className="pr-1 leading-snug text-slate-600">{r.label}</span>
                      {TIERS.map((t) => (
                        <span key={t.name} className="leading-snug">
                          <CellText c={t.cells[r.key]} />
                        </span>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}

            <p className="border-t border-slate-100 px-3 py-2.5 text-[11px] italic text-slate-400 sm:px-4">
              Dimmed rows are identical on every tier.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
