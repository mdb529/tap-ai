"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CLASS_COPY,
  EVENT_COPY,
  TAP_CLASSES,
  TARGET_LABEL,
  VERTICALS,
  type Scenario,
  type TapClass,
} from "@/lib/scenarios";

/**
 * The interactive walkthrough. Three orthogonal choices:
 *
 *   industry  ×  tap class  →  one scenario  →  six stages
 *
 * Industry and class are deliberately independent axes rather than a flat list
 * of examples. That is the product claim made structural: the same machinery
 * handles a coder's routine call and a CFO's company decision, and you should be
 * able to hold one axis still and vary the other to see it.
 *
 * The flow rail is the other half of the argument. A tap on its own reads as a
 * notification, and notifications are cheap. The rail shows the tap is the
 * visible middle of a longer chain — detection before, a reviewed deploy after.
 *
 * Keyboard: ←/→ stage, ↑/↓ class, 1–5 answer at the tap stage, Esc reset.
 */

const STAGES = [
  { key: "detect", label: "Something needs a decision", short: "Signal" },
  { key: "context", label: "We find who knows", short: "Who" },
  { key: "deliver", label: "They get one question", short: "Ask" },
  { key: "answer", label: "One tap", short: "Answer" },
  { key: "code", label: "Their answer takes effect", short: "Apply" },
  { key: "ship", label: "Reviewed and live", short: "Live" },
] as const;

/**
 * How long autoplay holds each stage, in ms. Uneven on purpose — the diff and
 * the review need reading time, the handoff stages do not. Totals ~19s, which is
 * slow enough to narrate over on a call.
 */
const STAGE_MS = [3000, 3600, 3400, 2800, 4000, 3400];

const CLASS_STYLE: Record<TapClass, { chip: string; dot: string; ring: string; text: string }> = {
  tactical: {
    chip: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-400",
    ring: "ring-sky-400/40",
    text: "text-sky-300",
  },
  operational: {
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-400",
    ring: "ring-emerald-400/40",
    text: "text-emerald-300",
  },
  strategic: {
    chip: "bg-violet-50 text-violet-700 ring-violet-200",
    dot: "bg-violet-400",
    ring: "ring-violet-400/40",
    text: "text-violet-300",
  },
};

