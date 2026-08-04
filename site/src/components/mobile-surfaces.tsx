"use client";

import { useState } from "react";

/**
 * The same question, on a phone, in two apps people already have open.
 *
 * This section exists because "meets people where they are" is the claim most
 * likely to be doubted — every governance tool says it, and most of them mean
 * "we have a web app". Showing the tap inside Slack and inside Claude, on a
 * phone, is the fastest way to settle it. A pricing manager answering from a
 * shop floor and a CFO answering from a taxi are the actual use cases.
 *
 * Note the two renderings are not the same layout. Slack is a message with
 * buttons; Claude is a conversation that can be argued with. Same tap, same
 * decision recorded, different affordances — which is the persona-aware claim
 * made visible rather than asserted.
 */

type Surface = "slack" | "claude";

const TAP = {
  question: "Should the new BUNDLE promo codes stack with loyalty discounts?",
  context: ["Stacking allows up to 42% off some baskets.", "Live on site since 6am today."],
  options: ["Yes, stack them", "No, highest discount wins", "Stack up to a 30% cap", "Not sure"],
  chosen: 2,
  persona: "Marta",
};

export function MobileSurfaces() {
  const [answered, setAnswered] = useState<Surface | null>(null);

  return (
    <div>
      <div className="grid gap-8 sm:grid-cols-2 sm:gap-6 lg:gap-8">
        <Phone label="Slack" caption="A message with buttons. Answer without leaving the channel.">
          <SlackBody answered={answered === "slack"} onAnswer={() => setAnswered("slack")} />
        </Phone>
        <Phone label="Claude" caption="A conversation. Ask what is at stake before deciding.">
          <ClaudeBody answered={answered === "claude"} onAnswer={() => setAnswered("claude")} />
        </Phone>
      </div>

      <p className="mt-6 rounded-lg border-l-2 border-teal-400 bg-teal-500/10 px-4 py-3 text-[13px] leading-relaxed text-teal-100/90">
        Same question, same decision recorded, different affordances.{" "}
        <strong className="text-white">Nobody installs anything.</strong> A pricing manager answers
        from the shop floor and a CFO answers from the back of a taxi, and both answers land in the
        same governed record.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ chrome */

function Phone({
  label,
  caption,
  children,
}: {
  label: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
        <span className="text-[13px] font-semibold text-white">{label}</span>
        <span className="text-[11.5px] text-slate-400">{caption}</span>
      </div>

      <div className="mx-auto w-full max-w-[17rem] sm:max-w-[19rem]">
        {/* device */}
        <div className="rounded-[2.1rem] bg-slate-800 p-2 shadow-2xl shadow-black/50 ring-1 ring-white/10">
          <div className="relative overflow-hidden rounded-[1.7rem] bg-white">
            {/* notch */}
            <div className="absolute left-1/2 top-2 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-slate-900" />
            {/* status bar */}
            <div className="flex items-center justify-between px-5 pb-1 pt-2.5 text-[10px] font-semibold text-slate-800">
              <span>9:41</span>
              <span className="flex items-center gap-1">
                <svg viewBox="0 0 16 12" className="h-2.5 w-3.5" fill="currentColor">
                  <rect x="0" y="8" width="3" height="4" rx="1" />
                  <rect x="4" y="6" width="3" height="6" rx="1" />
                  <rect x="8" y="3" width="3" height="9" rx="1" />
                  <rect x="12" y="0" width="3" height="12" rx="1" />
                </svg>
                <svg viewBox="0 0 24 12" className="h-2.5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="1" width="19" height="10" rx="2.5" />
                  <rect x="3" y="3" width="13" height="6" rx="1" fill="currentColor" stroke="none" />
                  <path d="M22 4.5v3" strokeLinecap="round" />
                </svg>
              </span>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- slack */

function SlackBody({ answered, onAnswer }: { answered: boolean; onAnswer: () => void }) {
  return (
    <div className="min-h-[24rem] sm:min-h-[26rem]">
      {/* slack header */}
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2.5">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-slate-900">Tap AI</p>
          <p className="text-[10px] text-slate-500">app</p>
        </div>
      </div>

      <div className="space-y-3 px-4 py-3">
        <div className="flex gap-2.5">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-teal-700 text-[11px] font-bold text-white" aria-hidden>
            T
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px]">
              <span className="font-bold text-slate-900">Tap AI</span>
              <span className="ml-1.5 rounded bg-slate-200 px-1 py-px text-[8px] font-bold uppercase text-slate-600">
                app
              </span>
              <span className="ml-1.5 text-[10px] text-slate-400">9:38 AM</span>
            </p>

            {/* the tap */}
            <div className="mt-1.5 border-l-[3px] border-teal-600 pl-2.5">
              <p className="text-[13.5px] font-medium leading-snug text-slate-900">{TAP.question}</p>
              <ul className="mt-1.5 space-y-1">
                {TAP.context.map((c) => (
                  <li key={c} className="flex gap-1.5 text-[11.5px] leading-snug text-slate-600">
                    <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                    {c}
                  </li>
                ))}
              </ul>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {TAP.options.map((o, i) => {
                  const on = answered && i === TAP.chosen;
                  return (
                    <button
                      key={o}
                      onClick={onAnswer}
                      className={`rounded border px-2 py-1 text-[11px] font-semibold transition-colors ${
                        on
                          ? "border-teal-700 bg-teal-700 text-white"
                          : answered
                            ? "border-slate-200 bg-white text-slate-300"
                            : "border-slate-300 bg-white text-slate-700 active:bg-slate-100"
                      }`}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] text-slate-400">Not me — reassign</p>
            </div>
          </div>
        </div>

        {answered && (
          <div className="animate-[fadeIn_.3s_ease-out] flex gap-2.5">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-teal-700 text-[11px] font-bold text-white" aria-hidden>
              T
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-slate-500">
                Thanks — <span className="font-medium text-slate-700">30% cap</span> recorded. Pricing
                and checkout now read the same rule.
              </p>
              <p className="mt-1 rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-500">
                ✓ Applied · reviewed by analytics engineering
              </p>
            </div>
          </div>
        )}
      </div>

      {/* composer */}
      <div className="mt-2 border-t border-slate-200 px-4 py-2.5">
        <div className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11px] text-slate-400">
          Message Tap AI
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ claude */

function ClaudeBody({ answered, onAnswer }: { answered: boolean; onAnswer: () => void }) {
  const [asked, setAsked] = useState(false);
  return (
    <div className="min-h-[24rem] sm:min-h-[26rem]">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d97757] text-[10px] font-bold text-white" aria-hidden>
          ✳
        </span>
        <p className="text-[13px] font-semibold text-slate-900">Claude</p>
      </div>

      <div className="space-y-3 px-4 py-3">
        {/* assistant turn */}
        <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2.5">
          <p className="text-[13px] font-medium leading-snug text-slate-900">{TAP.question}</p>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-600">
            Stacking would allow up to 42% off some baskets. The codes went live at 6am.
          </p>
        </div>

        {/* the user can interrogate before deciding -- this is the affordance
            Slack does not have, and the reason the assistant surface matters */}
        {!asked && !answered && (
          <div className="flex justify-end">
            <button
              onClick={() => setAsked(true)}
              className="max-w-[85%] rounded-2xl rounded-tr-sm bg-teal-700 px-3 py-2 text-left text-[12.5px] text-white active:bg-teal-800"
            >
              What&apos;s our current worst-case discount?
            </button>
          </div>
        )}

        {asked && (
          <>
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-teal-700 px-3 py-2 text-[12.5px] text-white">
                What&apos;s our current worst-case discount?
              </p>
            </div>
            <div className="animate-[fadeIn_.3s_ease-out] rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2.5">
              <p className="text-[12.5px] leading-relaxed text-slate-700">
                Today it caps at 28% — the loyalty tier plus a seasonal code. Stacking BUNDLE on top
                would take it to 42% on roughly 6% of baskets.
              </p>
            </div>
          </>
        )}

        {!answered && (
          <div className="flex flex-wrap gap-1.5">
            {TAP.options.map((o, i) => (
              <button
                key={o}
                onClick={onAnswer}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  i === TAP.chosen && asked
                    ? "border-teal-600 bg-teal-50 text-teal-800"
                    : "border-slate-300 bg-white text-slate-700 active:bg-slate-100"
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        )}

        {answered && (
          <>
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-teal-700 px-3 py-2 text-[12.5px] text-white">
                {TAP.options[TAP.chosen]}
              </p>
            </div>
            <div className="animate-[fadeIn_.3s_ease-out] rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2.5">
              <p className="text-[12.5px] leading-relaxed text-slate-700">
                Recorded — BUNDLE stacks up to a 30% combined cap, decided by you. The margin model and
                the checkout guardrail now read the same number.
              </p>
              <p className="mt-2 rounded bg-white px-2 py-1 text-[10px] text-slate-500">
                ✓ Applied · reviewed by analytics engineering
              </p>
            </div>
          </>
        )}
      </div>

      <div className="mt-2 border-t border-slate-200 px-4 py-2.5">
        <div className="rounded-full border border-slate-300 px-3 py-1.5 text-[11px] text-slate-400">
          Reply to Claude
        </div>
      </div>
    </div>
  );
}
