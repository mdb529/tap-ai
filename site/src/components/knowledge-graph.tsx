"use client";

import { useEffect, useRef, useState } from "react";

/**
 * THE COMPOUNDING LOOP.
 *
 * The argument this section has to land, in order:
 *
 *   1. Your org already has a graph — models, metrics, columns, dashboards. What
 *      it lacks is any record of what those things were DECIDED to mean.
 *   2. Each tap adds one piece of that meaning. Not a migration, not a
 *      workshop — one answer at a time, growing organically.
 *   3. Once enough of it exists, it becomes the context layer AI reads from. The
 *      agent stops inferring intent and starts looking it up.
 *   4. Everything downstream inherits that: decisions, BI, agents, and the
 *      operational systems the answers get written back out to.
 *
 * WHY A STAGED ANIMATION RATHER THAN SCROLL-SCRUBBING. The other scroll
 * narratives on this page each advance one discrete beat per screen. This one is
 * a single picture that CHANGES, so tying it to scroll offset would mean the
 * visitor either scrolls too fast to see it or gets trapped in a tall section
 * scrubbing an animation. It autoplays once on entry, exposes stage buttons, and
 * offers a replay. Reduced-motion users get the final state immediately.
 *
 * The nodes and edges are hand-placed. A force simulation looked more
 * impressive and read as noise — you could not tell that specific things were
 * being learned, which is the entire point.
 */

type Stage = 0 | 1 | 2 | 3;

const STAGES: { label: string; title: string; body: string }[] = [
  {
    label: "Today",
    title: "The graph exists. The meaning does not.",
    body: "Your models, metrics and columns are already connected. What nothing records is what they were decided to mean — so anything reading the graph has to infer intent.",
  },
  {
    label: "Each tap",
    title: "One answer at a time.",
    body: "A tap settles one question and attaches it to one node. No migration, no workshop, no ontology project. Trusted knowledge accumulates the way it is actually held — in pieces, from the person who knows that piece.",
  },
  {
    label: "The context layer",
    title: "Enough pieces become a source of truth.",
    body: "Individually, an answer is a footnote. Collectively they are the layer that says what your business means — versioned, attributed, and dated.",
  },
  {
    label: "The loop",
    title: "AI reads it, then helps extend it.",
    body: "Agents stop guessing at intent and look it up. Better context produces better questions, which produce better context. That is the loop — and everything downstream inherits it.",
  },
];

/** Hand-placed so each learned fact is legible. viewBox is 0 0 520 300. */
const NODES: {
  id: string;
  x: number;
  y: number;
  r: number;
  /** Stage at which this node becomes "known". 1 = learned by a tap. */
  learnedAt: 0 | 1 | 2;
  /** Shown once known. Kept to 2-3 words so it fits on a phone. */
  fact?: string;
}[] = [
  { id: "a", x: 74, y: 62, r: 7, learnedAt: 0 },
  { id: "b", x: 148, y: 40, r: 6, learnedAt: 1, fact: "active customer" },
  { id: "c", x: 132, y: 122, r: 8, learnedAt: 1, fact: "net revenue" },
  { id: "d", x: 62, y: 176, r: 6, learnedAt: 0 },
  { id: "e", x: 212, y: 92, r: 9, learnedAt: 1, fact: "churn rule" },
  { id: "f", x: 196, y: 190, r: 7, learnedAt: 1, fact: "PHI flag" },
  { id: "g", x: 282, y: 46, r: 6, learnedAt: 2, fact: "ARR basis" },
  { id: "h", x: 296, y: 148, r: 8, learnedAt: 1, fact: "SKU category" },
  { id: "i", x: 262, y: 240, r: 6, learnedAt: 2, fact: "owner" },
  { id: "j", x: 366, y: 96, r: 7, learnedAt: 2, fact: "promo stacking" },
  { id: "k", x: 356, y: 208, r: 6, learnedAt: 2, fact: "freshness SLA" },
  { id: "l", x: 118, y: 248, r: 6, learnedAt: 2, fact: "exclusions" },
  { id: "m", x: 430, y: 148, r: 7, learnedAt: 2, fact: "canonical" },
  { id: "n", x: 34, y: 116, r: 5, learnedAt: 0 },
];

const EDGES: [string, string][] = [
  ["a", "b"], ["a", "c"], ["a", "n"], ["n", "d"], ["b", "e"], ["c", "e"],
  ["c", "d"], ["d", "l"], ["c", "f"], ["e", "g"], ["e", "h"], ["f", "h"],
  ["f", "i"], ["h", "j"], ["h", "k"], ["g", "j"], ["j", "m"], ["k", "m"],
  ["i", "k"], ["l", "f"], ["b", "g"],
];