export function Walkthrough() {
  // Commerce is index 0 in VERTICALS, so it is the default with no special case.
  const [vi, setVi] = useState(0);
  const [cls, setCls] = useState<TapClass>("strategic");
  const [stage, setStage] = useState(2); // land on the tap — it is what people came for
  const [chosen, setChosen] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);

  // An ARRAY of timers. The previous version kept a single ref inside a loop, so
  // stop() only ever cleared the last of six timeouts and the rest kept firing.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const vertical = VERTICALS[vi];
  const scenario = vertical.scenarios[cls];

  const stop = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPlaying(false);
  }, []);

  const reset = useCallback(
    (toStage = 2) => {
      stop();
      setChosen(null);
      setStage(toStage);
    },
    [stop]
  );

  const pickVertical = (i: number) => {
    setVi(i);
    reset();
  };
  const pickClass = (c: TapClass) => {
    setCls(c);
    reset();
  };

  const answer = useCallback((i: number) => {
    setChosen(i);
    setStage(4); // answering carries you forward — that IS the story
  }, []);

  const goStage = useCallback(
    (n: number) => {
      const next = Math.max(0, Math.min(STAGES.length - 1, n));
      // Stages past the tap only make sense once an answer exists.
      if (next >= 4 && chosen === null) setChosen(scenario.suggested);
      setStage(next);
    },
    [chosen, scenario.suggested]
  );

  const play = () => {
    stop();
    setChosen(null);
    setStage(0);
    setPlaying(true);
    let elapsed = 0;
    STAGE_MS.forEach((ms, i) => {
      if (i === 0) return; // stage 0 is already showing
      elapsed += STAGE_MS[i - 1];
      timers.current.push(
        setTimeout(() => {
          if (i === 3) setChosen(scenario.suggested);
          setStage(i);
        }, elapsed)
      );
    });
    timers.current.push(
      setTimeout(() => setPlaying(false), elapsed + STAGE_MS[STAGE_MS.length - 1])
    );
  };

  useEffect(() => stop, [stop]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowRight") { stop(); goStage(stage + 1); }
      else if (e.key === "ArrowLeft") { stop(); goStage(stage - 1); }
      else if (e.key === "ArrowDown") pickClass(TAP_CLASSES[(TAP_CLASSES.indexOf(cls) + 1) % 3]);
      else if (e.key === "ArrowUp") pickClass(TAP_CLASSES[(TAP_CLASSES.indexOf(cls) + 2) % 3]);
      else if (e.key === "Escape") reset();
      else if (/^[1-5]$/.test(e.key) && stage <= 3) {
        const i = Number(e.key) - 1;
        if (i < scenario.options.length) { stop(); answer(i); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="w-full">
      {/* ------------------------------------------------------ industry row */}
      <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
        {VERTICALS.map((v, i) => (
          <button
            key={v.id}
            onClick={() => pickVertical(i)}
            aria-pressed={i === vi}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
              i === vi
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-300 ring-1 ring-inset ring-white/15 hover:bg-white/10 hover:text-white"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d={v.glyph} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {v.label}
          </button>
        ))}
      </div>

      {/* --------------------------------------------------------- class row */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex gap-1 rounded-full bg-white/5 p-1 ring-1 ring-inset ring-white/10">
          {TAP_CLASSES.map((c) => {
            const on = c === cls;
            return (
              <button
                key={c}
                onClick={() => pickClass(c)}
                aria-pressed={on}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium capitalize transition-all ${
                  on ? "bg-white text-slate-900" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${CLASS_STYLE[c].dot}`} />
                {c}
              </button>
            );
          })}
        </div>

        <button
          onClick={playing ? stop : play}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-teal-500/15 px-3 py-1.5 text-[12px] font-semibold text-teal-300 ring-1 ring-inset ring-teal-400/30 transition-colors hover:bg-teal-500/25"
        >
          {playing ? (
            <>
              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="currentColor">
                <rect x="2" y="2" width="3" height="8" rx="1" />
                <rect x="7" y="2" width="3" height="8" rx="1" />
              </svg>
              Stop
            </>
          ) : (
            <>
              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="currentColor">
                <path d="M3 2l7 4-7 4z" />
              </svg>
              Play the flow
            </>
          )}
        </button>
      </div>

      {/* ------------------------------------------- the problem, then the ask
          Leading with the problem and showing the question up front regardless
          of which stage you are on. A visitor should never have to click to find
          out what this scenario is actually about. */}
      <div className="mb-4 rounded-xl bg-white/[0.06] px-3.5 py-3 ring-1 ring-inset ring-white/10 sm:px-4 sm:py-3.5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
            {scenario.detected.eventType}
          </span>
          <span className="text-[11px] text-slate-400">
            {EVENT_COPY[scenario.detected.eventType]}
          </span>
          <span className={`ml-auto text-[11px] font-medium ${CLASS_STYLE[cls].text}`}>
            {CLASS_COPY[cls].label}
          </span>
        </div>

        <p className="text-[13.5px] leading-relaxed text-slate-200">{scenario.detected.signal}</p>

        <div className="mt-3 flex gap-2.5 border-t border-white/10 pt-3">
          <span className="mt-0.5 shrink-0 text-[10px] font-bold uppercase tracking-wider text-teal-400">
            we ask
          </span>
          <p className="text-[14px] font-medium leading-snug tracking-[-0.01em] text-white sm:text-[15px]">
            &ldquo;{scenario.question}&rdquo;
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------------- the rail */}
      <FlowRail stage={stage} playing={playing} onPick={(n) => { stop(); goStage(n); }} />

      {/* --------------------------------------------------------- the panel */}
      <div className="mt-4 min-h-[24rem] rounded-xl bg-white shadow-2xl shadow-black/30 ring-1 ring-black/5 sm:min-h-[26rem]">
        <StagePanel
          key={`${scenario.id}-${stage}-${chosen}`}
          s={scenario}
          stage={stage}
          chosen={chosen}
          onAnswer={(i) => { stop(); answer(i); }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { stop(); goStage(stage - 1); }}
            disabled={stage === 0}
            className="rounded-md px-2.5 py-1 text-[12px] text-slate-400 ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30"
          >
            ← Back
          </button>
          <button
            onClick={() => { stop(); goStage(stage + 1); }}
            disabled={stage === STAGES.length - 1}
            className="rounded-md bg-white/10 px-2.5 py-1 text-[12px] font-medium text-white ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/20 disabled:opacity-30"
          >
            Next →
          </button>
          <button
            onClick={() => reset(0)}
            className="rounded-md px-2.5 py-1 text-[12px] text-slate-500 transition-colors hover:text-slate-300"
          >
            Restart
          </button>
        </div>
        <p className="hidden text-[11px] text-slate-500 sm:block">
          <Kbd>←</Kbd> <Kbd>→</Kbd> stage · <Kbd>↑</Kbd> <Kbd>↓</Kbd> class · <Kbd>1–5</Kbd> answer
        </p>
      </div>
    </div>
  );
}

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="rounded border border-white/15 bg-white/5 px-1 py-px font-sans">{children}</kbd>
);

/* ------------------------------------------------------------------- rail */

function FlowRail({
  stage,
  playing,
  onPick,
}: {
  stage: number;
  playing: boolean;
  onPick: (n: number) => void;
}) {
  const pct = (stage / (STAGES.length - 1)) * 100;
  return (
    <div className="rounded-xl bg-white/[0.04] px-2 py-3.5 ring-1 ring-inset ring-white/10 sm:px-4 sm:py-4">
      <div className="relative">
        <div className="absolute left-0 right-0 top-[11px] h-[2px] rounded bg-white/10 sm:top-[13px]" />
        <div
          className="absolute top-[11px] h-[2px] rounded bg-gradient-to-r from-teal-500 to-teal-300 transition-all duration-[900ms] ease-out sm:top-[13px]"
          style={{ left: 0, width: `${pct}%` }}
        />
        <ol className="relative flex justify-between">
          {STAGES.map((st, i) => {
            const done = i < stage;
            const on = i === stage;
            return (
              <li key={st.key} className="flex min-w-0 flex-1 flex-col items-center">
                <button onClick={() => onPick(i)} aria-current={on} className="group flex flex-col items-center focus:outline-none">
                  <span
                    className={`relative flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold transition-all duration-300 sm:h-7 sm:w-7 sm:text-[11px] ${
                      on
                        ? "scale-110 bg-teal-400 text-slate-900 ring-4 ring-teal-400/25"
                        : done
                          ? "bg-teal-600 text-white"
                          : "bg-slate-800 text-slate-400 ring-1 ring-inset ring-white/10 group-hover:bg-slate-700"
                    }`}
                  >
                    {on && playing && (
                      <span className="absolute inset-0 animate-ping rounded-full bg-teal-400 opacity-40" />
                    )}
                    {done ? (
                      <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
                        <path d="M5 10.5l3.2 3.2L15 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    className={`mt-2 hidden text-center text-[11px] leading-tight transition-colors sm:block ${
                      on ? "font-semibold text-white" : done ? "text-teal-300/80" : "text-slate-500 group-hover:text-slate-300"
                    }`}
                  >
                    {st.label}
                  </span>
                  <span className={`mt-1.5 text-center text-[10px] sm:hidden ${on ? "font-semibold text-white" : "text-slate-500"}`}>
                    {st.short}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ stage panel */

function StagePanel({
  s,
  stage,
  chosen,
  onAnswer,
}: {
  s: Scenario;
  stage: number;
  chosen: number | null;
  onAnswer: (i: number) => void;
}) {
  const Head = ({ kicker, title }: { kicker: string; title: string }) => (
    <div className="mb-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">{kicker}</p>
      <h3 className="mt-1 text-[17px] font-semibold leading-snug tracking-[-0.01em] text-slate-900">{title}</h3>
    </div>
  );
  const wrap = "animate-[fadeIn_.35s_ease-out] px-4 py-4 sm:px-6 sm:py-5";

  /* 1 ------------------------------------------------------------ detect */
  if (stage === 0)
    return (
      <div className={wrap}>
        <Head kicker="Step 1 · Something needs a decision" title={s.detected.signal} />
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-100 px-3.5 py-2.5">
          <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
            {s.detected.eventType}
          </span>
          <span className="text-[12px] text-slate-600">{EVENT_COPY[s.detected.eventType]}</span>
          <span className="ml-auto text-[11px] text-slate-500">{s.detected.by}</span>
        </div>
        {s.detected.where && (
          <p className="mt-2 px-1 text-[11px] text-slate-400">
            Where we saw it: <code className="text-slate-500">{s.detected.where}</code>
          </p>
        )}
        <p className="mt-4 text-[13px] leading-relaxed text-slate-600">
          There is nothing wrong with how this arose — people built what they were asked to build,
          from the information they had. What is missing is a way to bring in the person who holds the
          rest of that information.
        </p>
        <Foot>
          Six kinds of event can open a tap. Only one of them is a code change — a metric nobody
          uses, definitions that disagree, or a number that moved all qualify.
        </Foot>
      </div>
    );

  /* 2 ----------------------------------------------------------- context */
  if (stage === 1)
    return (
      <div className={wrap}>
        <Head kicker="Step 2 · We find who knows" title="What is at stake, and whose call it is" />
        <ul className="space-y-2">
          {s.implications.map((im) => (
            <li key={im} className="flex gap-2.5 rounded-lg bg-amber-50/70 px-3 py-2">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <span className="text-[13px] leading-relaxed text-amber-950/90">{im}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-slate-200 px-3.5 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
            {s.persona.initials}
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-slate-900">{s.persona.name}</p>
            <p className="text-[11px] text-slate-500">{s.persona.title}</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600">{s.routing}</p>
          </div>
        </div>
        <Foot>
          We work out who to ask from the ownership files your teams already maintain. Your identity
          provider tells us their role — nothing more.
        </Foot>
      </div>
    );

  /* 3 & 4 ---------------------------------------------------------- tap */
  if (stage === 2 || stage === 3) {
    const answered = stage === 3 && chosen !== null;
    return (
      <div className={wrap}>
        <Head
          kicker={answered ? "Step 4 · One tap" : "Step 3 · They get one question"}
          title={answered ? "That was the entire interaction" : `Reaches them in ${s.channel}, with what is at stake attached`}
        />
        <TapCard s={s} chosen={chosen} onAnswer={onAnswer} locked={answered} />
        <Foot>
          {answered
            ? "No dashboard opened, no meeting scheduled, nothing learned about version control."
            : `One question, ${s.context.length} lines of context, ${s.options.length} options. Median answer: ${s.medianSeconds}s.`}
        </Foot>
      </div>
    );
  }

  /* 5 -------------------------------------------------------------- code */
  if (stage === 4)
    return (
      <div className={wrap}>
        <Head kicker="Step 5 · Their answer takes effect" title="The decision becomes the way the system behaves" />
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3.5 py-2">
            <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {TARGET_LABEL[s.writeBack.target]}
            </span>
            <code className="text-[12px] font-medium text-slate-700">{s.writeBack.artifact}</code>
            <code className="ml-auto hidden truncate text-[11px] text-slate-400 sm:block">{s.writeBack.file}</code>
          </div>
          <pre className="overflow-x-auto bg-slate-950 px-3 py-3 text-[10.5px] leading-relaxed sm:px-3.5 sm:text-[11.5px]">
            {s.writeBack.diff.map((l, i) => (
              <div key={i} className={l.sign === "+" ? "text-teal-300" : l.sign === "-" ? "text-rose-400/80" : "text-slate-500"}>
                <span className="select-none opacity-60">{l.sign} </span>
                {l.text}
              </div>
            ))}
          </pre>
        </div>
        <p className="mt-3.5 text-[13px] leading-relaxed text-slate-600">{s.writeBack.summary}</p>
        <Foot>
          Company decisions are routed for engineering review. Routine ones apply directly. Either
          way the expert never had to open a tool they do not use.
        </Foot>
      </div>
    );

  /* 6 -------------------------------------------------------------- ship */
  return (
    <div className={wrap}>
      <Head kicker="Step 6 · Reviewed and live" title="Expert judgment and engineering review, working together" />
      <div className="rounded-lg border border-teal-200 bg-teal-50/60 px-3.5 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-white">
            <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3">
              <path d="M5 10.5l3.2 3.2L15 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="text-[13px] font-semibold text-teal-900">Approved by {s.shipped.reviewer}</p>
        </div>
        <ul className="mt-2.5 space-y-1">
          {s.shipped.checks.map((c) => (
            <li key={c} className="flex items-center gap-2 text-[12px] text-teal-900/80">
              <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3 shrink-0 text-teal-600">
                <path d="M5 10.5l3.2 3.2L15 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {c}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3.5 text-[13px] leading-relaxed text-slate-700">{s.shipped.effect}</p>
      <dl className="mt-4 grid grid-cols-1 gap-px overflow-hidden rounded-lg bg-slate-200 sm:grid-cols-3">
        {s.shipped.facts.map((f) => (
          <div key={f.label} className="bg-white px-3.5 py-2.5">
            <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{f.label}</dt>
            <dd className="mt-0.5 text-[13px] font-semibold text-slate-900">{f.value}</dd>
          </div>
        ))}
      </dl>
      <Foot>
        And the decision lands in the ledger — so the next person, and the next AI agent, starts from
        what your experts already established rather than working it out again.
      </Foot>
    </div>
  );
}

const Foot = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-4 border-t border-slate-100 pt-3 text-[11.5px] leading-relaxed text-slate-500">{children}</p>
);

/* -------------------------------------------------------------- tap card */

function TapCard({
  s,
  chosen,
  onAnswer,
  locked,
}: {
  s: Scenario;
  chosen: number | null;
  onAnswer: (i: number) => void;
  locked: boolean;
}) {
  const cls = CLASS_STYLE[s.tapClass];
  return (
    <div className="overflow-hidden rounded-lg ring-1 ring-slate-200">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-3.5 py-2">
        <span className="flex h-4 w-4 items-center justify-center rounded bg-teal-700 text-[9px] font-bold text-white">
          T
        </span>
        <span className="text-[12px] font-semibold text-slate-800">Tap AI</span>
        <span className="rounded bg-slate-200 px-1 py-px text-[9px] font-bold uppercase text-slate-600">app</span>
        <span className="ml-auto text-[11px] text-slate-500">
          {s.channel} · to {s.persona.name.split(" ")[0]}
        </span>
      </div>

      <div className="px-4 py-4">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
            {s.persona.initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold leading-tight text-slate-900">{s.persona.name}</p>
            <p className="truncate text-[10.5px] leading-tight text-slate-500">{s.persona.title}</p>
          </div>
          <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${cls.chip}`}>
            {s.tapClass}
          </span>
        </div>

        <p className="text-[16px] font-medium leading-snug tracking-[-0.01em] text-slate-900">{s.question}</p>

        <ul className="mt-2.5 space-y-1.5">
          {s.context.map((c) => (
            <li key={c} className="flex gap-2 text-[12.5px] leading-relaxed text-slate-600">
              <span className="mt-[7px] inline-block h-1 w-1 shrink-0 rounded-full bg-slate-300" />
              {c}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-2">
          {s.options.map((o, i) => {
            const isChosen = chosen === i;
            const dim = locked && !isChosen;
            return (
              <button
                key={o}
                onClick={() => onAnswer(i)}
                className={`rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-all duration-200 ${
                  isChosen
                    ? "bg-teal-600 text-white ring-2 ring-teal-600 ring-offset-1"
                    : dim
                      ? "bg-slate-50 text-slate-300 ring-1 ring-inset ring-slate-200"
                      : "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 hover:ring-slate-400 active:scale-[0.98]"
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
          <button className="text-slate-500 underline decoration-dotted underline-offset-2 hover:text-slate-800">
            Not me — reassign
          </button>
          <span className="text-slate-300">·</span>
          <span>{CLASS_COPY[s.tapClass].label} tap</span>
          <span className="ml-auto">{TARGET_LABEL[s.writeBack.target]}</span>
        </div>
      </div>
    </div>
  );
}
