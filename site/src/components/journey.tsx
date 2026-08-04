"use client";

import { useEffect, useRef, useState } from "react";
import { TIERS, VERTICALS, type Scenario, type TapClass } from "@/lib/scenarios";
import { href } from "@/lib/href";

/**
 * The journey. One argument in three beats:
 *
 *   1. TRIGGER   a relatable thing happens at your company
 *   2. TAP       all you do is answer it
 *   3. OUTCOME   what changed, and what you just contributed
 *
 * DESIGN NOTES worth keeping:
 *
 * - THE QUESTION IS PINNED. The short form of the question stays locked in the
 *   sticky header for all three beats. It is the thing the whole sequence is
 *   about, and without it pinned a visitor two screens down has lost the thread.
 *   The long form still appears inside the tap card itself.
 *
 * - The visitor picks WHO THEY ARE, not what kind of question it is. C-Suite
 *   first, because the strategic scenario is the one that makes the value
 *   obvious; the routine ones read as small until you have seen a big one.
 *
 * - ONE BEAT PER SCREEN, advancing on scroll. The three beats are a narrative and
 *   scrolling is how people read narratives. Inactive beats recede.
 *
 * - Mobile first, literally: everything fits inside 360px with no horizontal
 *   scroll. Desktop is the same layout with more air.
 */

const BEATS = ["The trigger", "The tap", "The outcome"] as const;

