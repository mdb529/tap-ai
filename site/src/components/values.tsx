"use client";

import { useState } from "react";

/**
 * The three values. This is the spine of the whole page — everything else is
 * evidence for one of these:
 *
 *   1. LIGHTWEIGHT   lowers the barrier for non-technical experts to contribute
 *   2. GOVERNED      lets them effect change without risking your systems
 *   3. ACTIVE        drives decisions instead of waiting to be opened
 *
 * Each pillar is stated as a claim, then immediately backed with mechanisms
 * rather than adjectives. The third one carries the sharpest contrast in the
 * product — a BI dashboard is passive by construction, and that is a design
 * property, not a criticism of anyone's dashboard.
 */

type Key = "light" | "governed" | "active";

interface Pillar {
  key: Key;
  n: string;
  name: string;
  claim: string;
  /** Concrete mechanisms. No adjectives allowed in here. */
  proof: { label: string; detail: string }[];
  /** The objection this pillar answers. */
  objection: string;
  answer: string;
  glyph: string;
}

const PILLARS: Pillar[] = [
  {
    key: "light",
    n: "01",
    name: "Lightweight",
    claim:
      "A subject-matter expert contributes in five seconds, from a tool they already have open.",
    proof: [
      { label: "One question", detail: "Never two. At most three lines of context, 2–5 buttons." },
      { label: "Their app, not ours", detail: "Slack, Teams, email, or an AI assistant. Nothing to install, no login." },
      { label: "No new vocabulary", detail: "Nobody learns branches, pull requests, or what a semantic layer is." },
      { label: "31 seconds", detail: "Median time to answer across the routine question types." },
    ],
    objection: "Our experts are too busy to add another tool.",
    answer:
      "They are not adding one. The question arrives where they already work, and answering it is faster than deciding to ignore it.",
    glyph: "M13 2L4.5 12.5h6L9 22l8.5-10.5h-6z",
  },
  {
    key: "governed",
    n: "02",
    name: "Safe and governed",
    claim:
      "Non-technical people can change what the business means without being able to break how it runs.",
    proof: [
      { label: "Engineers still approve", detail: "Company-level decisions open a pull request. Your reviewers, your CI, your staging." },
      { label: "Every decision logged", detail: "Who decided, when, what they were shown, what changed downstream, whether it held." },
      { label: "SSO decides who may answer", detail: "Authority comes from your identity provider. A tap that binds the org will not accept a junior answer." },
      { label: "Fail closed", detail: "An unanswered privacy classification defaults to restricted, never to open." },
    ],
    objection: "We are not letting business users near production.",
    answer:
      "They never touch it. They answer a question; the change is proposed on their behalf and reviewed exactly like any other change.",
    glyph: "M12 3l8 4v6c0 4-3.5 7-8 8-4.5-1-8-4-8-8V7z",
  },
  {
    key: "active",
    n: "03",
    name: "Drives real change",
    claim:
      "The right person is asked at the moment the decision matters — not shown a chart and left to notice.",
    proof: [
      { label: "Proactive, not reactive", detail: "A dashboard waits to be opened by someone who already suspects a problem. A tap arrives when the decision is needed." },
      { label: "No alert fatigue", detail: "Every question has a cooldown, a daily ceiling, and quiet hours. Answered once, never re-asked." },
      { label: "Precision is gated", detail: "Every tap carries a 'was this worth asking?' rating. A question type below 60% gets paused." },
      { label: "Ends in a change", detail: "The output is a decision applied to your systems, not a number on a screen." },
    ],
    objection: "We already have dashboards for this.",
    answer:
      "Dashboards are excellent at showing you a number moved. They have no opinion on whether it should have, and no way to reach the one person who knows.",
    glyph: "M3 12h4l3-8 4 16 3-8h4",
  },
];

const TONE: Record<Key, { ring: string; text: string; bg: string; chip: string }> = {
  light: { ring: "ring-amber-400/40", text: "text-amber-300", bg: "bg-amber-400/10", chip: "bg-amber-400" },
  governed: { ring: "ring-sky-400/40", text: "text-sky-300", bg: "bg-sky-400/10", chip: "bg-sky-400" },
  active: { ring: "ring-teal-400/40", text: "text-teal-300", bg: "bg-teal-400/10", chip: "bg-teal-400" },
};

