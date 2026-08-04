import { Journey } from "@/components/journey";
import { Values } from "@/components/values";
import { ApproachMatrix, DriftChart, GapDiagram } from "@/components/visuals";
import { PRICING_PRINCIPLE, TIERS } from "@/lib/tiers";
import { href } from "@/lib/href";

/**
 * The Tap AI homepage.
 *
 * STRUCTURE. The journey is the page. It gets the most real estate by a wide
 * margin, because the fastest way to explain this product is to let someone
 * experience one decision end to end: a relatable trigger, one tap, and the
 * outcome — including what they just contributed that they could not before.
 *
 * The mechanics moved to /how-it-works. The seven-dimension anatomy and the
 * agent-facing record format are good arguments for the second conversation, and
 * they were burying the first one.
 *
 * MOBILE. Everything is sized to fit inside 360px with no horizontal scroll.
 * That constraint killed the comparison table (now scorecards) and shrank the
 * flow rail. Desktop is the same layout with more air, not a different one.
 *
 * EDITORIAL. The subject is the opportunity of operationalizing business context.
 * Nobody in the story is at fault — the experts have context and no way to
 * contribute it, the engineers build the best thing available from what they
 * know. What is missing is a channel.
 */

function Section({
  id,
  tone = "light",
  children,
}: {
  id?: string;
  tone?: "light" | "tint" | "dark";
  children: React.ReactNode;
}) {
  const bg =
    tone === "dark" ? "bg-slate-950" : tone === "tint" ? "bg-slate-50 border-y border-slate-200" : "bg-white";
  return (
    <section id={id} className={`scroll-mt-16 ${bg}`}>
      <div className="mx-auto max-w-[1180px] px-5 py-12 sm:px-6 sm:py-14">{children}</div>
    </section>
  );
}