const CONSUMERS: { label: string; detail: string; glyph: string }[] = [
  {
    label: "Decision-making",
    detail: "People arguing about what the number means, instead of what to do about it.",
    glyph: "M12 3v6m0 0l4-2m-4 2L8 7M5 21h14a2 2 0 002-2v-6H3v6a2 2 0 002 2z",
  },
  {
    label: "BI and dashboards",
    detail: "One definition behind the chart, with the reasoning attached.",
    glyph: "M4 19h16M7 16V9M12 16V5M17 16v-5",
  },
  {
    label: "AI agents",
    detail: "Intent looked up rather than inferred. Fewer confident wrong answers.",
    glyph: "M9 3h6v3h3v6a6 6 0 01-12 0V6h3zM9 21h6M12 18v3",
  },
  {
    label: "Systems of record",
    detail: "Written back out by reverse ETL, so the CRM and the warehouse agree.",
    glyph: "M4 7a8 3 0 1016 0 8 3 0 10-16 0zM4 7v10a8 3 0 0016 0V7",
  },
];

const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n]));

export function KnowledgeGraph() {
  const [stage, setStage] = useState<Stage>(0);
  const [played, setPlayed] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const play = () => {
    clear();
    setStage(0);
    // Slow enough to read the caption before the picture changes under it.
    ([1, 2, 3] as Stage[]).forEach((st, i) => {
      timers.current.push(setTimeout(() => setStage(st), 2100 * (i + 1)));
    });
  };

  // Autoplay once, on first entry.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStage(3);
      setPlayed(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !played) {
          setPlayed(true);
          play();
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [played]);

  useEffect(() => clear, []);

  const jump = (s: Stage) => {
    clear();
    setStage(s);
  };

  const known = (learnedAt: number) => learnedAt <= Math.min(stage, 2);
  const dense = stage >= 2;
  const looping = stage >= 3;
  const copy = STAGES[stage];

  return (
    <div ref={sectionRef}>
      {/* ------------------------------------------------------- stage picker */}
      <div className="mx-auto mb-5 flex max-w-2xl flex-wrap items-center justify-center gap-1.5">
        {STAGES.map((s, i) => (
          <button
            key={s.label}
            onClick={() => jump(i as Stage)}
            aria-pressed={i === stage}
            className={`rounded-full px-3 py-1.5 text-[11.5px] font-medium transition-all duration-300 sm:text-[12.5px] ${
              i === stage
                ? "bg-teal-400 text-slate-900"
                : i < stage
                  ? "bg-teal-400/15 text-teal-200 ring-1 ring-inset ring-teal-400/30"
                  : "text-slate-400 ring-1 ring-inset ring-white/12 hover:text-white"
            }`}
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={play}
          className="ml-1 rounded-full px-2.5 py-1.5 text-[11.5px] text-slate-400 ring-1 ring-inset ring-white/12 transition-colors hover:text-white"
        >
          ↻ Replay
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-center lg:gap-10">
        {/* ------------------------------------------------------------ graph */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/60 ring-1 ring-inset ring-white/10">
          {/* Glow that intensifies as the graph becomes trusted. */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-opacity duration-1000"
            style={{
              opacity: dense ? 0.5 : 0.12,
              background: "radial-gradient(closest-side, rgba(45,212,191,.55), transparent)",
            }}
          />
          <svg
            viewBox="0 0 520 300"
            className="relative block w-full"
            role="img"
            aria-label={`Knowledge graph, stage ${stage + 1} of 4: ${copy.title}`}
          >
            {/* edges */}
            {EDGES.map(([from, to]) => {
              const a = NODE_BY_ID[from];
              const b = NODE_BY_ID[to];
              const lit = known(a.learnedAt) && known(b.learnedAt);
              return (
                <line
                  key={`${from}-${to}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={lit ? "rgb(45,212,191)" : "rgb(148,163,184)"}
                  strokeOpacity={lit ? (dense ? 0.55 : 0.4) : 0.14}
                  strokeWidth={lit ? 1.4 : 1}
                  className="transition-all duration-[900ms]"
                />
              );
            })}

            {/* the loop: agent reads from the graph, and feeds it back */}
            <g
              className="transition-opacity duration-700"
              style={{ opacity: looping ? 1 : 0 }}
            >
              <path
                d="M452 118 C492 96 500 60 464 44"
                fill="none"
                stroke="rgb(168,139,250)"
                strokeOpacity={0.75}
                strokeWidth={1.6}
                strokeDasharray="4 4"
              >
                {looping && (
                  <animate
                    attributeName="stroke-dashoffset"
                    from="16"
                    to="0"
                    dur="1.1s"
                    repeatCount="indefinite"
                  />
                )}
              </path>
              <text
                x={470}
                y={34}
                textAnchor="middle"
                className="fill-violet-300 text-[9px] font-semibold"
              >
                agents
              </text>
            </g>

            {/* nodes */}
            {NODES.map((n, i) => {
              const on = known(n.learnedAt);
              return (
                <g
                  key={n.id}
                  className="transition-opacity duration-700"
                  style={{ transitionDelay: on ? `${i * 45}ms` : "0ms" }}
                >
                  {on && dense && (
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={n.r + 5}
                      fill="rgb(45,212,191)"
                      fillOpacity={0.14}
                    />
                  )}
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={n.r}
                    fill={on ? "rgb(45,212,191)" : "rgb(51,65,85)"}
                    stroke={on ? "rgb(153,246,228)" : "rgb(100,116,139)"}
                    strokeWidth={on ? 1.4 : 1}
                    strokeOpacity={on ? 0.9 : 0.35}
                    className="transition-all duration-700"
                  />
                  {n.fact && (
                    <text
                      x={n.x}
                      y={n.y - n.r - 6}
                      textAnchor="middle"
                      className="fill-teal-100 text-[9.5px] font-medium transition-opacity duration-700"
                      style={{
                        opacity: on ? 1 : 0,
                        transitionDelay: on ? `${i * 45 + 150}ms` : "0ms",
                      }}
                    >
                      {n.fact}
                    </text>
                  )}
                </g>
              );
            })}

            {/* the tap that is landing, at stage 1 */}
            <g
              className="transition-opacity duration-500"
              style={{ opacity: stage === 1 ? 1 : 0 }}
            >
              <circle cx={212} cy={92} r={20} fill="none" stroke="rgb(45,212,191)" strokeWidth={1.5}>
                {stage === 1 && (
                  <>
                    <animate attributeName="r" from="10" to="30" dur="1.5s" repeatCount="indefinite" />
                    <animate
                      attributeName="stroke-opacity"
                      from="0.9"
                      to="0"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </>
                )}
              </circle>
            </g>

            {/* trusted-context boundary, once it is worth calling a layer */}
            <rect
              x={16}
              y={16}
              width={424}
              height={268}
              rx={18}
              fill="none"
              stroke="rgb(45,212,191)"
              strokeOpacity={dense ? 0.28 : 0}
              strokeWidth={1}
              strokeDasharray="3 5"
              className="transition-all duration-1000"
            />
            <text
              x={28}
              y={294}
              className="fill-teal-300/70 text-[9px] font-bold uppercase tracking-wider transition-opacity duration-1000"
              style={{ opacity: dense ? 1 : 0 }}
            >
              trusted context
            </text>
          </svg>
        </div>

        {/* ------------------------------------------------------------ copy */}
        <div>
          <div key={stage} className="animate-[fadeIn_.5s_ease-out]">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-teal-300">
              {copy.label}
            </p>
            <h3 className="mt-2 text-[1.15rem] font-semibold leading-[1.2] tracking-[-0.02em] text-white sm:text-[1.45rem]">
              {copy.title}
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed text-slate-300 sm:text-[15px]">
              {copy.body}
            </p>
          </div>

          {/* Downstream consumers arrive with the loop. */}
          <div
            className="mt-6 grid gap-2 transition-opacity duration-700 sm:grid-cols-2"
            style={{ opacity: looping ? 1 : 0.25 }}
          >
            {CONSUMERS.map((c, i) => (
              <div
                key={c.label}
                className="rounded-xl bg-white/[0.04] px-3.5 py-3 ring-1 ring-inset ring-white/10 transition-all duration-500"
                style={{ transitionDelay: looping ? `${i * 110}ms` : "0ms" }}
              >
                <div className="flex items-center gap-2">
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5 shrink-0 stroke-teal-300"
                    fill="none"
                    strokeWidth={1.7}
                    strokeLinecap="round"
                  >
                    <path d={c.glyph} />
                  </svg>
                  <p className="text-[12.5px] font-semibold text-white">{c.label}</p>
                </div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-slate-400">{c.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