export function Values() {
  const [active, setActive] = useState<Key>("light");
  const p = PILLARS.find((x) => x.key === active)!;
  const tone = TONE[active];

  return (
    <div>
      {/* the three claims, always all visible */}
      <div className="grid gap-3 sm:grid-cols-3">
        {PILLARS.map((x) => {
          const on = x.key === active;
          const t = TONE[x.key];
          return (
            <button
              key={x.key}
              onClick={() => setActive(x.key)}
              aria-pressed={on}
              className={`rounded-xl px-4 py-4 text-left transition-all ring-1 ring-inset ${
                on ? `${t.bg} ${t.ring}` : "bg-white/[0.03] ring-white/10 hover:bg-white/[0.07]"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg
                  viewBox="0 0 24 24"
                  className={`h-4 w-4 ${on ? t.text : "text-slate-500"}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d={x.glyph} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className={`font-mono text-[10px] font-bold ${on ? t.text : "text-slate-500"}`}>
                  {x.n}
                </span>
                <span className={`text-[14px] font-semibold ${on ? "text-white" : "text-slate-300"}`}>
                  {x.name}
                </span>
              </div>
              <p className={`mt-2 text-[12.5px] leading-relaxed ${on ? "text-slate-200" : "text-slate-400"}`}>
                {x.claim}
              </p>
            </button>
          );
        })}
      </div>

      {/* proof for the selected one */}
      <div key={active} className="mt-4 animate-[fadeIn_.28s_ease-out] grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className={`rounded-xl px-4 py-4 ring-1 ring-inset sm:px-5 ${tone.bg} ${tone.ring}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
            How, specifically
          </p>
          <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {p.proof.map((f) => (
              <div key={f.label} className="flex gap-2.5">
                <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${tone.chip}`} />
                <div>
                  <dt className="text-[12.5px] font-semibold text-white">{f.label}</dt>
                  <dd className="mt-0.5 text-[12px] leading-relaxed text-slate-300">{f.detail}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-xl bg-white/[0.04] px-4 py-4 ring-1 ring-inset ring-white/10 sm:px-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            The objection
          </p>
          <p className="mt-2 text-[13.5px] font-medium italic leading-snug text-slate-200">
            &ldquo;{p.objection}&rdquo;
          </p>
          <p className="mt-3 border-t border-white/10 pt-3 text-[12.5px] leading-relaxed text-slate-300">
            {p.answer}
          </p>
        </div>
      </div>

      {/* the active-vs-passive contrast, shown only where it belongs */}
      {active === "active" && <ActiveVsPassive />}
    </div>
  );
}

/* ------------------------------------------------- active vs passive BI */

function ActiveVsPassive() {
  const rows: [string, string, string][] = [
    ["Who starts it", "A person who already suspects something", "The system, when a decision is needed"],
    ["Who it reaches", "Whoever happens to open the tab", "The one person who owns that call"],
    ["What it asks for", "Interpretation", "A single decision"],
    ["What it produces", "A number on a screen", "A change applied to your systems"],
    ["If nobody looks", "Nothing happens, indefinitely", "It escalates, or applies a safe default"],
  ];

  return (
    <div className="mt-4 animate-[fadeIn_.3s_ease-out]">
      {/* Stacked pairs on mobile, a real 3-column grid from sm up. No horizontal
          scroll at any width -- this is the most quotable comparison on the page
          and it should never be half off-screen. */}
      <div className="space-y-2 sm:hidden">
        {rows.map(([label, passive, active]) => (
          <div key={label} className="overflow-hidden rounded-lg ring-1 ring-inset ring-white/10">
            <p className="bg-white/[0.04] px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
              {label}
            </p>
            <div className="flex items-start gap-2 px-3 py-2">
              <span className="mt-px shrink-0 text-[9.5px] font-bold uppercase tracking-wider text-slate-600">
                BI
              </span>
              <span className="text-[12.5px] leading-snug text-slate-400">{passive}</span>
            </div>
            <div className="flex items-start gap-2 bg-teal-500/[0.09] px-3 py-2">
              <span className="mt-px shrink-0 text-[9.5px] font-bold uppercase tracking-wider text-teal-400">
                Tap
              </span>
              <span className="text-[12.5px] font-medium leading-snug text-slate-100">{active}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl ring-1 ring-inset ring-white/10 sm:block">
        <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)] gap-px bg-white/10 text-[12px]">
          <div className="bg-slate-950 px-3.5 py-2.5" />
          <div className="bg-slate-950 px-3.5 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              A BI dashboard
            </p>
            <p className="mt-0.5 text-[10.5px] text-slate-600">passive by construction</p>
          </div>
          <div className="bg-teal-500/10 px-3.5 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-teal-300">A tap</p>
            <p className="mt-0.5 text-[10.5px] text-teal-400/70">active by construction</p>
          </div>

          {rows.map(([label, passive, active]) => (
            <div key={label} className="contents">
              <div className="bg-slate-950 px-3.5 py-2.5 text-slate-400">{label}</div>
              <div className="bg-slate-950 px-3.5 py-2.5 text-slate-400">{passive}</div>
              <div className="bg-teal-500/[0.07] px-3.5 py-2.5 font-medium text-slate-100">{active}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-2.5 text-[11.5px] leading-relaxed text-slate-500">
        Not a knock on dashboards — they are the right tool for exploring. But a dashboard cannot
        ask, and a question that never gets asked never gets answered.
      </p>
    </div>
  );
}
