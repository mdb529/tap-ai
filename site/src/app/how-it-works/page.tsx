import type { Metadata } from "next";
import { Walkthrough } from "@/components/walkthrough";
import { TapAnatomy } from "@/components/tap-anatomy";
import { AiLedger } from "@/components/ai-ledger";
import { MobileSurfaces } from "@/components/mobile-surfaces";
import { ApproachMatrix, DriftChart } from "@/components/visuals";
import { href } from "@/lib/href";

export const metadata: Metadata = {
  title: "How it works — Tap AI",
  description:
    "The six stages behind a tap, the eight dimensions of the tap primitive, and the decision ledger your AI agents can read.",
};

/**
 * The mechanics page.
 *
 * The homepage answers "what is this and why would I care" in three beats. This
 * page answers "but how does it actually work" for the person who needs that
 * before they will believe the first page — usually the engineer or the security
 * reviewer, not the buyer.
 *
 * Keeping them apart is the point. Putting the seven-dimension anatomy and the
 * agent-facing record format on the homepage buried the argument under
 * machinery.
 */

function Section({
  id,
  tone = "dark",
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
      <div className="mx-auto max-w-[1180px] px-5 py-12 sm:px-6 sm:py-14 lg:py-16">{children}</div>
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
        className={`mt-2 text-[1.5rem] font-semibold leading-[1.15] tracking-[-0.025em] sm:text-[1.9rem] ${
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

export default function HowItWorks() {
  return (
    <>
      {/* =============================================================== intro */}
      <div className="bg-slate-950">
        <div className="mx-auto max-w-[1180px] px-5 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-12">
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
            How it works
          </p>
          <h1 className="mt-2 max-w-2xl text-[1.85rem] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[2.5rem]">
            Six stages, one primitive, and a record your agents can read.
          </h1>
          <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-slate-300 sm:text-[15px]">
            The homepage shows what a tap feels like. This is what sits behind it — the mechanics an
            engineer or a security reviewer will want before they believe the rest.
          </p>

          <nav className="mt-6 flex flex-wrap gap-1.5">
            {[
              ["The six stages", "#stages"],
              ["Why not X", "#alternatives"],
              ["Anatomy of a tap", "#anatomy"],
              ["For AI agents", "#agents"],
              ["Delivery surfaces", "#surfaces"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-full px-3 py-1.5 text-[12px] text-slate-300 ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/10 hover:text-white"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* ============================================================== stages */}
      <Section id="stages">
        <Head
          dark
          kicker="End to end"
          title="What happens between the event and the change"
          lede="The tap is the visible middle of a longer chain. Step through any scenario — or hit play and watch the whole thing."
        />
        <Walkthrough />
      </Section>

      {/* ============================================================= anatomy */}
      <Section id="anatomy" tone="tint">
        <Head
          kicker="Governed"
          title="One primitive, eight dimensions"
          lede="A tap is a configured object, not a notification. Its class decides who may answer, how long they have, whether an engineer reviews it, and where the answer lands. Pick a dimension to see the range."
        />
        <TapAnatomy />
      </Section>

      {/* ============================================================== agents */}
      <Section id="agents">
        <Head
          dark
          kicker="Optimized for AI agents"
          title="Every answer lands in a corpus your agents can read"
          lede="Your agents already have your schemas and your lineage. What they lack is any record of what those objects were decided to mean — so they infer intent, confidently."
        />
        <AiLedger />
      </Section>

      {/* ============================================================ surfaces */}
      <Section id="surfaces" tone="tint">
        <Head
          kicker="Lightweight"
          title="The same question, wherever the person already is"
          lede="Slack renders it as a message with buttons. Claude renders it as a conversation you can interrogate first. Same tap, same decision recorded, different affordances."
        />
        <div className="rounded-2xl bg-slate-950 px-4 py-8 sm:px-8">
          <MobileSurfaces />
        </div>
      </Section>

      {/* ======================================================== alternatives
          Moved here from the homepage. A visitor who has read this far has
          decided they care; on the homepage this was being read by someone who
          had not. */}
      <Section id="alternatives">
        <Head
          dark
          kicker="Active, not passive"
          title="Every obvious approach asks for more than a busy expert will give"
          lede="You have probably tried two of these. They are not bad products — each needs the expert to come to the tool, keep something current, or wait for someone to notice a chart."
        />
        <div className="rounded-2xl bg-white p-4 sm:p-6">
          <ApproachMatrix />
        </div>
      </Section>

      {/* ================================================================ cost */}
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

      {/* ================================================================= cta */}
      <Section tone="dark">
        <div className="rounded-2xl bg-gradient-to-br from-teal-800 via-slate-900 to-slate-900 px-6 py-10 ring-1 ring-inset ring-white/10 sm:px-10">
          <h2 className="max-w-xl text-[1.5rem] font-semibold tracking-[-0.02em] text-white sm:text-[2rem]">
            Include the subject-matter experts at your company.
          </h2>
          <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-slate-300">
            They already have the answers. Give them a way to contribute that takes five seconds.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <a
              href="mailto:hello@tap-ai.dev?subject=Tap%20AI"
              className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900"
            >
              Get in touch
            </a>
            <a
              href={href("/")}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-white ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/5"
            >
              Back to the walkthrough
            </a>
          </div>
        </div>
      </Section>
    </>
  );
}
