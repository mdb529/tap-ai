import { Journey } from "@/components/journey";
import { Opportunity } from "@/components/opportunity";
import { Values } from "@/components/values";
import { Democratize } from "@/components/democratize";
import { KnowledgeGraph } from "@/components/knowledge-graph";
import { Roi } from "@/components/roi";
import { TapMatrix } from "@/components/tap-matrix";
import { Pricing } from "@/components/pricing";
import { Reveal } from "@/components/reveal";
import { href } from "@/lib/href";

/**
 * The Tap AI homepage.
 *
 * ORDER IS THE ARGUMENT:
 *   1. hero          one claim, one button
 *   2. opportunity   why now — AI removed the barrier, but contributions still
 *                    are not actionable. This has to land before the mechanics.
 *   3. journey       experience one decision: trigger → tap → outcome
 *   4. democratize   contribution stops routing through a single queue, which
 *                    hands engineering capacity back
 *   5. values        lightweight / governed / active, each backed by mechanisms
 *   6. compounding   the knowledge graph enriching tap by tap, and the AI loop
 *                    that reads from it. This is the "so what" of everything
 *                    above — one answer is a footnote, ten thousand are an asset.
 *   7. roi           what that is worth, with the arithmetic on screen
 *   8. pricing       including the family × class grid, since gating is a
 *                    pricing question
 *   9. cta
 *
 * WHAT WAS CUT, and why: the comparison matrix and the definition-drift chart
 * moved to /how-it-works. Both are good arguments, and both were being read by
 * someone who had not yet decided they cared. Distilling meant deleting things
 * that were individually fine.
 *
 * MOBILE. Sized to fit 360px with no horizontal scroll. Desktop is the same
 * layout with more air, not a different one.
 *
 * EDITORIAL. Nobody in the story is at fault — the experts have context and no
 * way to contribute it, the engineers build the best thing available from what
 * they know. What is missing is a channel.
 */