function Head({
  kicker,
  title,
  lede,
  dark = false,
}: {
  kicker: string;
  title: string;
  lede?: string;
  dark?: boolean;
}) {
  return (
    <div className="mb-6 max-w-2xl sm:mb-8">
      <p className={`text-[11px] font-bold uppercase tracking-wider ${dark ? "text-teal-300" : "text-teal-700"}`}>
        {kicker}
      </p>
      <h2
        className={`mt-2 text-[1.45rem] font-semibold leading-[1.15] tracking-[-0.025em] sm:text-[1.9rem] ${
          dark ? "text-white" : "text-slate-900"
        }`}
      >
        {title}
      </h2>
      {lede && (
        <p className={`mt-3 text-[14px] leading-relaxed sm:text-[14.5px] ${dark ? "text-slate-300" : "text-slate-600"}`}>
          {lede}
        </p>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* ============================================== hero — deliberately short
          The old hero competed with the journey for attention. Now it exists only
          to frame it: one claim, three chips, and straight into the experience. */}
      <div className="relative overflow-hidden bg-slate-950">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-[26rem] w-[60rem] -translate-x-1/2 rounded-full opacity-35 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(13,148,136,.55), rgba(124,58,237,.18), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-[1180px] px-5 pb-7 pt-8 sm:px-6 sm:pb-9 sm:pt-11">
          <div className="mb-3.5 flex flex-wrap gap-1.5">
            {[
              ["Lightweight", "text-amber-300 ring-amber-400/25 bg-amber-400/10"],
              ["Governed", "text-sky-300 ring-sky-400/25 bg-sky-400/10"],
              ["Active", "text-teal-300 ring-teal-400/25 bg-teal-400/10"],
            ].map(([label, cls]) => (
              <span
                key={label}
                className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider ring-1 ring-inset ${cls}`}
              >
                {label}
              </span>
            ))}
          </div>

          <h1 className="max-w-[22rem] text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] text-white sm:max-w-none sm:text-[2.6rem] lg:text-[2.9rem]">
            Put your experts&apos; knowledge to work.
          </h1>
          <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-slate-300 sm:text-[15px]">
            The people who understand your business already know the answers. That knowledge just has
            no way to reach the systems that depend on it — so Tap AI turns it into one question they
            can answer in seconds.
          </p>
          <p className="mt-4 text-[12.5px] font-medium text-teal-300">
            ↓ Pick who you are and walk through one decision
          </p>
        </div>
      </div>

      {/* ============================================================== journey
          The main event. Full-bleed dark so it reads as an experience rather than
          a section, and given more vertical room than everything else combined. */}
      <div id="flow" className="scroll-mt-16 bg-slate-950">
        <div className="mx-auto max-w-[46rem] px-5 pb-14 pt-2 sm:px-6 sm:pb-20">
          <Journey />
        </div>
      </div>

      {/* =============================================================== values */}
      <Section id="values" tone="dark">
        <Head
          dark
          kicker="Why it works"
          title="Three things have to be true at once"
          lede="Easy enough that a busy expert answers. Safe enough that letting them is not a risk. Active enough that it changes a decision. Miss one and the whole thing fails."
        />
        <Values />
      </Section>

      {/* ================================================================== gap */}
      <Section id="gap">
        <Head
          kicker="The opportunity"
          title="Two groups each hold half of the same picture"
          lede="Your experts know what the business means. Your engineers know how to build it. Neither has a practical way to hand their half to the other."
        />
        <GapDiagram />
      </Section>

      {/* ================================================================= cost */}
      <Section tone="tint">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12">
          <div>
            <Head
              kicker="What the gap costs"
              title="Nothing breaks, which is why it persists"
              lede="No outage, no alert, no red dashboard. Just definitions nobody had a moment to decide on."
            />
            <div className="space-y-2">
              {[
                ["Definitions drift apart", "Two reasonable choices, eighteen months apart."],
                ["Rework, not errors", "The cost is rebuilding what was already built."],
                ["Knowledge walks out", "The person who knew why left. The rule still runs."],
                ["AI raises the stakes", "Agents inherit every unresolved assumption."],
              ].map(([t, b]) => (
                <div key={t} className="flex gap-2.5 rounded-lg bg-white px-3.5 py-2.5 ring-1 ring-slate-200">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <p className="text-[12.5px] leading-relaxed">
                    <span className="font-semibold text-slate-900">{t}.</span>{" "}
                    <span className="text-slate-600">{b}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
          <DriftChart />
        </div>
      </Section>

      {/* ========================================================= alternatives */}
      <Section id="alternatives">
        <Head
          kicker="Active, not passive"
          title="Every obvious approach asks for more than a busy expert will give"
          lede="You have probably tried two of these. They are not bad products — each needs the expert to come to the tool, keep something current, or wait for someone to notice a chart."
        />
        <ApproachMatrix />
      </Section>

      {/* ============================================================== pricing */}
      <Section id="pricing" tone="tint">
        <Head
          kicker="Pricing"
          title="Priced on how much you govern, not how often we interrupt"
          lede={PRICING_PRINCIPLE.body}
        />
        <div className="grid gap-3.5 lg:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`flex flex-col rounded-xl p-4 sm:p-5 ${
                t.highlight ? "bg-slate-900 ring-2 ring-teal-500" : "border border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className={`text-[17px] font-semibold ${t.highlight ? "text-white" : "text-slate-900"}`}>
                  {t.name}
                </h3>
                {t.highlight && (
                  <span className="shrink-0 rounded-full bg-teal-500 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-slate-900">
                    most teams
                  </span>
                )}
              </div>
              <p className={`mt-0.5 text-[12px] ${t.highlight ? "text-slate-400" : "text-slate-500"}`}>
                {t.tagline}
              </p>
              <p className="mt-3.5 flex items-baseline gap-1.5">
                <span className={`text-[22px] font-semibold ${t.highlight ? "text-white" : "text-slate-900"}`}>
                  {t.price}
                </span>
                <span className={`text-[11.5px] ${t.highlight ? "text-slate-400" : "text-slate-500"}`}>
                  {t.cadence}
                </span>
              </p>
              <dl
                className="mt-3.5 space-y-1.5 border-t pt-3.5 text-[12px]"
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
              <div className="mt-3.5 flex-1" />
              <p
                className={`rounded-lg px-3 py-2 text-center text-[11.5px] font-semibold ${
                  t.highlight ? "bg-white text-slate-900" : "bg-slate-100 text-slate-700"
                }`}
              >
                Questions: unlimited
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3.5 rounded-lg border-l-2 border-teal-600 bg-white px-4 py-3 text-[12.5px] leading-relaxed text-slate-700">
          <strong className="text-slate-900">{PRICING_PRINCIPLE.headline}</strong> Every tap carries
          a &ldquo;was this worth asking?&rdquo; rating, and a question type that falls below the bar
          gets paused — by us. Aligning our revenue against noise is the only credible way to promise
          we will not create any.
        </p>
      </Section>

      {/* ================================================================== cta */}
      <Section id="cta" tone="dark">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-800 via-slate-900 to-slate-900 px-5 py-9 ring-1 ring-inset ring-white/10 sm:px-10 sm:py-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(closest-side, rgba(45,212,191,.6), transparent)" }}
          />
          <div className="relative max-w-2xl">
            <h2 className="text-[1.5rem] font-semibold leading-[1.1] tracking-[-0.025em] text-white sm:text-[2.25rem]">
              Include the subject-matter experts at your company.
            </h2>
            <p className="mt-3.5 text-[14px] leading-relaxed text-slate-300 sm:text-[15px]">
              They already have the answers. Give them a way to contribute that takes five seconds,
              and give your engineers decisions to build against instead of assumptions to make.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <a
                href="mailto:hello@tap-ai.dev?subject=Tap%20AI"
                className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900"
              >
                Get in touch
              </a>
              <a
                href={href("/how-it-works/")}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-white ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/5"
              >
                How it works
              </a>
            </div>
          </div>
        </div>

        <footer className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-6 text-[11px] text-slate-500">
          <span className="flex items-center gap-2">
            <span className="flex h-4 w-4 items-center justify-center rounded bg-teal-700 text-[9px] font-bold text-white">
              T
            </span>
            Tap AI
          </span>
          <span>Scenarios are illustrative. Slack, SSO and assistant delivery are simulated.</span>
        </footer>
      </Section>
    </>
  );
}
