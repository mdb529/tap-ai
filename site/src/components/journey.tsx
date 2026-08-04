"use client";

import { useEffect, useRef, useState } from "react";
import { TIERS, VERTICALS, type Scenario, type TapClass } from "@/lib/scenarios";
import { href } from "@/lib/href";

/**
 * The journey. This is the homepage's centre of gravity, and it makes exactly
 * one argument in three beats:
 *
 *   1. TRIGGER   here is a relatable thing that happens at your company
 *   2. TAP       all you do is answer it
 *   3. OUTCOME   here is what changed, and what you just contributed
 *
 * Design notes worth keeping:
 *
 * - The visitor picks WHO THEY ARE (Frontline / Director / C-Suite), not what
 *   kind of question it is. People can answer the first instantly. Seniority maps
 *   onto tap class underneath, so one selector drives everything.
 *
 * - It advances on SCROLL rather than requiring clicks, because the three beats
 *   are a narrative and scrolling is how people read narratives. The tap is
 *   still interactive — answering it is the moment the story turns.
 *
 * - Mobile first, and literally: every element is sized to fit inside 360px with
 *   no horizontal scroll. The desktop layout is the same thing with more air.
 */

const BEATS = [
  { n: 1, key: "trigger", label: "The trigger", sub: "Something happens" },
  { n: 2, key: "tap", label: "The tap", sub: "You answer it" },
  { n: 3, key: "outcome", label: "The outcome", sub: "You just contributed" },
] as const;

const TONE: Record<TapClass, { text: string; dot: string; ring: string; soft: string }> = {
  tactical: {
    text: "text-sky-300",
    dot: "bg-sky-400",
    ring: "ring-sky-400/40",
    soft: "bg-sky-400/10",
  },
  operational: {
    text: "text-emerald-300",
    dot: "bg-emerald-400",
    ring: "ring-emerald-400/40",
    soft: "bg-emerald-400/10",
  },
  strategic: {
    text: "text-violet-300",
    dot: "bg-violet-400",
    ring: "ring-violet-400/40",
    soft: "bg-violet-400/10",
  },
};

