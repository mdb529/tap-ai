"use client";

import { useState } from "react";

/**
 * Tap anatomy.
 *
 * The argument this section has to make: a tap is not a notification, it is a
 * configured object with dimensions. That is what lets one product serve a
 * coder answering forty routine calls a week and a CFO answering two decisions
 * a quarter, without either experience being wrong for the other.
 *
 * Interaction: pick a dimension on the right, the matching pin lights up on the
 * card. Deliberately simple — hover-only would be unusable on touch.
 */

interface Dimension {
  key: string;
  pin: number;
  name: string;
  summary: string;
  /** The range of values this dimension can take. */
  values: { label: string; note: string; tone?: "sky" | "emerald" | "violet" | "slate" }[];
  /** Why the dimension exists at all. */
  why: string;
}

const DIMENSIONS: Dimension[] = [
  {
    key: "class",
    pin: 1,
    name: "Class",
    summary: "How consequential the answer is — the primary axis everything else keys off.",
    values: [
      { label: "Tactical", note: "Routine, high volume, record-level. Whoever is closest answers.", tone: "sky" },
      { label: "Operational", note: "A recurring rule owned by a function. Lightly reviewed.", tone: "emerald" },
      { label: "Strategic", note: "A company decision. Requires authority and full review.", tone: "violet" },
    ],
    why: "Treating a routine call and a company decision the same way is how governance tools become noise.",
  },
  {
    key: "pacing",
    pin: 2,
    name: "Pacing",
    summary: "How often someone can be asked, and when they cannot be asked at all.",
    values: [
      { label: "Daily ceiling", note: "A dozen for an analyst who lives in the queue, two a week for an executive." },
      { label: "Quiet hours", note: "Honoured per person and per timezone. Nothing arrives at 11pm." },
      { label: "Digest or realtime", note: "Senior roles get a roll-up; people close to the work get it as it happens." },
      { label: "Interrupt budget", note: "Only high-stakes company decisions may break batching, and only twice a week." },
    ],
    why: "Pacing is courtesy, not metering. Taps are unlimited on every plan -- we cap them because being ignorable is fatal, not because they cost anything.",
  },
  {
    key: "routing",
    pin: 3,
    name: "Routing",
    summary: "Who is allowed to answer, and what happens when they cannot.",
    values: [
      { label: "Owner", note: "Resolved from CODEOWNERS first, then a small domain ownership file." },
      { label: "Minimum authority", note: "A tap that binds the org will not accept an intern's answer." },
      { label: "Deflect", note: "“Not me — ask Dana.” Every deflection corrects the ownership map." },
      { label: "Escalate", note: "Walks the manager chain, then falls back to a named steward." },
    ],
    why: "Your identity provider knows org structure. It does not know who owns the revenue definition.",
  },
  {
    key: "channel",
    pin: 4,
    name: "Channel",
    summary: "Where it arrives, and whether it arrives alone or in a digest.",
    values: [
      { label: "Slack / Teams", note: "Real time for people already living in chat." },
      { label: "Email", note: "Digested. The default for executives." },
      { label: "Claude", note: "Conversational — ask what is at stake before deciding." },
      { label: "In-app inbox", note: "A queue for anyone who prefers to batch their own." },
    ],
    why: "Form factor flexes by persona; the tap itself does not. A CFO gets a Monday roll-up, not a stream.",
  },
  {
    key: "sla",
    pin: 5,
    name: "Deadline",
    summary: "How long an answer has, and what happens if none arrives.",
    values: [
      { label: "Response window", note: "Hours for routine calls, days for decisions. Clock starts at delivery." },
      { label: "Escalate on timeout", note: "Moves up the chain rather than dying silently." },
      { label: "Safe default", note: "Privacy taps default to restricted. Fail closed, always." },
      { label: "Expire", note: "Some questions stop mattering. Those are allowed to lapse." },
    ],
    why: "Every tap needs an answer to “what if nobody replies,” or it quietly blocks an engineer forever.",
  },
  {
    key: "writeback",
    pin: 6,
    name: "Write-back",
    summary: "Where the answer becomes durable.",
    values: [
      { label: "Pull request", note: "Strategic decisions. Reviewed by an engineer, merged like any change." },
      { label: "Governed table", note: "Routine answers, batched. No review, no repo noise." },
      { label: "Metadata patch", note: "Classifications and tags. Batched but still reviewed." },
    ],
    why: "A record-level answer is data, not code. A pull request per record buries the ones that matter.",
  },
  {
    key: "memory",
    pin: 7,
    name: "Memory",
    summary: "How long the system remembers, so it stops asking.",
    values: [
      { label: "Dedupe key", note: "What makes two taps the same question." },
      { label: "Cooldown", note: "30 to 365 days. The same person is never asked twice inside it." },
      { label: "Durability window", note: "An answer must survive unreversed before it counts as good." },
    ],
    why: "Every answered tap should reduce future taps. A system that re-asks is a system nobody trusts twice.",
  },
];