const TONE: Record<TapClass, { text: string; dot: string; ring: string; soft: string }> = {
  tactical: { text: "text-sky-300", dot: "bg-sky-400", ring: "ring-sky-400/40", soft: "bg-sky-400/10" },
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
  // C-Suite by default. The strategic scenario makes the value legible fastest.
  const [tier, setTier] = useState<TapClass>("strategic");
  const [vi, setVi] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [beat, setBeat] = useState(0);

  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const outcomeRef = useRef<HTMLDivElement | null>(null);

  const vertical = VERTICALS[vi];
  const s = vertical.scenarios[tier];
  const t = TONE[tier];
  const tierMeta = TIERS.find((x) => x.key === tier)!;

  const reset = () => {
    setAnswered(null);
    setNote("");
  };

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
      // Narrow band: with a beat per screen the handover should happen as the
      // block crosses the middle, not as it enters.
      { rootMargin: "-48% 0px -48% 0px", threshold: 0 }
    );
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, [tier, vi]);

  const answer = (i: number, freeText = "") => {
    setAnswered(i);
    setNote(freeText);
    requestAnimationFrame(() =>
      outcomeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    );
  };

  return (
    <div className="w-full">
      {/* ================================================== pinned: who + question
          Roles and the question only. Industry pills and the persona description
          live below, unpinned — they are choices you make once, and pinning them
          would cost 80px of every screen. */}
      <div className="sticky top-[52px] z-20 -mx-5 mb-6 border-b border-white/[0.07] bg-slate-950/95 px-5 py-3 backdrop-blur sm:-mx-6 sm:px-6">
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
                className={`group rounded-xl px-2 py-2.5 text-center ring-1 ring-inset transition-all duration-300 sm:py-3 ${
                  on ? `${xt.soft} ${xt.ring} scale-[1.02]` : "ring-white/10 hover:bg-white/[0.07] hover:ring-white/20"
                }`}
              >
                <span
                  className={`block text-[13px] font-semibold transition-colors sm:text-[15px] ${
                    on ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                >
                  {x.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* the locked question */}
        <div key={`${s.id}-q`} className="mt-3 animate-[fadeIn_.4s_ease-out]">
          <p className={`text-[9.5px] font-bold uppercase tracking-wider ${t.text}`}>
            The question
          </p>
          <p className="mt-1 text-[15px] font-semibold leading-[1.25] tracking-[-0.015em] text-white sm:text-[19px]">
            {s.shortQuestion}
          </p>
        </div>

        {/* beat progress */}
        <div className="mt-2.5 flex items-center gap-1.5">
          {BEATS.map((b, i) => (
            <span
              key={b}
              className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                i <= beat ? "bg-teal-400" : "bg-white/12"
              }`}
            />
          ))}
          <span className="ml-1 shrink-0 text-[10px] font-medium text-slate-400">{BEATS[beat]}</span>
        </div>
      </div>

      {/* ============================================= persona context + industry */}
      <div className={`rounded-2xl px-4 py-4 ring-1 ring-inset sm:px-5 ${t.soft} ${t.ring}`}>
        <p className={`text-[10px] font-bold uppercase tracking-wider ${t.text}`}>
          {tierMeta.label}
        </p>
        <dl className="mt-2.5 space-y-2.5">
          {[
            ["Looking for", tierMeta.looksFor],
            ["Contributes", tierMeta.contributes],
            ["A tap means", tierMeta.means],
          ].map(([k, v]) => (
            <div key={k} className="sm:flex sm:gap-3">
              <dt className="shrink-0 text-[10.5px] font-bold uppercase tracking-wide text-white/45 sm:w-[6.5rem] sm:pt-px">
                {k}
              </dt>
              <dd className="mt-0.5 text-[13px] leading-relaxed text-slate-200 sm:mt-0">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="-mx-5 mt-4 flex gap-1.5 overflow-x-auto px-5 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
        {VERTICALS.map((v, i) => (
          <button
            key={v.id}
            onClick={() => {
              setVi(i);
              reset();
            }}
            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] transition-colors ${
              i === vi
                ? "bg-white font-medium text-slate-900"
                : "text-slate-400 ring-1 ring-inset ring-white/10 hover:text-white"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

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
        <div className="rounded-2xl bg-white p-5 shadow-2xl shadow-black/30 sm:p-7">
          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-amber-800">
            {s.detected.eventType}
          </span>
          <p className="mt-3.5 text-[19px] font-semibold leading-[1.25] tracking-[-0.02em] text-slate-900 sm:text-[24px]">
            {s.detected.signal}
          </p>
          <p className="mt-3.5 border-t border-slate-100 pt-3.5 text-[12.5px] leading-relaxed text-slate-500">
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
        <TapCard s={s} answered={answered} onAnswer={answer} pulse={beat === 1 && answered === null} />
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
            <div className="rounded-2xl border border-dashed border-white/15 px-5 py-14 text-center sm:py-20">
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="mx-auto h-7 w-7 text-slate-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M12 19V5M6 11l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-4 text-[15px] font-medium text-slate-400 sm:text-[17px]">
                Pick an answer above
              </p>
              <p className="mx-auto mt-1.5 max-w-xs text-[12.5px] leading-relaxed text-slate-600">
                The outcome — and what you just contributed — appears here.
              </p>
            </div>
          ) : (
            <div className="animate-[riseIn_.45s_ease-out] space-y-3">
              {note && (
                <div className="rounded-2xl bg-white/[0.05] px-5 py-4 ring-1 ring-inset ring-white/12">
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/45">
                    Recorded with the decision
                  </p>
                  <p className="mt-2 text-[14px] italic leading-relaxed text-slate-200">
                    &ldquo;{note}&rdquo;
                  </p>
                  <p className="mt-2 text-[11.5px] text-slate-500">
                    Free-text answers are kept alongside the structured one, so the reasoning
                    survives even when the options did not fit.
                  </p>
                </div>
              )}

              <div className={`rounded-2xl px-5 py-5 ring-1 ring-inset sm:px-6 sm:py-6 ${t.soft} ${t.ring}`}>
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/60">
                  You just did something you could not do before
                </p>
                <p className="mt-2.5 text-[17px] font-medium leading-[1.35] text-white sm:text-[20px]">
                  {s.contribution}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                  <p className="text-[13px] font-semibold text-slate-900">
                    {s.tapClass === "tactical" ? "Applied" : "Reviewed and applied"}
                  </p>
                </div>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-slate-600">
                  {s.shipped.effect}
                </p>
                <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                  {s.shipped.checks.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-[12.5px] text-slate-600">
                      <Check className="mt-[3px] h-3 w-3 shrink-0 text-teal-600" />
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
                  className="rounded-xl bg-white/10 px-3.5 py-2.5 text-[13px] font-medium text-white ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/20"
                >
                  Try another scenario
                </button>
                <a
                  href={href("/how-it-works/")}
                  className="rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-teal-300 transition-colors hover:text-teal-200"
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

/* -------------------------------------------------------------------- icons */

const Check = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
    <path
      d="M5 10.5l3.2 3.2L15 7"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ------------------------------------------------------------------- the tap */

/**
 * The tap card.
 *
 * Beyond the preset options it offers three things a real tap needs and a demo
 * usually skips:
 *   * a CUSTOM answer, because the option list will never cover everything and
 *     forcing a wrong pick is worse than a free-text note
 *   * WHY AM I BEING ASKED — the routing rationale, so the question does not feel
 *     arbitrary
 *   * SEE THE IMPACT — the concrete stake, which is what turns a notification
 *     into something worth five seconds
 */
function TapCard({
  s,
  answered,
  onAnswer,
  pulse,
}: {
  s: Scenario;
  answered: number | null;
  onAnswer: (i: number, note?: string) => void;
  pulse: boolean;
}) {
  const [custom, setCustom] = useState(false);
  const [note, setNote] = useState("");
  const [panel, setPanel] = useState<"why" | "impact" | null>(null);
  const locked = answered !== null;

  return (
    <div
      className={`rounded-2xl bg-white shadow-2xl shadow-black/40 transition-transform duration-500 ${
        pulse ? "animate-[tapPulse_1.6s_ease-out_.3s_1]" : ""
      }`}
    >
      <div className="flex items-center gap-2 rounded-t-2xl border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <span
          aria-hidden
          className="flex h-4 w-4 items-center justify-center rounded bg-teal-700 text-[9px] font-bold text-white"
        >
          T
        </span>
        <span className="text-[12px] font-semibold text-slate-800">Tap AI</span>
        <span className="ml-auto truncate text-[11px] text-slate-500">
          {s.channel} · {s.persona.name.split(" ")[0]}
        </span>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-5">
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

        {/* the two links, before the options — they are what makes an answer
            confident rather than a guess */}
        <div className="mt-3.5 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-slate-100 pt-3">
          {(
            [
              ["why", "Why am I being asked?"],
              ["impact", "See the impact"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setPanel(panel === k ? null : k)}
              aria-expanded={panel === k}
              className={`inline-flex items-center gap-1 text-[12px] font-medium underline decoration-dotted underline-offset-2 transition-colors ${
                panel === k ? "text-teal-700" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {label}
              <span className={`transition-transform ${panel === k ? "rotate-180" : ""}`}>⌄</span>
            </button>
          ))}
        </div>

        {panel === "why" && (
          <div className="mt-2.5 animate-[fadeIn_.25s_ease-out] rounded-xl bg-slate-50 px-3.5 py-3">
            <p className="text-[12.5px] leading-relaxed text-slate-700">{s.routing}</p>
            <p className="mt-2 text-[11.5px] text-slate-500">
              Resolved from the ownership files your teams already maintain — not an org chart we
              imported.
            </p>
          </div>
        )}

        {panel === "impact" && (
          <div className="mt-2.5 animate-[fadeIn_.25s_ease-out] rounded-xl bg-amber-50 px-3.5 py-3 ring-1 ring-inset ring-amber-200">
            <p className="text-[17px] font-semibold leading-none tracking-[-0.02em] text-amber-900">
              {s.impact.headline}
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-amber-950/85">{s.impact.detail}</p>
          </div>
        )}

        {/* answers */}
        <div className="mt-4 flex flex-col gap-2">
          {s.options.map((o, i) => {
            const chosen = answered === i;
            const dim = locked && !chosen;
            return (
              <button
                key={o}
                onClick={() => onAnswer(i)}
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

          {/* custom answer. An option list never covers everything, and forcing a
              wrong pick poisons the record more than a free-text note does. */}
          {!custom ? (
            <button
              onClick={() => setCustom(true)}
              disabled={locked}
              className={`w-full rounded-xl border border-dashed px-4 py-3 text-left text-[14px] font-medium transition-colors ${
                locked
                  ? "border-slate-200 text-slate-300"
                  : "border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              + Something else — add a note
            </button>
          ) : (
            <div className="animate-[fadeIn_.25s_ease-out] rounded-xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-200">
              <label
                htmlFor="tap-note"
                className="block text-[11px] font-bold uppercase tracking-wide text-slate-500"
              >
                Your answer, in your words
              </label>
              <textarea
                id="tap-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="It depends on whether the contract was signed before the fiscal year change…"
                className="mt-1.5 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13.5px] leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => onAnswer(s.options.length, note.trim())}
                  disabled={!note.trim() || locked}
                  className="rounded-lg bg-teal-600 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-teal-700 disabled:bg-slate-300"
                >
                  Send with note
                </button>
                <button
                  onClick={() => {
                    setCustom(false);
                    setNote("");
                  }}
                  className="text-[12.5px] text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <span className="ml-auto text-[11px] text-slate-400">
                  Notes are recorded with the decision
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <span className="text-[11px] text-slate-400">Not you? Reassign in one tap.</span>
          <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
            ~{s.medianSeconds}s
          </span>
        </div>
      </div>
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
  active?: boolean;
  children: React.ReactNode;
}) => (
  <div
    ref={ref}
    className={`relative flex min-h-[76svh] scroll-mt-[9rem] flex-col justify-center py-6 pl-0 transition-all duration-700 sm:min-h-[80svh] sm:pl-12 ${
      active ? "opacity-100" : "opacity-40 sm:scale-[0.985]"
    }`}
  >
    <span
      aria-hidden
      className={`absolute bottom-0 left-[15px] top-0 hidden w-px origin-top bg-gradient-to-b from-transparent via-white/20 to-transparent sm:block ${
        active ? "animate-[drawDown_1s_ease-out]" : ""
      }`}
    />
    <div className="mb-4 flex items-start gap-3 sm:mb-5 sm:block">
      <span
        className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-bold transition-all duration-500 sm:absolute sm:-left-12 sm:h-9 sm:w-9 sm:text-[15px] ${
          active ? "scale-110 bg-white text-slate-900 shadow-lg shadow-white/10" : "bg-white/10 text-slate-500"
        }`}
      >
        {n}
      </span>
      <div className="min-w-0">
        <p
          className={`text-[17px] font-semibold leading-tight tracking-[-0.01em] transition-colors duration-500 sm:text-[21px] ${
            active ? "text-white" : "text-slate-500"
          }`}
        >
          {label}
        </p>
        <p
          className={`mt-1 text-[13px] leading-snug transition-colors duration-500 ${
            active ? "text-slate-400" : "text-slate-600"
          }`}
        >
          {sub}
        </p>
      </div>
    </div>
    {children}
  </div>
);