export function Journey() {
  const [tier, setTier] = useState<TapClass>("tactical");
  const [vi, setVi] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [beat, setBeat] = useState(0);

  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const tapRef = useRef<HTMLDivElement | null>(null);
  const outcomeRef = useRef<HTMLDivElement | null>(null);

  const vertical = VERTICALS[vi];
  const s = vertical.scenarios[tier];
  const t = TONE[tier];
  const tierMeta = TIERS.find((x) => x.key === tier)!;

  const reset = () => setAnswered(null);

  // Advance the beat indicator as blocks cross the middle of the viewport. An
  // observer rather than a scroll handler so it costs nothing while idle.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = refs.current.findIndex((r) => r === e.target);
            if (i >= 0) setBeat(i);
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, [tier, vi]);

  const answer = (i: number) => {
    setAnswered(i);
    // Carry them to the payoff — the outcome is the point, and on a phone it is
    // below the fold.
    requestAnimationFrame(() =>
      outcomeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    );
  };

  return (
    <div className="w-full">
      {/* ============================================ who are you (sticky) */}
      <div className="sticky top-[52px] z-20 -mx-5 mb-6 bg-slate-950/92 px-5 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {TIERS.map((x) => {
            const on = x.key === tier;
            const xt = TONE[x.key];
            return (
              <button
                key={x.key}
                onClick={() => {
                  setTier(x.key);
                  reset();
                }}
                aria-pressed={on}
                className={`group rounded-xl px-2 py-3 text-center transition-all duration-300 ring-1 ring-inset sm:py-3.5 ${
                  on
                    ? `${xt.soft} ${xt.ring} scale-[1.02]`
                    : "ring-white/10 hover:bg-white/[0.07] hover:ring-white/20"
                }`}
              >
                <span
                  className={`block text-[13.5px] font-semibold transition-colors sm:text-[15px] ${
                    on ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                >
                  {x.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* industry, secondary and scrollable */}
        <div className="-mx-5 mt-2.5 flex gap-1.5 overflow-x-auto px-5 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
          {VERTICALS.map((v, i) => (
            <button
              key={v.id}
              onClick={() => {
                setVi(i);
                reset();
              }}
              className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] transition-colors ${
                i === vi
                  ? "bg-white font-medium text-slate-900"
                  : "text-slate-400 ring-1 ring-inset ring-white/10 hover:text-white"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* beat progress */}
        <div className="mt-3 flex items-center gap-1.5">
          {BEATS.map((b, i) => (
            <div key={b.key} className="flex flex-1 items-center gap-1.5">
              <span
                className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                  i <= beat ? "bg-teal-400" : "bg-white/12"
                }`}
              />
            </div>
          ))}
          <span className="ml-1 shrink-0 text-[10.5px] font-medium text-slate-400">
            {BEATS[beat].label}
          </span>
        </div>
      </div>

      <p className="mb-5 px-0.5 text-[12.5px] leading-relaxed text-slate-400">
        <span className={`font-semibold ${t.text}`}>{tierMeta.label}.</span> {tierMeta.asks}.
      </p>

      {/* ==================================================== 1. the trigger */}
      <Block
        ref={(el) => {
          refs.current[0] = el;
        }}
        n={1}
        active={beat === 0}
        label="The trigger"
        sub="Something happens that needs a person"
      >
        <div className="rounded-xl bg-white p-5 shadow-2xl shadow-black/30 sm:p-6">
          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-amber-800">
            {s.detected.eventType}
          </span>
          <p className="mt-3.5 text-[19px] font-semibold leading-[1.25] tracking-[-0.02em] text-slate-900 sm:text-[24px]">
            {s.detected.signal}
          </p>
          <p className="mt-3 border-t border-slate-100 pt-3 text-[12.5px] leading-relaxed text-slate-500">
            Nobody filed a ticket. Nobody opened a dashboard. There is no alert for this, because
            nothing is broken — it just needs someone who knows the answer.
          </p>
        </div>
      </Block>

      {/* ======================================================== 2. the tap */}
      <Block
        ref={(el) => {
          refs.current[1] = el;
        }}
        n={2}
        active={beat === 1}
        label="The tap"
        sub={`It reaches you in ${s.channel}. Answering is the whole job.`}
      >
        <div
          ref={tapRef}
          className={`rounded-2xl bg-white shadow-2xl shadow-black/40 transition-transform duration-500 ${
            beat === 1 && answered === null ? "animate-[tapPulse_1.6s_ease-out_.3s_1] sm:scale-[1.015]" : ""
          }`}
        >
          {/* channel chrome */}
          <div className="flex items-center gap-2 rounded-t-xl border-b border-slate-100 bg-slate-50 px-3.5 py-2.5">
            <span className="flex h-4.5 w-4.5 items-center justify-center rounded bg-teal-700 text-[9px] font-bold text-white" aria-hidden>
              T
            </span>
            <span className="text-[12px] font-semibold text-slate-800">Tap AI</span>
            <span className="ml-auto truncate text-[11px] text-slate-500">
              {s.channel} · {s.persona.name.split(" ")[0]}
            </span>
          </div>

          <div className="px-4 py-4 sm:px-5">
            <p className="text-[19px] font-medium leading-[1.25] tracking-[-0.02em] text-slate-900 sm:text-[23px]">
              {s.question}
            </p>

            <ul className="mt-3 space-y-1.5">
              {s.context.map((c) => (
                <li key={c} className="flex gap-2 text-[13px] leading-relaxed text-slate-600">
                  <span className="mt-[7px] inline-block h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                  {c}
                </li>
              ))}
            </ul>

            {/* Full-width stacked buttons: thumb-reachable, and no option ever
                truncates however long the label is. */}
            <div className="mt-4 flex flex-col gap-2">
              {s.options.map((o, i) => {
                const chosen = answered === i;
                const dim = answered !== null && !chosen;
                return (
                  <button
                    key={o}
                    onClick={() => answer(i)}
                    className={`w-full rounded-xl px-4 py-3.5 text-left text-[15px] font-medium transition-all duration-200 ${
                      chosen
                        ? "bg-teal-600 text-white ring-2 ring-teal-600"
                        : dim
                          ? "bg-slate-50 text-slate-300 ring-1 ring-inset ring-slate-200"
                          : "bg-white text-slate-800 ring-1 ring-inset ring-slate-300 hover:-translate-y-px hover:bg-slate-50 hover:shadow-md active:translate-y-0 active:scale-[.99]"
                    }`}
                  >
                    {chosen && <span className="mr-1.5">✓</span>}
                    {o}
                  </button>
                );
              })}
            </div>

            <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <span className="text-[11px] text-slate-400">Not you? Reassign in one tap.</span>
              <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                ~{s.medianSeconds}s
              </span>
            </div>
          </div>
        </div>

        {answered === null && (
          <p className="mt-3 text-center text-[12px] text-slate-400">
            ↑ Pick an answer to see what happens
          </p>
        )}
      </Block>

      {/* ==================================================== 3. the outcome */}
      <Block
        ref={(el) => {
          refs.current[2] = el;
        }}
        n={3}
        active={beat === 2}
        label="The outcome"
        sub="What changed, and what you just contributed"
      >
        <div ref={outcomeRef}>
          {answered === null ? (
            <div className="rounded-xl border border-dashed border-white/15 px-5 py-10 text-center">
              <p className="text-[13px] text-slate-500">
                Answer the question above and the outcome appears here.
              </p>
            </div>
          ) : (
            <div className="animate-[riseIn_.45s_ease-out] space-y-3">
              {/* the payoff, stated first */}
              <div className={`rounded-xl px-5 py-5 ring-1 ring-inset ${t.soft} ${t.ring}`}>
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/60">
                  You just did something you could not do before
                </p>
                <p className="mt-2.5 text-[17px] font-medium leading-[1.35] text-white sm:text-[20px]">
                  {s.contribution}
                </p>
              </div>

              {/* what the system did with it */}
              <div className="rounded-xl bg-white p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-white">
                    <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3">
                      <path
                        d="M5 10.5l3.2 3.2L15 7"
                        stroke="currentColor"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <p className="text-[13px] font-semibold text-slate-900">
                    {s.tapClass === "tactical" ? "Applied" : "Reviewed and applied"}
                  </p>
                </div>
                <p className="mt-2.5 text-[13px] leading-relaxed text-slate-600">
                  {s.shipped.effect}
                </p>

                <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                  {s.shipped.checks.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-[12.5px] text-slate-600">
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        className="mt-[3px] h-3 w-3 shrink-0 text-teal-600"
                      >
                        <path
                          d="M5 10.5l3.2 3.2L15 7"
                          stroke="currentColor"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {c}
                    </li>
                  ))}
                </ul>

                <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-slate-200">
                  {s.shipped.facts.slice(0, 3).map((f) => (
                    <div key={f.label} className="bg-slate-50 px-2 py-2">
                      <dd className="text-[13px] font-semibold leading-tight text-slate-900">
                        {f.value}
                      </dd>
                      <dt className="mt-0.5 text-[9.5px] uppercase leading-tight tracking-wide text-slate-500">
                        {f.label}
                      </dt>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    reset();
                    refs.current[0]?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="rounded-lg bg-white/10 px-3 py-2 text-[12.5px] font-medium text-white ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/20"
                >
                  Try another scenario
                </button>
                <a
                  href={href("/how-it-works/")}
                  className="rounded-lg px-3 py-2 text-[12.5px] font-medium text-teal-300 transition-colors hover:text-teal-200"
                >
                  See what happens under the hood →
                </a>
              </div>
            </div>
          )}
        </div>
      </Block>
    </div>
  );
}

