import { Walkthrough } from "@/components/walkthrough";
import { Values } from "@/components/values";
import { TapAnatomy } from "@/components/tap-anatomy";
import { AiLedger } from "@/components/ai-ledger";
import { MobileSurfaces } from "@/components/mobile-surfaces";
import { ApproachMatrix, DriftChart, GapDiagram } from "@/components/visuals";
import { PRICING_PRINCIPLE, TIERS } from "@/lib/tiers";

/**
 * The Tap AI site. One page, fully static, no data layer.
 *
 * THE SPINE is the three values, and every section below is evidence for one of
 * them:
 *   Lightweight  -> the walkthrough, the phone surfaces, the anatomy
 *   Governed     -> the flow's review stage, the anatomy, the decision ledger
 *   Active       -> the gap diagram, the drift chart, the comparison matrix
 *
 * EDITORIAL STANCE. The subject is the opportunity of operationalizing business
 * context, not a complaint about engineers. Nobody in the story is doing
 * anything wrong: the experts have context and no way to contribute it, the
 * engineers build the best thing available from what they know. What is missing
 * is a channel between them.
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
      <div className="mx-auto max-w-[1180px] px-5 py-12 sm:px-6 sm:py-14 lg:py-18">{children}</div>
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
    <div className="mb-7 max-w-2xl sm:mb-8">
      <p className={`text-[11px] font-bold uppercase tracking-wider ${dark ? "text-teal-300" : "text-teal-700"}`}>
        {kicker}
      </p>
      <h2
        className={`mt-2 text-[1.5rem] font-semibold leading-[1.15] tracking-[-0.025em] sm:text-[1.9rem] lg:text-[2.1rem] ${
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

const VALUE_CHIPS = [
  ["Lightweight", "text-amber-300 ring-amber-400/25 bg-amber-400/10"],
  ["Governed", "text-sky-300 ring-sky-400/25 bg-sky-400/10"],
  ["Active", "text-teal-300 ring-teal-400/25 bg-teal-400/10"],
];

export default function Home() {
  return (
    <>
      {/* ================================================================ hero */}
      <div className="relative overflow-hidden bg-slate-950">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[34rem] w-[70rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(13,148,136,.55), rgba(124,58,237,.2), transparent)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <div className="relative mx-auto max-w-[1180px] px-5 sm:px-6">
          <div className="grid items-start gap-9 pb-12 pt-9 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-12 lg:pb-20 lg:pt-12">
            <div className="animate-[riseIn_.5s_ease-out]">
              <div className="mb-4 flex flex-wrap gap-1.5">
                {VALUE_CHIPS.map(([label, cls]) => (
                  <span
                    key={label}
                    className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider ring-1 ring-inset ${cls}`}
                  >
                    {label}
                  </span>
                ))}
              </div>

              <h1 className="text-[2.05rem] font-semibold leading-[1.05] tracking-[-0.035em] text-white sm:text-[2.7rem] lg:text-[3rem]">
                Put your experts&apos;
                <br />
                knowledge to work.
              </h1>
              <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-slate-300 sm:mt-5 sm:text-[15px]">
                The people who understand your business already know the answers — what counts as
                revenue, which claims are appealable, when a contract is evergreen. That knowledge
                just has no way to reach the systems that depend on it.
              </p>
              <p className="mt-3.5 max-w-md text-[14.5px] leading-relaxed text-slate-400 sm:text-[15px]">
                Tap AI turns it into one question they can answer in seconds, and hands your
                engineers an explicit decision to build against.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <a
                  href="#flow"
                  className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-black/20 transition-transform hover:-translate-y-px"
                >
                  See it work
                </a>
                <a
                  href="#values"
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-white ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/5"
                >
                  Why it works
                </a>
              </div>

              <dl className="mt-8 grid max-w-sm grid-cols-3 gap-px overflow-hidden rounded-xl bg-white/10">
                {[
                  ["31s", "median answer"],
                  ["1 tap", "to contribute"],
                  ["0", "new tools to learn"],
                ].map(([v, l]) => (
                  <div key={l} className="bg-slate-950/60 px-2.5 py-3 backdrop-blur sm:px-3">
                    <dd className="text-[17px] font-semibold tracking-tight text-white sm:text-lg">{v}</dd>
                    <dt className="mt-0.5 text-[10px] leading-tight text-slate-400 sm:text-[10.5px]">{l}</dt>
                  </div>
                ))}
              </dl>
            </div>

            <div id="flow" className="scroll-mt-20 animate-[riseIn_.6s_ease-out]">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[13px] font-medium text-white">
                  Pick an industry and a decision type.
                </p>
                <p className="text-[11px] text-slate-400">18 scenarios</p>
              </div>
              <Walkthrough />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== values */}
      <Section id="values" tone="dark">
        <Head
          dark
          kicker="Why it works"
          title="Three things have to be true at once"
          lede="Easy enough that a busy expert answers. Safe enough that letting them is not a risk. Active enough that it actually changes a decision. Miss any one and the whole thing fails."
        />
        <Values />
      </Section>

      {/* ============================================================ surfaces */}
      <Section id="surfaces" tone="tint">
        <Head
          kicker="Lightweight"
          title="It reaches them in the app they already have open"
          lede="No login, no dashboard, no training. The same question renders as a Slack message with buttons or as a conversation in Claude — whichever fits the person."
        />
        <div className="rounded-2xl bg-slate-950 px-5 py-8 sm:px-8">
          <MobileSurfaces />
        </div>
      </Section>

      {/* ================================================================= gap */}
      <Section id="gap">
        <Head
          kicker="The opportunity"
          title="Two groups each hold half of the same picture"
          lede="Your experts know what the business means. Your engineers know how to build it. Neither has a practical way to hand their half to the other — and closing that is the whole opportunity."
        />
        <GapDiagram />
      </Section>

      {/* ================================================================ cost */}
      <Section tone="tint">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12">
          <div>
            <Head
              kicker="What the gap costs"
              title="Nothing breaks, which is why it persists"
              lede="No outage. No alert. No red dashboard. Just definitions nobody had a moment to decide on, and the reconciliation work that follows."
            />
            <div className="space-y-2.5">
              {[
                ["Definitions drift apart", "Two reasonable choices, made eighteen months apart."],
                ["Rework, not errors", "The cost isn't a wrong number. It's rebuilding what was already built."],
                ["Knowledge walks out", "The person who knew why left in 2024. The rule is still running."],
                ["AI raises the stakes", "Agents write far more code, and inherit every unresolved assumption."],
              ].map(([t, b]) => (
                <div key={t} className="flex gap-3 rounded-lg bg-white px-3.5 py-2.5 ring-1 ring-slate-200">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <p className="text-[13px] leading-relaxed">
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

      {/* ======================================================== alternatives */}
      <Section id="alternatives">
        <Head
          kicker="Active, not passive"
          title="Every obvious approach asks for more than a busy expert will give"
          lede="You have probably tried two of these. They are not bad products — they each need the expert to come to the tool, keep something up to date, or wait for someone to notice a chart."
        />
        <ApproachMatrix />
      </Section>

      {/* ============================================================= anatomy */}
      <Section id="anatomy" tone="tint">
        <Head
          kicker="Governed"
          title="One primitive, seven dimensions"
          lede="A tap is a configured object, not a notification. Its class decides who may answer, how long they have, whether an engineer reviews it, and where the answer lands."
        />
        <TapAnatomy />
      </Section>

      {/* ============================================================== agents */}
      <Section id="agents" tone="dark">
        <Head
          dark
          kicker="Optimized for AI agents"
          title="Your experts' answers become a corpus your agents can read"
          lede="Taps solve a human problem today. The decision ledger they build solves a machine one — and it is the asset that compounds as adoption grows."
        />
        <AiLedger />
      </Section>

      {/* ============================================================= pricing */}
      <Section id="pricing">
        <Head
          kicker="Pricing"
          title="Priced on how much you govern, not how often we interrupt"
          lede={PRICING_PRINCIPLE.body}
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`flex flex-col rounded-xl p-5 ${
                t.highlight
                  ? "bg-slate-900 ring-2 ring-teal-500"
                  : "border border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className={`text-lg font-semibold ${t.highlight ? "text-white" : "text-slate-900"}`}>
                  {t.name}
                </h3>
                {t.highlight && (
                  <span className="rounded-full bg-teal-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-900">
                    most teams
                  </span>
                )}
              </div>
              <p className={`mt-0.5 text-[12.5px] ${t.highlight ? "text-slate-400" : "text-slate-500"}`}>
                {t.tagline}
              </p>
              <p className="mt-4 flex items-baseline gap-1.5">
                <span className={`text-2xl font-semibold ${t.highlight ? "text-white" : "text-slate-900"}`}>
                  {t.price}
                </span>
                <span className={`text-[12px] ${t.highlight ? "text-slate-400" : "text-slate-500"}`}>
                  {t.cadence}
                </span>
              </p>
              <dl className="mt-4 space-y-2 border-t pt-4 text-[12.5px]"
                  style={{ borderColor: t.highlight ? "rgba(255,255,255,.12)" : "#e2e8f0" }}>
                {t.gates.map((g) => (
                  <div key={g.label} className="flex items-baseline justify-between gap-3">
                    <dt className={t.highlight ? "text-slate-400" : "text-slate-500"}>{g.label}</dt>
                    <dd
                      className={`text-right font-medium ${
                        g.absent
                          ? t.highlight ? "text-slate-600" : "text-slate-300"
                          : g.strong
                            ? "text-teal-500"
                            : t.highlight ? "text-slate-100" : "text-slate-800"
                      }`}
                    >
                      {g.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex-1" />
              <p
                className={`rounded-lg px-3 py-2 text-center text-[12px] font-semibold ${
                  t.highlight ? "bg-white text-slate-900" : "bg-slate-100 text-slate-700"
                }`}
              >
                Questions: unlimited
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-lg border-l-2 border-teal-600 bg-teal-50/70 px-4 py-3 text-[13px] leading-relaxed text-teal-950/90">
          <strong>{PRICING_PRINCIPLE.headline}</strong> Every tap also carries a &ldquo;was this worth
          asking?&rdquo; rating, and a question type that falls below the bar gets paused — by us.
          Aligning our revenue against noise is the only credible way to promise we will not create
          any.
        </p>
      </Section>

      {/* ================================================================= cta */}
      <Section id="cta" tone="dark">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-800 via-slate-900 to-slate-900 px-6 py-10 ring-1 ring-inset ring-white/10 sm:px-12 sm:py-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(closest-side, rgba(45,212,191,.6), transparent)" }}
          />
          <div className="relative max-w-2xl">
            <h2 className="text-[1.6rem] font-semibold tracking-[-0.025em] text-white sm:text-4xl">
              Include the subject-matter experts at your company.
            </h2>
            <p className="mt-4 text-[14.5px] leading-relaxed text-slate-300 sm:text-[15px]">
              They already have the answers. Give them a way to contribute that takes five seconds,
              and give your engineers decisions to build against instead of assumptions to make.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <a
                href="mailto:hello@tap-ai.dev?subject=Tap%20AI"
                className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition-transform hover:-translate-y-px"
              >
                Get in touch
              </a>
              <a
                href="#flow"
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-white ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/5"
              >
                Replay the walkthrough
              </a>
            </div>
          </div>
        </div>

        <footer className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-[11px] text-slate-500">
          <span className="flex items-center gap-2">
            <span className="flex h-4 w-4 items-center justify-center rounded bg-teal-700 text-[9px] font-bold text-white">
              T
            </span>
            Tap AI
          </span>
          <span>Scenarios are illustrative. Slack, SSO, and assistant delivery are simulated.</span>
        </footer>
      </Section>
    </>
  );
}
