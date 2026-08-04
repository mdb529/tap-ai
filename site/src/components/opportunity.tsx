"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The opportunity, stated before anything else.
 *
 * THE ARGUMENT, in three moves:
 *   1. Contributing to how a business works used to require being technical.
 *   2. AI removed that barrier — anyone can now produce a change.
 *   3. But a contribution is not the same as an actionable contribution. Without
 *      routing, review and a record, it is a suggestion nobody can safely apply.
 *      That last mile is what Tap AI is.
 *
 * This has to land before the walkthrough, because the walkthrough answers "how"
 * and this answers "why now" — and "why now" is the harder sell.
 *
 * Interaction: the three panels advance on scroll, and can be driven manually.
 * The graphic is a doorway that opens, which is the whole metaphor in one shape:
 * the barrier is gone, but an open door with nowhere to put things is not much
 * better than a closed one.
 */

interface Stage {
  key: string;
  era: string;
  headline: string;
  body: string;
  /** The single number or word that carries the panel. */
  stat: string;
  statLabel: string;
  tone: "slate" | "amber" | "teal";
}

const STAGES: Stage[] = [
  {
    key: "before",
    era: "Until recently",
    headline: "Contributing meant being technical",
    body:
      "Your controller knew what counted as revenue. Contributing that meant a pull request, a ticket, or a meeting — so it stayed in their head, and the systems were built from whatever was written down.",
    stat: "A few people",
    statLabel: "could change how the business works",
    tone: "slate",
  },
  {
    key: "now",
    era: "Now, with AI",
    headline: "The barrier is gone",
    body:
      "Anyone can describe a change in plain language and have it written correctly. The scarce input stopped being the ability to build — it is now the judgment about what is correct.",
    stat: "Everyone",
    statLabel: "can describe a change",
    tone: "amber",
  },
  {
    key: "tapai",
    era: "What is still missing",
    headline: "A contribution has to be actionable",
    body:
      "Being able to produce a change is not the same as being able to land one. Without knowing who should decide, who reviews it, and what was decided last time, it is a suggestion nobody can safely apply. That last mile is Tap AI.",
    stat: "Actionable",
    statLabel: "routed, reviewed, recorded",
    tone: "teal",
  },
];

const TONE = {
  slate: { text: "text-slate-400", ring: "ring-white/10", soft: "bg-white/[0.04]", dot: "bg-slate-500" },
  amber: { text: "text-amber-300", ring: "ring-amber-400/30", soft: "bg-amber-400/10", dot: "bg-amber-400" },
  teal: { text: "text-teal-300", ring: "ring-teal-400/35", soft: "bg-teal-400/10", dot: "bg-teal-400" },
} as const;

