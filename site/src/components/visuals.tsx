"use client";

import { useState } from "react";

/**
 * Homepage visuals. Each of these replaces two or three paragraphs of prose,
 * which is the point — an argument someone can operate lands harder than an
 * argument they have to read.
 *
 * All hand-rolled SVG and DOM. No chart library: these are simple shapes, and a
 * dependency that can fail on install is a bad trade for a marketing page.
 */

/* ========================================================== the gap diagram */

/**
 * Two groups, one channel between them. Toggling shows the channel missing
 * versus present. The toggle is doing real work — the "without" state is the
 * status quo the visitor lives in, and they should recognize it.
 */
export function GapDiagram() {
  const [on, setOn] = useState(false);

  const LEFT = ["Controller", "Clinician", "Adjuster", "Counsel", "Merchandiser"];
  const RIGHT = ["Analytics engineer", "Data engineer", "Platform team"];

  return (
    <div>
      <div className="mb-4 inline-flex gap-1 rounded-full bg-slate-100 p-1">
        {[
          ["Today", false],
          ["With Tap AI", true],
        ].map(([label, v]) => (
          <button
            key={String(label)}
            onClick={() => setOn(v as boolean)}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-all ${
              on === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {label as string}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-4">
          {/* who knows */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Holds the business context
            </p>
            <div className="space-y-1.5">
              {LEFT.map((p) => (
                <div
                  key={p}
                  className="rounded-md border border-amber-200 bg-amber-50/70 px-2.5 py-1.5 text-[12px] font-medium text-slate-800"
                >
                  {p}
                </div>
              ))}
            </div>
          </div>

          {/* the channel */}
          <div className="flex flex-col items-center py-2">
            <svg viewBox="0 0 120 150" className="h-28 w-20 rotate-90 sm:h-36 sm:w-24 sm:rotate-0" fill="none">
              {/* upper path */}
              <path
                d={on ? "M4 40 C 45 40, 75 40, 116 40" : "M4 40 C 30 40, 40 40, 48 40"}
                stroke={on ? "#0d9488" : "#cbd5e1"}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={on ? "0" : "5 5"}
                className="transition-all duration-500"
              />
              {!on && (
                <>
                  <path d="M52 32 L64 48 M64 32 L52 48" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" />
                  <path
                    d="M68 40 C 90 40, 100 40, 116 40"
                    stroke="#cbd5e1"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="5 5"
                  />
                </>
              )}
              {on && (
                <g className="animate-[fadeIn_.5s_ease-out]">
                  <circle cx="60" cy="40" r="13" fill="#0d9488" />
                  <text x="60" y="45" textAnchor="middle" className="fill-white text-[11px] font-bold">
                    T
                  </text>
                </g>
              )}

              {/* lower return path — the decision coming back */}
              <path
                d={on ? "M116 110 C 75 110, 45 110, 4 110" : "M116 110 C 100 110, 92 110, 84 110"}
                stroke={on ? "#0d9488" : "#cbd5e1"}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={on ? "0" : "5 5"}
                className="transition-all duration-500"
              />
              {!on && <path d="M76 102 L64 118 M64 102 L76 118" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" />}

              <text x="60" y="14" textAnchor="middle" className="fill-slate-400 text-[9px]">
                {on ? "one question" : "no way in"}
              </text>
              <text x="60" y="140" textAnchor="middle" className="fill-slate-400 text-[9px]">
                {on ? "an explicit decision" : "no way back"}
              </text>
            </svg>
          </div>

          {/* who commits */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-sky-700">
              Builds the systems
            </p>
            <div className="space-y-1.5">
              {RIGHT.map((p) => (
                <div
                  key={p}
                  className="rounded-md border border-sky-200 bg-sky-50/70 px-2.5 py-1.5 text-[12px] font-medium text-slate-800"
                >
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>

        <p
          className={`mt-4 rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed transition-colors ${
            on ? "bg-teal-50 text-teal-950/90" : "bg-slate-100 text-slate-700"
          }`}
        >
          {on ? (
            <>
              <strong>Both groups are in the loop.</strong> Expertise arrives as a question answerable
              in seconds; engineers get an explicit decision to build against instead of an
              assumption to make.
            </>
          ) : (
            <>
              <strong>There is no channel between them.</strong> Both teams are doing their jobs well
              — the expertise simply has no way to reach the systems that need it.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/* ========================================================== drift chart */

/**
 * The cost, in one shape. Two teams' "revenue" diverging because there was never
 * a moment to decide.
 * More persuasive than any adjective, and it takes about four seconds to read.
 */
export function DriftChart() {
  const months = ["Jan", "Mar", "May", "Jul", "Sep", "Nov", "Jan", "Mar"];
  const finance = [100, 101, 103, 104, 106, 108, 110, 112];
  const marketing = [100, 101, 104, 107, 112, 118, 125, 131];
  const max = 140;
  const H = 150;
  const x = (i: number) => (i / (months.length - 1)) * 96 + 2;
  const y = (v: number) => H - 22 - ((v - 95) / (max - 95)) * (H - 34);

  const pts = (vals: number[]) => vals.map((v, i) => `${x(i)},${y(v)}`);
  const path = (vals: number[]) => pts(vals).join(" ");
  /** The shaded wedge between the two lines: upper line forward, lower reversed. */
  const wedge = [...pts(marketing), ...pts(finance).reverse()].join(" ");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[13px] font-semibold text-slate-900">
          &ldquo;Net revenue&rdquo;, as reported by two teams
        </p>
        <div className="flex gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="inline-block h-2 w-2 rounded-sm bg-teal-700" />
            Finance
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="inline-block h-2 w-2 rounded-sm bg-rose-500" />
            Marketing
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: H }}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1="0"
            x2="100"
            y1={H - 22 - f * (H - 34)}
            y2={H - 22 - f * (H - 34)}
            stroke="#e2e8f0"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {/* divergence shading */}
        <polygon points={wedge} fill="#f43f5e" opacity="0.08" />
        <polyline points={path(finance)} fill="none" stroke="#0f766e" strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        <polyline points={path(marketing)} fill="none" stroke="#f43f5e" strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        <line
          x1={x(months.length - 1)}
          x2={x(months.length - 1)}
          y1={y(finance[finance.length - 1])}
          y2={y(marketing[marketing.length - 1])}
          stroke="#be123c"
          strokeWidth="1"
          strokeDasharray="2 2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="mt-1 flex text-[10px] text-slate-400">
        {months.map((m, i) => (
          <div key={`${m}-${i}`} className="flex-1 text-center">
            {m}
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-px overflow-hidden rounded-lg bg-slate-200 sm:grid-cols-3">
        {[
          ["17%", "apart after 26 months"],
          ["0", "tickets ever filed"],
          ["3 weeks", "to reconcile, once"],
        ].map(([v, l]) => (
          <div key={l} className="bg-slate-50 px-3 py-2">
            <p className="text-[15px] font-semibold text-slate-900">{v}</p>
            <p className="text-[11px] leading-tight text-slate-500">{l}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[12.5px] leading-relaxed text-slate-600">
        Two reasonable choices, made eighteen months apart, by people who each had part of the
        picture. <strong className="text-slate-900">There was never a moment to decide.</strong> No
        outage, no alert — which is exactly why it ran for two years.
      </p>
    </div>
  );
}

/* ================================================== approach comparison */

/**
 * Five requirements, grouped under the three values they serve. Grouping them
 * matters: it turns a feature checklist into an argument, and it makes the shape
 * of the Tap AI row mean something rather than just being longer.
 */
const REQUIREMENTS = [
  { key: "where",   label: "Meets people where they are",       value: "Lightweight" },
  { key: "effort",  label: "No ongoing upkeep required",        value: "Lightweight" },
  { key: "durable", label: "Answer becomes part of the system", value: "Governed" },
  { key: "safe",    label: "Defined outcome when ignored",      value: "Governed" },
  { key: "route",   label: "Reaches the person who knows",      value: "Active" },
] as const;

const VALUE_TONE: Record<string, string> = {
  Lightweight: "text-amber-700",
  Governed: "text-sky-700",
  Active: "text-teal-700",
};

interface Approach {
  name: string;
  scores: Record<string, 0 | 1 | 2>;
  flaw: string;
  /** What Tap AI does differently. Only set on the alternatives. */
  contrast?: string;
  us?: boolean;
}

const APPROACHES: Approach[] = [
  {
    name: "Data catalogs",
    scores: { where: 0, effort: 0, durable: 1, route: 0, safe: 0 },
    flaw: "Asks people to go somewhere and document things. Documentation is unpaid homework competing with someone's real job, so the catalog ends up partly populated and largely stale.",
    contrast: "Tap AI never asks anyone to maintain anything — it asks one question, once, at the moment the answer is needed.",
  },
  {
    name: "Tickets and intake forms",
    scores: { where: 1, effort: 0, durable: 0, route: 1, safe: 0 },
    flaw: "The answer arrives as prose in a comment thread. Nothing about it becomes durable, attributable or machine-readable, and the person who filed it waits.",
    contrast: "Tap AI turns the answer into a reviewed change and a logged decision, automatically.",
  },
  {
    name: "Data observability",
    scores: { where: 1, effort: 1, durable: 0, route: 0, safe: 1 },
    flaw: "Excellent at telling you a number moved, silent on whether it should have. And it pages engineers, who are the wrong audience for a business question.",
    contrast: "Tap AI routes the business question to the business owner, and ends in a decision rather than an acknowledgement.",
  },
  {
    name: "Low-code editors",
    scores: { where: 0, effort: 1, durable: 1, route: 1, safe: 0 },
    flaw: "Still requires the expert to enter your world — branches, reviews, merge conflicts. Adoption reliably dies at the second interaction.",
    contrast: "Tap AI goes to them instead. Nothing to log into, nothing to learn.",
  },
  {
    name: "BI dashboards",
    scores: { where: 1, effort: 1, durable: 0, route: 0, safe: 0 },
    flaw: "Passive by construction. Someone has to already suspect a problem, open the right view, and then know what to do about it. Nothing happens if nobody looks.",
    contrast: "Tap AI reaches out when the decision is needed, and if nobody answers it escalates or applies a safe default.",
  },
  {
    name: "Tap AI",
    scores: { where: 2, effort: 2, durable: 2, route: 2, safe: 2 },
    flaw: "One question in the channel they already use. The answer becomes a reviewed change, routed from ownership files you already maintain, with a defined timeout behaviour and a logged decision.",
    us: true,
  },
];

export function ApproachMatrix() {
  const [open, setOpen] = useState<string | null>("Tap AI");
  const us = APPROACHES.find((x) => x.us)!;
  const alternatives = APPROACHES.filter((x) => !x.us);

  const Dots = ({ a, big = false }: { a: Approach; big?: boolean }) => (
    <div className="flex items-center gap-1">
      {REQUIREMENTS.map((r) => {
        const v = a.scores[r.key];
        return (
          <span
            key={r.key}
            title={`${r.label}: ${v === 2 ? "yes" : v === 1 ? "partly" : "no"}`}
            className={`rounded-full ${big ? "h-2.5 w-2.5" : "h-2 w-2"} ${
              v === 2 ? "bg-teal-500" : v === 1 ? "bg-amber-400" : "bg-slate-300"
            }`}
          />
        );
      })}
    </div>
  );

  const met = (a: Approach) =>
    Math.round(Object.values(a.scores).reduce<number>((n, v) => n + v, 0) / 2);

  return (
    <div>
      {/* what "met" means, once, above the cards */}
      <ul className="mb-4 grid gap-1.5 sm:grid-cols-2">
        {REQUIREMENTS.map((r, i) => (
          <li key={r.key} className="flex items-baseline gap-2 text-[12px] leading-snug">
            <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
            <span className="text-slate-600">{r.label}</span>
            <span className={`ml-auto shrink-0 text-[9.5px] font-bold uppercase tracking-wider ${VALUE_TONE[r.value]}`}>
              {r.value}
            </span>
          </li>
        ))}
      </ul>

      {/* alternatives, compact */}
      <div className="space-y-1.5">
        {alternatives.map((a) => {
          const isOpen = open === a.name;
          return (
            <div key={a.name} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <button
                onClick={() => setOpen(isOpen ? null : a.name)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-slate-50"
              >
                <span className="min-w-0 flex-1 truncate text-[13px] text-slate-700">{a.name}</span>
                <Dots a={a} />
                <span className="shrink-0 text-[11.5px] tabular-nums text-slate-400">{met(a)}/5</span>
                <svg
                  viewBox="0 0 24 24"
                  className={`h-3 w-3 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {isOpen && (
                <div className="animate-[fadeIn_.2s_ease-out] border-t border-slate-100 bg-slate-50/70 px-3.5 py-3">
                  <p className="text-[12.5px] leading-relaxed text-slate-700">{a.flaw}</p>
                  {a.contrast && (
                    <p className="mt-2.5 flex gap-2 border-t border-slate-200 pt-2.5 text-[12.5px] leading-relaxed text-teal-900">
                      <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded bg-teal-700 text-[9px] font-bold text-white" aria-hidden>
                        T
                      </span>
                      {a.contrast}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tap AI, deliberately dominant rather than the last row of a table */}
      <div className="mt-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
            what we built instead
          </span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="rounded-xl bg-teal-50 p-4 ring-2 ring-teal-500 sm:p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-700 text-[14px] font-bold text-white" aria-hidden>
              T
            </span>
            <span className="text-[17px] font-bold text-teal-900">Tap AI</span>
            <span className="ml-auto inline-flex items-center rounded-full bg-teal-700 px-2.5 py-1 text-[12px] font-bold tabular-nums text-white">
              5/5
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Dots a={us} big />
            <span className="text-[11.5px] font-medium text-teal-800">all five, no partials</span>
          </div>

          <p className="mt-3 border-t border-teal-200 pt-3 text-[13px] leading-relaxed text-teal-950/90">
            {us.flaw}
          </p>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-slate-500">
        <span className="text-teal-500">●</span> yes ·{" "}
        <span className="text-amber-400">●</span> partly ·{" "}
        <span className="text-slate-300">●</span> no · tap any row for detail
      </p>
    </div>
  );
}