export default function Home() {
  return (
    <>
      {/* ================================================================ hero */}
      <div className="relative overflow-hidden bg-slate-950">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[68rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(13,148,136,.6), rgba(124,58,237,.2), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-[1180px] px-5 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24">
          <Reveal className="mx-auto max-w-3xl text-center">
            <h1 className="text-[2.35rem] font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:text-[3.4rem] lg:text-[4rem]">
              Put your experts&apos;
              <br />
              knowledge to work.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-[15.5px] leading-relaxed text-slate-300 sm:text-[17px]">
              The people who understand your business already know the answers. Tap AI turns that
              knowledge into one question they can answer in seconds — and a change your systems
              actually act on.
            </p>
            <div className="mt-8 flex flex-col items-center gap-2.5 sm:flex-row sm:justify-center">
              <a
                href="#flow"
                className="w-full rounded-xl bg-white px-6 py-3.5 text-[15px] font-semibold text-slate-900 shadow-xl shadow-black/25 transition-all hover:-translate-y-0.5 hover:shadow-2xl sm:w-auto"
              >
                Try a tap
              </a>
              <a
                href={href("/how-it-works/")}
                className="w-full rounded-xl px-6 py-3.5 text-[15px] font-medium text-white ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/5 sm:w-auto"
              >
                How it works
              </a>
            </div>
          </Reveal>
        </div>
      </div>

      {/* ========================================================= opportunity
          Before the mechanics. "Why now" is the harder sell than "how". */}
      <section id="opportunity" className="scroll-mt-16 border-t border-white/5 bg-slate-950">
        <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-6 sm:py-20 lg:py-24">
          <Opportunity />
        </div>
      </section>

      {/* ============================================================= journey */}
      <section id="flow" className="scroll-mt-16 border-t border-white/5 bg-slate-950">
        <div className="mx-auto max-w-[47rem] px-5 py-16 sm:px-6 sm:py-20">
          {/* Framing before the walkthrough. Three things a visitor needs to
              believe before the mechanics mean anything: a tap is a contribution
              (not an alert), contributions compound into money, and volume is
              bounded by design. */}
          <Reveal className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
              What a tap is
            </p>
            <h2 className="mt-2 text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.03em] text-white sm:text-[2.5rem]">
              One decision, end to end.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-300 sm:text-[16.5px]">
              A tap is a <strong className="font-semibold text-white">contribution</strong>. Each one
              settles a question your systems were about to guess at, and each one stays settled — so
              trusted knowledge grows the way it is actually held: organically, a piece at a time,
              from whoever knows that piece. No migration, no ontology project, no workshop.
            </p>

            <div className="mt-6 grid gap-2.5 text-left sm:grid-cols-3">
              {[
                ["Every tap is a contribution", "Not a notification to clear — a decision that lands in your systems and stays there."],
                ["Knowledge grows bit by bit", "Each answer is one piece. Together they become the layer that says what your business means."],
                ["No alert fatigue", "Every question has a cooldown, a daily ceiling, and quiet hours. Answered once, never re-asked."],
              ].map(([t, b]) => (
                <div
                  key={t}
                  className="rounded-xl bg-white/[0.04] px-4 py-3.5 ring-1 ring-inset ring-white/10"
                >
                  <p className="text-[13px] font-semibold text-white">{t}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-slate-400">{b}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Journey />
        </div>
      </section>

      {/* ======================================================== democratize
          A hinge, not a destination. The walkthrough showed one person answering
          one question; this says what changes when that is true for everybody. */}
      <section id="democratize" className="scroll-mt-16 border-t border-white/5 bg-slate-950">
        <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-6 sm:py-20">
          <Reveal className="mx-auto mb-8 max-w-2xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
              Who gets to contribute
            </p>
            <h2 className="mt-2 text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.03em] text-white sm:text-[2.5rem]">
              Everyone, without a ticket.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-300 sm:text-[16.5px]">
              Changing what your systems believe has always required someone who can write code. That
              makes engineering the only door — and a queue in front of it.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <Democratize />
          </Reveal>
        </div>
      </section>

      {/* ============================================================== values */}
      <section id="values" className="scroll-mt-16 border-t border-white/5 bg-slate-950">
        <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-6 sm:py-20">
          <Reveal className="mx-auto mb-9 max-w-2xl text-center">
            <h2 className="text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.03em] text-white sm:text-[2.5rem]">
              Three things have to be true at once.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-300 sm:text-[16px]">
              Easy enough that a busy expert answers. Safe enough that letting them is not a risk.
              Active enough that it changes a decision. Miss one and the whole thing fails.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <Values />
          </Reveal>
        </div>
      </section>

      {/* ========================================================= compounding
          The "so what" for everything above. One answer is a footnote; the
          accumulation is an asset, and the asset is what AI reads from. */}
      <section id="compounding" className="scroll-mt-16 border-t border-white/5 bg-slate-950">
        <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-6 sm:py-20">
          <Reveal className="mx-auto mb-9 max-w-2xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
              The compounding loop
            </p>
            <h2 className="mt-2 text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.03em] text-white sm:text-[2.5rem]">
              Every tap makes the next answer better.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-300 sm:text-[16.5px]">
              Answers do not just land and stop. They accumulate into the context layer your
              organization never had — and once it exists, AI reads from it instead of guessing.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <KnowledgeGraph />
          </Reveal>
        </div>
      </section>

      {/* ================================================================= roi
          Deliberately austere and arithmetic-forward. See components/roi.tsx —
          the persuasive move is visibly DISCARDING value, not maximising it. */}
      <section id="roi" className="scroll-mt-16 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-6 sm:py-20">
          <Reveal className="mx-auto mb-8 max-w-2xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
              What it is worth
            </p>
            <h2 className="mt-2 text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.03em] text-slate-900 sm:text-[2.5rem]">
              The arithmetic, with nothing hidden.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-600 sm:text-[16px]">
              Engineering hours returned to the backlog, reconciliation meetings that stop happening,
              and stale definitions caught before they reach a decision. Every figure below is
              computed from stated assumptions — and we throw away almost half of it before we claim
              anything.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <Roi />
          </Reveal>
        </div>
      </section>

      {/* ============================================================= pricing
          The family x class grid sits ABOVE the tier cards: "which questions do I
          get" is what a buyer actually wants answered, and the cards alone cannot
          show it, because a tap has two axes rather than one. */}
      <section id="pricing" className="scroll-mt-16 border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-6 sm:py-20">
          <Reveal className="mb-10 sm:mb-12">
            <div className="mx-auto mb-6 max-w-2xl text-center">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                What gets asked
              </p>
              <h3 className="mt-2 text-[1.3rem] font-semibold tracking-[-0.025em] text-slate-900 sm:text-[1.6rem]">
                Two axes: how much it binds, and what it is about.
              </h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-slate-600">
                A tap&apos;s <strong className="font-semibold text-slate-900">class</strong> is how
                much of the company the answer binds. Its{" "}
                <strong className="font-semibold text-slate-900">category</strong> is what the
                question is about. They are independent — retiring an unused metric and settling the
                canonical definition of a metric are the same category and wildly different stakes.
                Pick a plan to see what it unlocks.
              </p>
            </div>
            <TapMatrix />
          </Reveal>

          <Reveal delay={60}>
            <Pricing />
          </Reveal>
        </div>
      </section>

      {/* ================================================================= cta */}
      <section id="cta" className="scroll-mt-16 bg-slate-950">
        <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-800 via-slate-900 to-slate-900 px-6 py-14 text-center ring-1 ring-inset ring-white/10 sm:px-12 sm:py-20">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
                style={{ background: "radial-gradient(closest-side, rgba(45,212,191,.6), transparent)" }}
              />
              <div className="relative mx-auto max-w-2xl">
                <h2 className="text-[1.75rem] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[2.75rem]">
                  Include the subject-matter experts at your company.
                </h2>
                <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-slate-300 sm:text-[16.5px]">
                  They already have the answers. Give them a way to contribute that takes five
                  seconds.
                </p>
                <div className="mt-8 flex flex-col items-center gap-2.5 sm:flex-row sm:justify-center">
                  <a
                    href="mailto:hello@tap-ai.dev?subject=Tap%20AI"
                    className="w-full rounded-xl bg-white px-6 py-3.5 text-[15px] font-semibold text-slate-900 transition-all hover:-translate-y-0.5 hover:shadow-2xl sm:w-auto"
                  >
                    Get in touch
                  </a>
                  <a
                    href="#flow"
                    className="w-full rounded-xl px-6 py-3.5 text-[15px] font-medium text-white ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/5 sm:w-auto"
                  >
                    Replay the walkthrough
                  </a>
                </div>
              </div>
            </div>
          </Reveal>

          <footer className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-white/10 pt-7 text-center text-[11px] text-slate-500">
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="flex h-4 w-4 items-center justify-center rounded bg-teal-700 text-[9px] font-bold text-white"
              >
                T
              </span>
              Tap AI
            </span>
            <span>Scenarios are illustrative. Slack, Claude, SSO and reverse-ETL delivery are simulated.</span>
            <a href={href("/how-it-works/")} className="hover:text-slate-300">
              How it works →
            </a>
          </footer>
        </div>
      </section>
    </>
  );
}