const TONE: Record<string, string> = {
  sky: "bg-sky-50 text-sky-700 ring-sky-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function TapAnatomy() {
  const [active, setActive] = useState("class");
  const dim = DIMENSIONS.find((d) => d.key === active) ?? DIMENSIONS[0];

  const Pin = ({ n, label }: { n: number; label: string }) => {
    const on = dim.pin === n;
    return (
      <button
        onClick={() => setActive(DIMENSIONS.find((d) => d.pin === n)!.key)}
        title={label}
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold transition-all ${
          on
            ? "scale-125 bg-teal-600 text-white ring-2 ring-teal-200"
            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
        }`}
      >
        {n}
      </button>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-8">
      {/* ------------------------------------------------------ the card */}
      <div>
        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3.5 py-2">
            <span className="flex h-4 w-4 items-center justify-center rounded bg-teal-700 text-[9px] font-bold text-white" aria-hidden>
              T
            </span>
            <span className="text-[12px] font-semibold text-slate-800">Tap AI</span>
            <span className="ml-auto flex items-center gap-1.5">
              <Pin n={4} label="Channel" />
              <span className="text-[11px] text-slate-500">Slack · to Robert</span>
            </span>
          </div>

          <div className="px-4 py-4">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
                RM
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold leading-tight text-slate-900">Robert Marsh</p>
                <p className="text-[10.5px] leading-tight text-slate-500">chief financial officer</p>
              </div>
              <span className="ml-auto flex items-center gap-1.5">
                <Pin n={3} label="Routing" />
                <Pin n={1} label="Class" />
                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700 ring-1 ring-inset ring-violet-200">
                  strategic
                </span>
              </span>
            </div>

            <p className="text-[15px] font-medium leading-snug text-slate-900">
              Net patient revenue now excludes self-pay accounts. Should that be the official
              definition?
            </p>

            <ul className="mt-2.5 space-y-1.5">
              {["Affects 31 reports, including the board pack.", "Not merged — waiting on you."].map((c) => (
                <li key={c} className="flex gap-2 text-[12.5px] leading-relaxed text-slate-600">
                  <span className="mt-[7px] inline-block h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                  {c}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {["Yes, make it official", "No, revert it", "Needs a review"].map((o, i) => (
                <span
                  key={o}
                  className={`rounded-lg px-3 py-1.5 text-[12.5px] font-medium ${
                    i === 0
                      ? "bg-teal-600 text-white"
                      : "bg-white text-slate-700 ring-1 ring-inset ring-slate-300"
                  }`}
                >
                  {o}
                </span>
              ))}
              <Pin n={6} label="Write-back" />
            </div>

            <div className="mt-3.5 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
              <span className="text-slate-500 underline decoration-dotted">Not me — reassign</span>
              <span className="text-slate-300">·</span>
              <Pin n={5} label="Deadline" />
              <span>Due in 24h · then escalates</span>
              <span className="ml-auto flex items-center gap-1.5">
                <Pin n={7} label="Memory" />
                <span>30-day cooldown</span>
              </span>
            </div>
          </div>
        </div>

        {/* pacing visual */}
        <div className="mt-4 rounded-xl bg-white p-4 ring-1 ring-slate-200">
          <div className="mb-3 flex items-center gap-2">
            <Pin n={2} label="Pacing" />
            <p className="text-[12px] font-semibold text-slate-900">Pacing, by how close someone is to the work</p>
          </div>
          <div className="space-y-2.5">
            {[
              ["Coder, claims desk", 100, "up to 12 a day · realtime"],
              ["Pricing manager", 50, "up to 6 a day · hourly digest"],
              ["Chief financial officer", 17, "2 a week · Monday roll-up"],
            ].map(([label, pctv, note]) => (
              <div key={String(label)}>
                <div className="flex items-baseline justify-between gap-3 text-[11.5px]">
                  <span className="text-slate-700">{label}</span>
                  <span className="text-slate-400">{note}</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                  <div className="h-1.5 rounded-full bg-teal-600" style={{ width: `${pctv}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] leading-relaxed text-slate-500">
            Over the ceiling, lower-priority questions wait for the next digest rather than firing.
            Taps are unlimited on every plan — the limit exists to protect the person, not the invoice.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------- dimension list */}
      <div>
        <div className="flex flex-wrap gap-1.5">
          {DIMENSIONS.map((d) => (
            <button
              key={d.key}
              onClick={() => setActive(d.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
                d.key === active
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
              }`}
            >
              <span
                className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold ${
                  d.key === active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                }`}
              >
                {d.pin}
              </span>
              {d.name}
            </button>
          ))}
        </div>

        <div key={dim.key} className="mt-4 animate-[fadeIn_.25s_ease-out] rounded-xl bg-white p-4 ring-1 ring-slate-200 sm:p-5">
          <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-slate-900">{dim.name}</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{dim.summary}</p>

          <div className="mt-4 space-y-2">
            {dim.values.map((v) => (
              <div key={v.label} className="flex gap-3 border-t border-slate-100 pt-2.5">
                <span
                  className={`mt-px inline-flex h-fit shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                    TONE[v.tone ?? "slate"]
                  }`}
                >
                  {v.label}
                </span>
                <p className="text-[12.5px] leading-relaxed text-slate-600">{v.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border-l-2 border-teal-500 bg-teal-50/50 px-3.5 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
              Why it exists
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-teal-950/85">{dim.why}</p>
          </div>
        </div>

        <p className="mt-3 px-1 text-[11.5px] leading-relaxed text-slate-500">
          All seven dimensions are declared in a versioned config file, one per tap type — so a new
          kind of tap is configuration, not a release. Your team can author them, review them in a
          pull request, and kill one that turns out to be noisy without waiting on us.
        </p>
      </div>
    </div>
  );
}