/* ------------------------------------------------------------------- block */

const Block = ({
  ref,
  n,
  label,
  sub,
  active = false,
  children,
}: {
  ref: (el: HTMLDivElement | null) => void;
  n: number;
  label: string;
  sub: string;
  /** Drives the numeral, the heading colour and the connector draw. */
  active?: boolean;
  children: React.ReactNode;
}) => (
  <div ref={ref} className="relative mb-10 scroll-mt-32 pl-0 last:mb-0 sm:pl-11">
    {/* connector: only on wide enough screens to have a gutter for it */}
    <span
      aria-hidden
      className={`absolute left-[15px] top-9 hidden w-px origin-top bg-gradient-to-b from-white/25 to-transparent sm:block ${
        active ? "animate-[drawDown_.8s_ease-out]" : ""
      }`}
      style={{ height: "calc(100% - 1rem)" }}
    />
    <div className="mb-3.5 flex items-start gap-2.5 sm:mb-4 sm:block">
      <span
        className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition-all duration-500 sm:absolute sm:-left-11 sm:top-0 ${
          active ? "scale-110 bg-white text-slate-900" : "bg-white/15 text-slate-400"
        }`}
      >
        {n}
      </span>
      <div className="min-w-0">
        <p
          className={`text-[15px] font-semibold leading-tight transition-colors duration-500 sm:text-[17px] ${
            active ? "text-white" : "text-slate-400"
          }`}
        >
          {label}
        </p>
        <p className="mt-0.5 text-[12.5px] leading-snug text-slate-400">{sub}</p>
      </div>
    </div>
    {children}
  </div>
);
