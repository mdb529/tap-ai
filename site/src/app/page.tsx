import { Journey } from "@/components/journey";
import { Opportunity } from "@/components/opportunity";
import { Values } from "@/components/values";
import { Reveal } from "@/components/reveal";
import { PRICING_PRINCIPLE, TIERS } from "@/lib/tiers";
import { href } from "@/lib/href";

/**
 * The Tap AI homepage.
 *
 * ORDER IS THE ARGUMENT:
 *   1. hero        one claim, one button
 *   2. opportunity why now — AI removed the barrier, but contributions still
 *                  are not actionable. This has to land before the mechanics.
 *   3. journey     experience one decision: trigger → tap → outcome
 *   4. values      lightweight / governed / active, each backed by mechanisms
 *   5. pricing
 *   6. cta
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
              A tap is not an alert — it is a{" "}
              <strong className="font-semibold text-white">contribution</strong>. Each one settles a
              question your systems were about to guess at, and settled questions compound: fewer
              competing definitions, less reconciliation, less rework, and numbers your teams stop
              arguing about.
            </p>

            <div className="mt-6 grid gap-2.5 text-left sm:grid-cols-3">
              {[
                ["Every tap is a contribution", "Not a notification to clear — a decision that lands in your systems."],
                ["Contributions compound", "Definitions stop drifting, so the rework they cause stops too."],
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

      {/* ============================================================= pricing */}
      <section id="pricing" className="scroll-mt-16 border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-6 sm:py-20">
          <Reveal className="mx-auto mb-9 max-w-2xl text-center">
            <h2 className="text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.03em] text-slate-900 sm:text-[2.5rem]">
              Never priced per question.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-600 sm:text-[16px]">
              {PRICING_PRINCIPLE.body}
            </p>
          </Reveal>

          <div className="grid gap-3.5 lg:grid-cols-3">
            {TIERS.map((t, k) => (
              <Reveal key={t.name} delay={k * 90}>
                <div
                  className={`flex h-full flex-col rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-0.5 sm:p-6 ${
                    t.highlight ? "bg-slate-900 ring-2 ring-teal-500" : "border border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className={`text-[19px] font-semibold ${t.highlight ? "text-white" : "text-slate-900"}`}>
                      {t.name}
                    </h3>
                    {t.highlight && (
                      <span className="shrink-0 rounded-full bg-teal-500 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-slate-900">
                        most teams
                      </span>
                    )}
                  </div>
                  <p className={`mt-1 text-[12.5px] ${t.highlight ? "text-slate-400" : "text-slate-500"}`}>
                    {t.tagline}
                  </p>
                  <p className="mt-4 flex items-baseline gap-1.5">
                    <span className={`text-[26px] font-semibold ${t.highlight ? "text-white" : "text-slate-900"}`}>
                      {t.price}
                    </span>
                    <span className={`text-[12px] ${t.highlight ? "text-slate-400" : "text-slate-500"}`}>
                      {t.cadence}
                    </span>
                  </p>
                  <dl
                    className="mt-4 space-y-1.5 border-t pt-4 text-[12px]"
                    style={{ borderColor: t.highlight ? "rgba(255,255,255,.12)" : "#e2e8f0" }}
                  >
                    {t.gates.map((g) => (
                      <div key={g.label} className="flex items-baseline justify-between gap-2">
                        <dt className={`shrink-0 ${t.highlight ? "text-slate-400" : "text-slate-500"}`}>
                          {g.label}
                        </dt>
                        <dd
                          className={`text-right font-medium ${
                            g.absent
                              ? t.highlight
                                ? "text-slate-600"
                                : "text-slate-300"
                              : g.strong
                                ? "text-teal-500"
                                : t.highlight
                                  ? "text-slate-100"
                                  : "text-slate-800"
                          }`}
                        >
                          {g.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-4 flex-1" />
                  <p
                    className={`rounded-xl px-3 py-2.5 text-center text-[12px] font-semibold ${
                      t.highlight ? "bg-white text-slate-900" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    Questions: unlimited
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
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
            <span>Scenarios are illustrative. Slack, SSO and assistant delivery are simulated.</span>
            <a href={href("/how-it-works/")} className="hover:text-slate-300">
              How it works →
            </a>
          </footer>
        </div>
      </section>
    </>
  );
}
