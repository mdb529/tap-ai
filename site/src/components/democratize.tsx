"use client";

/**
 * DEMOCRATIZATION — the queue, before and after.
 *
 * The editorial line matters here and the tone audit enforces it: nobody in this
 * story is doing anything wrong. Routing every context change through engineering
 * is not a failure of engineers, it is the only channel that ever existed. The
 * argument is about the CHANNEL being a bottleneck, not about the people in it —
 * and the payoff is framed as capacity returned to engineers, because they are
 * the ones who lose most to the current arrangement.
 *
 * Deliberately compact: one screen, two columns, no scroll narrative. It is a
 * hinge between the walkthrough and the values, not a destination.
 */

const BEFORE = [
  "Expert notices the rule is wrong",
  "Files a ticket, or mentions it in a meeting",
  "Waits for an engineer with capacity",
  "Engineer reconstructs the context second-hand",
  "Change ships, or the ticket ages out",
];

const AFTER = [
  "Expert is asked the one question they can answer",
  "Answers in seconds, where they already are",
  "Change is drafted, reviewed, and shipped",
];

export function Democratize() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
      {/* ------------------------------------------------------------- before */}
      <div className="rounded-2xl bg-white/[0.03] p-5 ring-1 ring-inset ring-white/10 sm:p-6">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
            One channel
          </span>
          <p className="text-[12px] text-slate-400">5 steps, weeks of latency</p>
        </div>
        <h3 className="mt-3 text-[1.05rem] font-semibold leading-snug tracking-[-0.02em] text-white sm:text-[1.2rem]">
          Every contribution has to become someone&apos;s ticket.
        </h3>

        <ol className="mt-4 space-y-1.5">
          {BEFORE.map((b, i) => (
            <li key={b} className="flex items-start gap-2.5">
              <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/8 text-[9.5px] font-bold text-slate-400">
                {i + 1}
              </span>
              <span className="text-[12.5px] leading-relaxed text-slate-400">{b}</span>
            </li>
          ))}
        </ol>

        <p className="mt-4 border-t border-white/8 pt-3.5 text-[12px] leading-relaxed text-slate-500">
          This is not a failure of anyone in the chain. It is the only channel that has ever
          existed — and it puts engineers in the position of deciding business questions they were
          never the right person to answer.
        </p>
      </div>

      {/* -------------------------------------------------------------- after */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-900/40 to-slate-900 p-5 ring-1 ring-inset ring-teal-400/25 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(45,212,191,.5), transparent)" }}
        />
        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-teal-400/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-200">
              Everyone
            </span>
            <p className="text-[12px] text-teal-200/70">3 steps, seconds of effort</p>
          </div>
          <h3 className="mt-3 text-[1.05rem] font-semibold leading-snug tracking-[-0.02em] text-white sm:text-[1.2rem]">
            The person who knows contributes directly.
          </h3>

          <ol className="mt-4 space-y-1.5">
            {AFTER.map((a, i) => (
              <li key={a} className="flex items-start gap-2.5">
                <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal-400 text-[9.5px] font-bold text-slate-900">
                  {i + 1}
                </span>
                <span className="text-[12.5px] leading-relaxed text-slate-200">{a}</span>
              </li>
            ))}
          </ol>

          <div className="mt-4 rounded-xl bg-white/[0.07] px-3.5 py-3">
            <p className="text-[12px] leading-relaxed text-slate-200">
              <strong className="font-semibold text-white">
                Engineering stops being the bottleneck
              </strong>{" "}
              — and gets the hours back. Review a drafted change in a minute instead of
              reconstructing a business rule from scratch, and spend the rest on the backlog that
              actually needs an engineer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