export function Opportunity() {
  const [i, setI] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = refs.current.findIndex((r) => r === e.target);
            if (idx >= 0) setI(idx);
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px" }
    );
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, []);

  const s = STAGES[i];
  const tone = TONE[s.tone];

  return (
    <div>
      {/* ------------------------------------------------- the promise, big */}
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-[1.75rem] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[2.6rem] lg:text-[3rem]">
          Let your whole company contribute.
          <br />
          <span className="text-teal-300">Effectively, safely, and AI-natively.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-slate-300 sm:text-[16.5px]">
          AI removed the barrier to contributing. Tap AI is what makes those contributions{" "}
          <strong className="font-semibold text-white">actionable</strong>.
        </p>
      </div>

      {/* --------------------------------------------------- the door graphic
          Sticky on desktop so it stays beside the text while it changes; inline
          on mobile where a sticky graphic would eat the viewport. */}
      <div className="mt-10 grid gap-8 lg:mt-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <Doorway stage={i} tone={s.tone} />

          {/* the changing caption under the graphic */}
          <div key={s.key} className="mt-5 animate-[fadeIn_.45s_ease-out] text-center lg:text-left">
            <p className={`text-[11px] font-bold uppercase tracking-wider ${tone.text}`}>{s.era}</p>
            <p className="mt-2 text-[2rem] font-semibold leading-none tracking-[-0.03em] text-white sm:text-[2.5rem]">
              {s.stat}
            </p>
            <p className="mt-1.5 text-[12.5px] text-slate-400">{s.statLabel}</p>
          </div>

          {/* manual control, for anyone who would rather click than scroll */}
          <div className="mt-5 flex justify-center gap-1.5 lg:justify-start">
            {STAGES.map((st, k) => (
              <button
                key={st.key}
                onClick={() => refs.current[k]?.scrollIntoView({ behavior: "smooth", block: "center" })}
                aria-label={st.headline}
                aria-current={k === i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  k === i ? "w-8 bg-teal-400" : "w-1.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>

        {/* the three panels */}
        <div className="space-y-4 lg:space-y-8">
          {STAGES.map((st, k) => {
            const on = k === i;
            const t = TONE[st.tone];
            return (
              <div
                key={st.key}
                ref={(el) => {
                  refs.current[k] = el;
                }}
                className={`rounded-2xl px-5 py-6 ring-1 ring-inset transition-all duration-500 sm:px-7 sm:py-8 ${
                  on ? `${t.soft} ${t.ring}` : "bg-white/[0.02] ring-white/[0.07]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
                      on ? t.dot : "bg-white/20"
                    }`}
                  />
                  <p
                    className={`text-[11px] font-bold uppercase tracking-wider transition-colors duration-500 ${
                      on ? t.text : "text-slate-600"
                    }`}
                  >
                    {st.era}
                  </p>
                </div>
                <h3
                  className={`mt-2.5 text-[1.4rem] font-semibold leading-[1.15] tracking-[-0.02em] transition-colors duration-500 sm:text-[1.75rem] ${
                    on ? "text-white" : "text-slate-500"
                  }`}
                >
                  {st.headline}
                </h3>
                <p
                  className={`mt-3 text-[14px] leading-relaxed transition-colors duration-500 sm:text-[15px] ${
                    on ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {st.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ doorway */

/**
 * A doorway that opens across the three stages, with people on the far side.
 *
 * Stage 0: shut, one figure through it.
 * Stage 1: open, many figures — but the far side is empty, which is the point.
 * Stage 2: open, and the far side has somewhere for contributions to land.
 *
 * Hand-drawn SVG rather than an illustration file: it animates by interpolating
 * attributes, it costs nothing to ship, and it recolours with the theme.
 */
function Doorway({ stage, tone }: { stage: number; tone: "slate" | "amber" | "teal" }) {
  const open = stage >= 1;
  const landed = stage >= 2;
  const stroke = tone === "teal" ? "#2dd4bf" : tone === "amber" ? "#fbbf24" : "#64748b";

  const people = [
    { x: 26, delay: 0 },
    { x: 44, delay: 90 },
    { x: 62, delay: 180 },
    { x: 80, delay: 270 },
  ];

  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-[24rem]">
      <svg viewBox="0 0 220 165" className="h-full w-full" fill="none">
        {/* floor */}
        <line x1="8" y1="140" x2="212" y2="140" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />

        {/* ---- the wall with a doorway ---- */}
        <rect x="100" y="30" width="20" height="110" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />

        {/* the door leaf: swings open */}
        <g
          style={{
            transformOrigin: "120px 140px",
            transform: open ? "rotateY(0deg) skewY(-18deg) translate(14px,-16px)" : "none",
            transition: "transform 900ms cubic-bezier(.22,.61,.36,1)",
          }}
        >
          <rect
            x="102"
            y="52"
            width="16"
            height="88"
            rx="1.5"
            fill={open ? "transparent" : "#1e293b"}
            stroke={open ? "#475569" : "#64748b"}
            strokeWidth="1.5"
            style={{ transition: "fill 700ms, stroke 700ms" }}
          />
          {!open && <circle cx="106" cy="98" r="1.6" fill="#94a3b8" />}
        </g>

        {/* ---- left side: the people ---- */}
        {people.map((p, k) => {
          // Stage 0 lets one figure through; later stages let everyone through.
          const visible = stage === 0 ? k === 1 : true;
          const through = open;
          return (
            <g
              key={p.x}
              style={{
                opacity: visible ? 1 : 0.18,
                transform: through ? `translateX(${74 - p.x + k * 15}px)` : "none",
                transition: `opacity 600ms ${p.delay}ms, transform 900ms cubic-bezier(.22,.61,.36,1) ${p.delay}ms`,
              }}
            >
              <circle cx={p.x} cy={112} r="5.5" fill={visible ? stroke : "#334155"} style={{ transition: "fill 600ms" }} />
              <path
                d={`M${p.x - 6} 140 v-14 a6 6 0 0 1 12 0 v14`}
                fill={visible ? stroke : "#334155"}
                opacity="0.85"
                style={{ transition: "fill 600ms" }}
              />
            </g>
          );
        })}

        {/* ---- right side: where contributions land ---- */}
        <g style={{ opacity: landed ? 1 : 0, transition: "opacity 700ms 350ms" }}>
          {[0, 1, 2].map((r) => (
            <g key={r}>
              <rect
                x="150"
                y={62 + r * 26}
                width="54"
                height="17"
                rx="3.5"
                fill="rgba(45,212,191,.12)"
                stroke="#2dd4bf"
                strokeWidth="1.2"
              />
              <path
                d={`M156 ${70 + r * 26} l3.2 3.2 L166 ${66.5 + r * 26}`}
                stroke="#2dd4bf"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="172"
                y1={70 + r * 26}
                x2="196"
                y2={70 + r * 26}
                stroke="#5eead4"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity=".5"
              />
            </g>
          ))}
        </g>

        {/* stage 1 only: through the door, but nowhere to put anything */}
        <g style={{ opacity: open && !landed ? 1 : 0, transition: "opacity 500ms" }}>
          <rect
            x="150"
            y="62"
            width="54"
            height="69"
            rx="4"
            fill="none"
            stroke="#475569"
            strokeWidth="1.3"
            strokeDasharray="4 4"
          />
          <text x="177" y="101" textAnchor="middle" className="fill-slate-500 text-[8px]">
            nowhere
          </text>
        </g>
      </svg>

      {/* the annotation — arrives from the side so it reads as pointing at the
          graphic rather than being part of it */}
      <div
        key={stage}
        className="absolute -bottom-1 left-0 right-0 animate-[slideInLeft_.5s_ease-out]"
      >
        <p className="text-center text-[11.5px] text-slate-500">
          {stage === 0
            ? "One door, and only engineers had the key."
            : stage === 1
              ? "The door is open — but contributions have nowhere to land."
              : "Routed to an owner, reviewed, and recorded."}
        </p>
      </div>
    </div>
  );
}
