/**
 * Vertical-specific demo scenarios for the homepage walkthrough.
 *
 * HAND-WRITTEN on purpose. The product's whole claim is that a governance
 * decision can be compressed into one answerable question, and that claim lives
 * or dies on the quality of a single sentence. Template-filling from fixtures
 * produces serviceable prose; a customer-facing page needs better.
 *
 * The STRUCTURE mirrors the specs in tap-types/*.yml: one question, at most
 * three context lines, 2–5 options with an honest opt-out, a declared
 * write-back target. If you change a spec, change the matching scenario.
 *
 * Each scenario carries content for all six stages of the flow, because the
 * point of the walkthrough is that the tap is the visible middle of a longer
 * story — detection before it, a reviewed code change after it.
 *
 * No server-only imports. This file is bundled to the client.
 */

export type TapClass = "tactical" | "operational" | "strategic";

/**
 * The kinds of event that can open a tap. Worth enumerating on the page: the
 * most common objection is "so this is a dbt thing", and the answer is that
 * only one of these six is a code change.
 */
export type EventType =
  | "logic change"
  | "conflicting definitions"
  | "unused metric"
  | "new value"
  | "data anomaly"
  | "record needs judgment";

export const EVENT_COPY: Record<EventType, string> = {
  "logic change": "Someone changed how something is calculated",
  "conflicting definitions": "The same term means different things in different places",
  "unused metric": "Something is maintained that nobody appears to use",
  "new value": "A new category, code or product arrived with nowhere to sit",
  "data anomaly": "A number moved in a way that needs a human to confirm",
  "record needs judgment": "One record needs a call only a person can make",
};
export type WriteBackTarget = "pull_request" | "override_table" | "metadata_patch";

export interface Scenario {
  id: string;
  /** Short tab label within the vertical. One or two words. */
  tab: string;
  tapClass: TapClass;
  /** Matching spec in tap-types/, where one exists. */
  tapTypeId?: string;

  /** ---- stage 1: something needs a decision ---------------------------- */
  detected: {
    /** What KIND of event this was. Deliberately broader than "a code change" --
     *  a metric nobody uses, forty dashboards that disagree, and a deal whose
     *  ARR moved are all valid reasons to ask a human. */
    eventType: EventType;
    /** The event in the business's own words. No file paths, no jargon. This is
     *  the headline a non-technical visitor reads first. */
    signal: string;
    /** Optional technical location. Rendered small, as supporting evidence --
     *  never as the headline. */
    where?: string;
    /** How we noticed. */
    by: string;
  };

  /** ---- stage 2: context assembled ------------------------------------- */
  /** What breaks, who is affected, what is at stake. Max three. */
  implications: string[];
  /** Why this person, in one sentence. */
  routing: string;
  persona: { name: string; title: string; initials: string };
  channel: "Claude" | "Slack" | "Email" | "Teams";

  /** ---- stages 3 & 4: the tap ------------------------------------------ */
  /** The succinct, high-impact form. This is what stays pinned while the visitor
   *  scrolls the three beats, so it has to be readable in one glance and make
   *  sense with no surrounding context. */
  shortQuestion: string;
  /** The full text as it appears inside the tap itself. */
  question: string;
  /** Shown behind a "see the impact" link: what is actually at stake, as one
   *  number and one sentence. The number is the part people repeat. */
  impact: { headline: string; detail: string };
  context: string[];
  options: string[];
  /** Index of the answer the walkthrough plays by default. */
  suggested: number;
  medianSeconds: number;

  /** ---- stage 5: becomes code ------------------------------------------ */
  writeBack: {
    target: WriteBackTarget;
    artifact: string;
    file: string;
    /** A tiny, real-looking diff. Concrete beats abstract here. */
    diff: { sign: "-" | "+" | " "; text: string }[];
    summary: string;
  };

  /** ---- the payoff -----------------------------------------------------
   * One line, second person: what this person just did that they could not do
   * before. The homepage journey ends on this, so it has to be concrete and
   * about THEM rather than about the system. */
  contribution: string;

  /** ---- stage 6: shipped ----------------------------------------------- */
  shipped: {
    reviewer: string;
    checks: string[];
    effect: string;
    facts: { label: string; value: string }[];
  };
}

export interface Vertical {
  id: string;
  label: string;
  /** One line naming the governance problem this industry actually has. */
  blurb: string;
  /** Single-path SVG glyph, 24x24 viewBox. */
  glyph: string;
  /** Exactly one scenario per tap class. The type enforces the promise the
   *  homepage makes: pick any industry, switch class, always get an example. */
  scenarios: Record<TapClass, Scenario>;
}

/* ========================================================================== */

export const VERTICALS: Vertical[] = [
  // -------------------------------------------------------------- saas / b2b
  {
    id: "saas",
    label: "SaaS",
    blurb:
      "Sales, finance and product each carry a piece of what a customer actually is. The dashboards only carry whichever piece got built first.",
    glyph: "M4 17V7a2 2 0 012-2h12a2 2 0 012 2v10M2 21h20M9 21v-4h6v4",
    scenarios: {
      tactical: {
        id: "saas-deal",
        tab: "ARR moved",
        tapClass: "tactical",
        detected: {
          eventType: "data anomaly",
          signal:
            "A closed-won deal's ARR dropped $48k overnight, and nobody can tell whether that was a real downgrade or a data correction.",
          where: "pipeline · ARR moved after close",
          by: "Detected on the nightly snapshot",
        },
        implications: [
          "Closed-won ARR feeds the board number, quota attainment and the commission run.",
          "If it is a correction, three downstream reports are already wrong.",
        ],
        routing:
          "The rep who closed it knows what was actually signed. No amount of history reconstruction beats asking them.",
        persona: { name: "Diego Salas", title: "senior account executive", initials: "DS" },
        channel: "Claude",
        shortQuestion: "Did this deal's ARR really drop $48k?",
        impact: {
          headline: "$48k, unexplained",
          detail:
            "Closed-won ARR feeds the board number, quota attainment and the commission run. Three reports are already downstream of it.",
        },
        question: "Northwind's ARR went from $192k to $144k after close. Is that right?",
        context: ["Changed overnight, 4 days after signature.", "Feeds this quarter's commission run."],
        options: [
          "Yes — they downgraded a tier",
          "Yes — original figure was wrong",
          "No — this looks like an error",
          "Let me check with the customer",
        ],
        suggested: 0,
        medianSeconds: 26,
        writeBack: {
          target: "override_table",
          artifact: "confirmed ARR change · deal NW-4471",
          file: "applied to the revenue record, batched nightly",
          diff: [
            { sign: " ", text: "deal      arr_before   arr_after   reason              confirmed_by" },
            { sign: "+", text: "NW-4471   192,000      144,000     tier downgrade      dsalas" },
          ],
          summary:
            "The rep's five-second confirmation turned an unexplained movement into a labelled, attributable one — before finance had to chase it.",
        },
        contribution:
          "You just explained a number that finance would otherwise have chased you about next week — in the time it took to read the question.",
        shipped: {
          reviewer: "no engineering review needed for a record-level confirmation",
          checks: ["commission run updated", "board figure reconciled", "reason recorded"],
          effect:
            "Finance closed the quarter without a reconciliation thread, and the reason the number moved is attached to the deal permanently.",
          facts: [
            { label: "ARR clarified", value: "$48,000" },
            { label: "Time to answer", value: "26s" },
            { label: "Reconciliation", value: "avoided" },
          ],
        },
      },
      operational: {
        id: "saas-sku",
        tab: "New product",
        tapClass: "operational",
        detected: {
          eventType: "new value",
          signal:
            "A new usage-based product line launched with no revenue category, so it is being left out of ARR entirely.",
          where: "product catalog · revenue category unset",
          by: "Product launch · 3 days ago",
        },
        implications: [
          "Uncategorized products are excluded from ARR, net revenue retention and cohort reporting.",
          "$310k of bookings has accumulated in three days.",
        ],
        routing:
          "Revenue Operations owns how products roll up. Engineering can wire any answer but should not choose one.",
        persona: { name: "Aisha Bello", title: "revenue operations manager", initials: "AB" },
        channel: "Claude",
        shortQuestion: "Does usage-based revenue count toward ARR?",
        impact: {
          headline: "$310k excluded from ARR",
          detail:
            "Three days of bookings on a new product line sit outside ARR, retention cohorts and every revenue report.",
        },
        question: "How should the new usage-based tier count toward ARR?",
        context: ["$310k in bookings so far.", "Excluded from ARR until categorized."],
        options: [
          "Recurring — include at committed minimum",
          "Recurring — include at trailing run rate",
          "Usage — exclude from ARR",
          "Needs a finance decision",
        ],
        suggested: 0,
        medianSeconds: 112,
        writeBack: {
          target: "metadata_patch",
          artifact: "revenue category rule · usage tier",
          file: "product-to-revenue mapping, reviewed and batched",
          diff: [
            { sign: " ", text: "product_line,revenue_type,arr_basis" },
            { sign: "-", text: "usage_tier_v1,," },
            { sign: "+", text: "usage_tier_v1,recurring,committed_minimum" },
          ],
          summary:
            "One answer set the rule for this product and every future one launched the same way — not a one-off patch on three days of bookings.",
        },
        contribution:
          "You just set the ARR rule for this product and every future one launched the same way, without writing a spec.",
        shipped: {
          reviewer: "Priya Raman, analytics engineer",
          checks: ["ARR recalculated", "retention cohorts rebuilt", "rule applies to future launches"],
          effect:
            "The new line shows up in ARR the way RevOps intended, and the next product launch inherits the rule instead of repeating the gap.",
          facts: [
            { label: "Bookings recovered", value: "$310,000" },
            { label: "Rule scope", value: "all future launches" },
            { label: "Reporting gap", value: "closed" },
          ],
        },
      },
      strategic: {
        id: "saas-active",
        tab: "Active customer",
        tapClass: "strategic",
        detected: {
          eventType: "conflicting definitions",
          signal:
            "41 dashboards compute 'active customer' three different ways, so board reporting, churn and expansion all disagree.",
          where: "41 dashboards · 3 definitions",
          by: "Found by a usage audit across the BI layer",
        },
        implications: [
          "Churn rate differs by 4.2 points depending on which definition a report happens to use.",
          "The board deck and the customer success dashboard have never matched.",
          "Every team believes their own number is the real one.",
        ],
        routing:
          "This is a company decision, not a reporting preference. It needs someone who can settle it for everyone.",
        persona: { name: "Elena Whitfield", title: "chief operating officer", initials: "EW" },
        channel: "Claude",
        shortQuestion: "What is the canonical definition of 'active customer'?",
        impact: {
          headline: "41 dashboards, 3 definitions",
          detail:
            "Churn differs by 4.2 points depending on which definition a report happens to use. The board deck and the customer success dashboard have never matched.",
        },
        question: "What makes a customer 'active'? Three definitions are in use today.",
        context: [
          "Churn differs by 4.2 points depending which one is used.",
          "41 dashboards affected; the board deck uses the oldest.",
        ],
        options: [
          "Any login in 30 days",
          "Any billable usage in 30 days",
          "Paid and not in cancellation",
          "Convene the leadership team",
        ],
        suggested: 1,
        medianSeconds: 620,
        writeBack: {
          target: "pull_request",
          artifact: "definition of record · active_customer",
          file: "the shared metric definition all 41 dashboards read from",
          diff: [
            { sign: " ", text: "  - name: active_customer" },
            { sign: "-", text: "    definition: any login in the last 30 days" },
            { sign: "+", text: "    definition: any billable usage in the last 30 days" },
            { sign: "+", text: "    decided_by: Elena Whitfield, COO" },
            { sign: "+", text: "    supersedes: login_based_v1, paid_status_v1" },
          ],
          summary:
            "Three competing definitions collapsed into one of record, with the two it replaced named explicitly so nobody quietly keeps using them.",
        },
        contribution:
          "You just retired two competing definitions and made one official across 41 dashboards. Before, that took a steering committee.",
        shipped: {
          reviewer: "Hana Yusuf, analytics engineering manager",
          checks: ["41 dashboards repointed", "churn restated", "old definitions deprecated"],
          effect:
            "Every team now reports the same customer count, and the two definitions that lost are marked as retired rather than left lying around.",
          facts: [
            { label: "Dashboards aligned", value: "41" },
            { label: "Churn discrepancy", value: "resolved" },
            { label: "Definitions retired", value: "2" },
          ],
        },
      },
    },
  },
  // ---------------------------------------------------------------- commerce
  {
    id: "commerce",
    label: "E-commerce",
    blurb:
      "Merchandisers and category managers know what a SKU is. The pipeline only knows what column it arrived in.",
    glyph: "M4 7h16l-1.5 12H5.5zM9 7V5a3 3 0 016 0v2",
    scenarios: {
      operational: {
        id: "com-promo",
        tab: "Promo stacking",
        tapClass: "operational",
        detected: {
          eventType: "new value",
          signal:
            "A new promotion family launched at 6am and nobody has said whether it can be combined with loyalty discounts.",
          where: "pricing rules · stacking undefined",
          by: "Promotions service · BUNDLE* codes live",
        },
        implications: [
          "Stacking rules drive the margin calculation and the discount guardrail.",
          "If it stacks, worst-case discount on some baskets reaches 42%.",
        ],
        routing: "Pricing owns discount policy. Engineering can implement either rule but cannot choose one.",
        persona: { name: "Marta Kovac", title: "pricing manager", initials: "MK" },
        channel: "Slack",
        shortQuestion: "Can this promotion stack with loyalty discounts?",
        impact: {
          headline: "42% worst-case discount",
          detail:
            "Without a stacking rule the margin model and the checkout guardrail disagree, so the site can discount further than pricing intends.",
        },
        question: "Should the new BUNDLE promo codes stack with loyalty discounts?",
        context: ["Stacking allows up to 42% off some baskets.", "Live on site since 6am today."],
        options: ["Yes, stack them", "No, highest discount wins", "Stack up to a 30% cap", "Not sure"],
        suggested: 2,
        medianSeconds: 84,
        writeBack: {
          target: "metadata_patch",
          artifact: "acme-shop/analytics #2247",
          file: "seeds/promotion_rules.csv",
          diff: [
            { sign: " ", text: "code_family,stacks_with_loyalty,max_combined_discount" },
            { sign: "-", text: "BUNDLE,," },
            { sign: "+", text: "BUNDLE,true,0.30" },
          ],
          summary:
            "A pricing policy became a rule row rather than a conversation. The margin model and the checkout guardrail now read the same number.",
        },
        contribution:
          "You just set company pricing policy directly in the system that enforces it — previously a Slack thread, a meeting, and a two-week wait.",
        shipped: {
          reviewer: "Elias Garrido, analytics engineer",
          checks: ["margin model rebuilt", "checkout guardrail updated", "cap enforced at 30%"],
          effect:
            "The discount cap is enforced in one place, so pricing policy and what the site actually does cannot drift apart.",
          facts: [
            { label: "Discount cap", value: "30%" },
            { label: "Margin exposure", value: "closed" },
            { label: "Rule scope", value: "all BUNDLE codes" },
          ],
        },
      },
      strategic: {
        id: "com-returns",
        tab: "Returns",
        tapClass: "strategic",
        detected: {
          eventType: "conflicting definitions",
          signal:
            "Finance and Marketing are reporting net revenue 6% apart, because returns are being counted in different months.",
          where: "two revenue definitions in use",
          by: "Detected across 9 reports and 2 teams",
        },
        implications: [
          "Restates every historical month, including periods already reported.",
          "Changes cohort revenue, which changes marketing's payback math.",
          "Two teams currently quote different net revenue numbers because of this.",
        ],
        routing: "Finance owns revenue recognition timing; Marketing consumes it downstream.",
        persona: { name: "Grant Wallace", title: "vice president of finance", initials: "GW" },
        channel: "Slack",
        shortQuestion: "Which month do returns belong to?",
        impact: {
          headline: "6% apart, 18 months running",
          detail:
            "Finance and Marketing report net revenue differently because returns land in different months. Cohort payback math inherits the gap.",
        },
        question: "Should returns be netted against the month of the original order, or the month of the refund?",
        context: [
          "Restates prior reported months either way.",
          "Two teams are quoting different net revenue today.",
        ],
        options: ["Original order month", "Refund month", "Both, as separate metrics"],
        suggested: 0,
        medianSeconds: 74,
        writeBack: {
          target: "pull_request",
          artifact: "acme-shop/analytics #2210",
          file: "models/marts/core/_core_schema.yml",
          diff: [
            { sign: " ", text: "  - name: net_revenue" },
            { sign: "-", text: "    description: Gross revenue less returns, by refund date." },
            { sign: "+", text: "    description: >" },
            { sign: "+", text: "      Gross revenue less returns, attributed to the ORIGINAL order" },
            { sign: "+", text: "      month. Canonical per Finance, 2026-08-04." },
            { sign: "+", text: "    meta: { decided_by: gwallace, decision_ref: TAP-007733 }" },
          ],
          summary:
            "One answer settled a disagreement that had been running between two teams for a quarter — and wrote the resolution down where both of them read from.",
        },
        contribution:
          "You just settled a definition two teams had been quoting differently for a quarter, and it is now the one both of them read from.",
        shipped: {
          reviewer: "Marcus Keller, senior analytics engineer",
          checks: ["18 months restated", "cohort models rebuilt", "marketing payback refreshed"],
          effect:
            "Finance and Marketing now quote the same net revenue figure, and the choice behind it is documented rather than folklore.",
          facts: [
            { label: "Months restated", value: "18" },
            { label: "Competing numbers", value: "resolved to 1" },
            { label: "Rework avoided", value: "~9 hrs" },
          ],
        },
      },
      tactical: {
        id: "com-sku",
        tab: "New SKUs",
        tapClass: "tactical",
        detected: {
          eventType: "new value",
          signal:
            "47 new products went live this morning with no department, so they are invisible in category performance and the reorder model.",
          where: "product catalog · department unassigned",
          by: "Supplier onboarding · Kaiser Outdoor",
        },
        implications: [
          "Unassigned SKUs are invisible in category performance and in the reorder model.",
          "47 SKUs went live on the site this morning.",
        ],
        routing: "Merchandising assigns departments — a five-second call for them, a guess for anyone else.",
        persona: { name: "Lena Berger", title: "senior merchandiser", initials: "LB" },
        channel: "Slack",
        shortQuestion: "Which department do these 47 new products belong to?",
        impact: {
          headline: "47 SKUs, 0 categories",
          detail:
            "Live on the site since 6am and invisible to category performance and the reorder model. Every hour unassigned is an hour of demand nobody is planning for.",
        },
        question: "47 new SKUs from Kaiser Outdoor have no department. Where do insulated bottles belong?",
        context: ["Live on the site since 6am.", "Missing from the reorder model until assigned."],
        options: ["Outdoor & camping", "Kitchen & dining", "Fitness", "Split — I'll review the list"],
        suggested: 0,
        medianSeconds: 38,
        writeBack: {
          target: "override_table",
          artifact: "tap_ai_overrides.sku_department",
          file: "batched nightly · no pull request",
          diff: [
            { sign: " ", text: "supplier            product_class      department" },
            { sign: "+", text: "kaiser_outdoor      insulated_bottle   outdoor_camping" },
          ],
          summary:
            "The rule was written at the product-class level, not per SKU — so the next 200 bottles from that supplier classify themselves.",
        },
        contribution:
          "You just assigned 47 products to a department without opening a spreadsheet, filing a ticket, or waiting for a data team sprint.",
        shipped: {
          reviewer: "not required for tactical taps",
          checks: ["47 SKUs assigned", "reorder model picked them up"],
          effect:
            "Category performance is complete and the reorder model can see inventory it was previously blind to.",
          facts: [
            { label: "SKUs assigned", value: "47" },
            { label: "Future SKUs", value: "auto-classified" },
            { label: "Time to answer", value: "38s" },
          ],
        },
      },
    },
  },

  // -------------------------------------------------------------- healthcare
  {
    id: "healthcare",
    label: "Healthcare",
    blurb:
      "Clinical judgment and reimbursement rules live with clinicians and coders, not with the people writing the models.",
    glyph: "M12 5v14M5 12h14",
    scenarios: {
      operational: {
        id: "hc-pos",
        tab: "Care setting",
        tapClass: "operational",
        detected: {
          eventType: "new value",
          signal:
            "Telehealth visits from the home started arriving under a code nobody has classified, so 1,120 encounters are missing from the census.",
          where: "encounter feed · new visit code",
          by: "Epic Clarity extract",
        },
        implications: [
          "Care setting drives the capacity model and the payer mix report.",
          "1,120 encounters this month are falling into an unmapped bucket.",
        ],
        routing:
          "Clinical Informatics owns the encounter taxonomy — a recurring rule for them, guesswork for anyone else.",
        persona: { name: "Hanna Lindqvist", title: "clinical informatics lead", initials: "HL" },
        channel: "Slack",
        shortQuestion: "Is a telehealth visit from home an outpatient encounter?",
        impact: {
          headline: "1,120 encounters missing",
          detail:
            "Telehealth visits from home are falling outside the census, so capacity planning and payer mix are both understated.",
        },
        question: "Place of service 10 (telehealth in the patient's home) is new. Which care setting?",
        context: ["1,120 encounters affected this month.", "Feeds capacity planning and payer mix."],
        options: ["Outpatient", "Virtual", "Home health", "Exclude from census", "Not sure"],
        suggested: 1,
        medianSeconds: 68,
        writeBack: {
          target: "metadata_patch",
          artifact: "northharbor/analytics #1311",
          file: "seeds/place_of_service_map.csv",
          diff: [
            { sign: " ", text: "pos_code,description,care_setting,counts_in_census" },
            { sign: "-", text: "10,telehealth_home,,false" },
            { sign: "+", text: "10,telehealth_home,virtual,false" },
          ],
          summary:
            "Operational taps write a rule, not a record. One answer maps every past and future encounter on this code, batched into a reviewed patch.",
        },
        contribution:
          "You just brought 1,120 telehealth visits back into the census — a mapping that used to require a ticket nobody prioritized.",
        shipped: {
          reviewer: "Simone Whitaker, analytics engineer",
          checks: ["1,120 encounters remapped", "capacity model refreshed"],
          effect:
            "Virtual visits now appear as their own care setting instead of vanishing from the census.",
          facts: [
            { label: "Encounters mapped", value: "1,120" },
            { label: "Rule scope", value: "all future loads" },
            { label: "Review", value: "batched daily" },
          ],
        },
      },
      strategic: {
        id: "hc-revenue",
        tab: "Revenue definition",
        tapClass: "strategic",
        tapTypeId: "revenue_definition_change",
        detected: {
          eventType: "logic change",
          signal:
            "How net patient revenue is calculated has changed, and 31 reports including the board pack depend on which version is right.",
          where: "revenue metric · definition changed",
          by: "Proposed by the data team, not yet live",
        },
        implications: [
          "31 downstream reports use this metric, including the board pack.",
          "The definition has been stable since March 2024 — this is a break in continuity.",
          "Nobody outside the data team has been asked whether it is correct.",
        ],
        routing: "Finance owns net patient revenue, and only a director or above can rebase a company metric.",
        persona: { name: "Robert Marsh", title: "chief financial officer", initials: "RM" },
        channel: "Slack",
        shortQuestion: "Does net patient revenue include self-pay?",
        impact: {
          headline: "31 reports, board pack included",
          detail:
            "The definition has been stable since March 2024. Changing it without a decision means the board sees a different number than Finance signed off on.",
        },
        question: "Net patient revenue now excludes self-pay accounts. Should that be the official definition?",
        context: [
          "Affects 31 reports, including the board pack.",
          "Current definition in place since March 2024.",
          "Not merged — waiting on you.",
        ],
        options: ["Yes, make it official", "No, revert it", "Needs a finance review"],
        suggested: 0,
        medianSeconds: 32,
        writeBack: {
          target: "pull_request",
          artifact: "northharbor/analytics #1284",
          file: "models/marts/core/_core_schema.yml",
          diff: [
            { sign: " ", text: "metrics:" },
            { sign: " ", text: "  - name: net_patient_revenue" },
            { sign: "-", text: "    description: Recognized net patient service revenue." },
            { sign: "+", text: "    description: >" },
            { sign: "+", text: "      Recognized net patient service revenue, excluding self-pay." },
            { sign: "+", text: "      Canonical as of 2026-08-04." },
            { sign: "+", text: "    meta:" },
            { sign: "+", text: "      decided_by: rmarsh@northharbor.health" },
            { sign: "+", text: "      decision_ref: TAP-004182" },
          ],
          summary:
            "The answer became a commit on the engineer's open pull request — the definition, the decision-maker, and a link back to the tap that produced it.",
        },
        contribution:
          "You just put your name on the definition of net patient revenue, in the same place the code that calculates it lives.",
        shipped: {
          reviewer: "Hana Yusuf, analytics engineering manager",
          checks: ["dbt build passed", "31 downstream models rebuilt", "no contract violations"],
          effect:
            "The board pack now reads from a definition Finance signed off on, and the reason is in version control instead of someone's memory.",
          facts: [
            { label: "Reports unblocked", value: "31" },
            { label: "Engineer time saved", value: "~6.5 hrs" },
            { label: "Decision owner", value: "on record" },
          ],
        },
      },
      tactical: {
        id: "hc-denials",
        tab: "Claim denials",
        tapClass: "tactical",
        tapTypeId: "denial_reason_classification",
        detected: {
          eventType: "record needs judgment",
          signal:
            "24 denied claims are stuck because the payer's reason code does not match any category we track.",
          where: "denials queue · uncategorized",
          by: "Waystar claims feed · nightly",
        },
        implications: [
          "24 claims are sitting unclassified and drop out of the denials dashboard.",
          "Unworked denials past 90 days become write-offs.",
        ],
        routing: "Denials Management owns this taxonomy, and the lead coder is closest to the work.",
        persona: { name: "Yuna Song", title: "lead medical coder", initials: "YS" },
        channel: "Slack",
        shortQuestion: "Which category is this denial?",
        impact: {
          headline: "24 claims, 90-day clock",
          detail:
            "Unclassified denials drop out of the denials dashboard, and unworked denials past 90 days become write-offs.",
        },
        question: "Aetna denied claim CLM0740219 with code CO-197. Which category is this?",
        context: ["$4,180 claim, service date June 12.", "23 more claims are waiting on the same answer."],
        options: [
          "Authorization",
          "Medical necessity",
          "Eligibility",
          "Coding or documentation",
          "Not sure — send to a coder",
        ],
        suggested: 0,
        medianSeconds: 31,
        writeBack: {
          target: "override_table",
          artifact: "tap_ai_overrides.denial_reason_category",
          file: "batched nightly · no pull request",
          diff: [
            { sign: " ", text: "payer          code     category        source" },
            { sign: "+", text: "Aetna          CO-197   authorization   tap TAP-004— ysong" },
          ],
          summary:
            "Routine calls are data, not code. This lands in a governed override table instead of a pull request — no engineer review, no repo noise, and it applies to every matching claim from now on.",
        },
        contribution:
          "You just cleared 24 stuck claims with one answer, and taught the system a rule it will apply on its own from now on.",
        shipped: {
          reviewer: "not required for tactical taps",
          checks: ["applied to 24 open claims", "mapping active for future loads"],
          effect:
            "The denials dashboard is complete again, and the same question will not be asked for another 180 days.",
          facts: [
            { label: "Claims resolved", value: "24" },
            { label: "Engineer review", value: "not required" },
            { label: "Asked again?", value: "no, 180 days" },
          ],
        },
      },
    },
  },

  // ------------------------------------------------------ financial services
  {
    id: "financial",
    label: "Financial services",
    blurb:
      "Regulatory interpretation sits with controllers and risk officers. The metric that reports it sits in a repo they cannot open.",
    glyph: "M3 20h18M6 16V9m6 7V5m6 11v-4",
    scenarios: {
      tactical: {
        id: "fin-counterparty",
        tab: "Counterparty",
        tapClass: "tactical",
        detected: {
          eventType: "record needs judgment",
          signal:
            "$1.4M of incoming wires is sitting unapplied because the sender's trading name does not match any customer on file.",
          where: "treasury suspense account",
          by: "SWIFT intake · 6 transfers",
        },
        implications: [
          "Unmatched wires sit in a suspense account until someone identifies them.",
          "$1.4M is currently unapplied across 6 transfers.",
        ],
        routing:
          "Treasury Operations recognizes trading names on sight. No fuzzy match will resolve this confidently.",
        persona: { name: "Omar Haddad", title: "treasury operations analyst", initials: "OH" },
        channel: "Slack",
        shortQuestion: "Is this wire from an existing customer?",
        impact: {
          headline: "$1.4M unapplied",
          detail:
            "Six wires sit in suspense because the sender's trading name does not match a customer on file. The closest system match scored 0.71.",
        },
        question: "A $340k wire is from “NORTHBRIDGE HLDG LTD”. Is that our customer Northbridge Holdings?",
        context: ["6 wires totalling $1.4M are unapplied.", "Closest system match scored 0.71."],
        options: ["Yes, same entity", "No, different entity", "New customer — create", "Not sure"],
        suggested: 0,
        medianSeconds: 29,
        writeBack: {
          target: "override_table",
          artifact: "tap_ai_overrides.counterparty_alias",
          file: "batched nightly · no pull request",
          diff: [
            { sign: " ", text: "raw_name                 counterparty_id   confirmed_by" },
            { sign: "+", text: "NORTHBRIDGE HLDG LTD     CP-00418          ohaddad" },
          ],
          summary:
            "The alias is now known, so this wire and every future one under that trading name apply automatically.",
        },
        contribution:
          "You just released $340k from suspense before lunch, and the alias will never need identifying again.",
        shipped: {
          reviewer: "not required for tactical taps",
          checks: ["wire applied to CP-00418", "suspense account cleared"],
          effect:
            "$340k left the suspense account the same morning it arrived, and the alias will never need identifying again.",
          facts: [
            { label: "Amount applied", value: "$340,000" },
            { label: "Time to answer", value: "29s" },
            { label: "Future wires", value: "auto-matched" },
          ],
        },
      },
      strategic: {
        id: "fin-bnpl",
        tab: "Delinquency",
        tapClass: "strategic",
        detected: {
          eventType: "logic change",
          signal:
            "A new buy-now-pay-later product is about to move the delinquency rate we report externally by 40 basis points.",
          where: "risk metric · scope changed",
          by: "Ahead of the quarterly filing",
        },
        implications: [
          "Delinquency rate is in the quarterly investor deck and the regulatory filing.",
          "Including BNPL moves the reported rate by an estimated 40 basis points.",
          "The treatment determines whether these balances count as loans at all.",
        ],
        routing: "Only the controller can decide how a product is classified for external reporting.",
        persona: { name: "Dana Whitfield", title: "corporate controller", initials: "DW" },
        channel: "Email",
        shortQuestion: "Do buy-now-pay-later balances count as loans?",
        impact: {
          headline: "40 basis points",
          detail:
            "Including buy-now-pay-later moves the delinquency rate reported in the quarterly filing and the investor deck.",
        },
        question:
          "Should buy-now-pay-later balances count as loans in the delinquency rate we report externally?",
        context: [
          "Would move the reported rate by about 40 bps.",
          "Feeds the investor deck and the quarterly filing.",
        ],
        options: ["Yes, include them", "No, report separately", "Escalate to the audit committee"],
        suggested: 1,
        medianSeconds: 96,
        writeBack: {
          target: "pull_request",
          artifact: "acme-fin/analytics #882",
          file: "models/marts/risk/_risk_schema.yml",
          diff: [
            { sign: " ", text: "metrics:" },
            { sign: " ", text: "  - name: delinquency_rate_30d" },
            { sign: "-", text: "    filter: product_type in ('card','loan','bnpl')" },
            { sign: "+", text: "    filter: product_type in ('card','loan')" },
            { sign: "+", text: "  - name: delinquency_rate_30d_bnpl" },
            { sign: "+", text: "    filter: product_type = 'bnpl'" },
            { sign: "+", text: "    meta: { decided_by: dwhitfield, decision_ref: TAP-009114 }" },
          ],
          summary:
            "The controller said report separately, so the tap produced two metrics instead of one — and the reasoning is attached to the definition.",
        },
        contribution:
          "You just decided how a new product is reported externally — on the record, before the filing, rather than after someone questioned it.",
        shipped: {
          reviewer: "Elias Nakamura, staff analytics engineer",
          checks: ["dbt build passed", "filing extract regenerated", "prior periods restated"],
          effect:
            "The externally reported rate stays comparable quarter over quarter, and BNPL gets its own line rather than quietly moving a headline number.",
          facts: [
            { label: "Reporting error avoided", value: "40 bps" },
            { label: "Metrics created", value: "2" },
            { label: "Audit trail", value: "attributed" },
          ],
        },
      },
      operational: {
        id: "fin-mcc",
        tab: "Merchant codes",
        tapClass: "operational",
        detected: {
          eventType: "new value",
          signal:
            "1,840 card transactions this month landed in 'unclassified' after a new merchant category appeared, and it drives the rewards tier.",
          where: "spend categories · new merchant code",
          by: "Card network settlement file",
        },
        implications: [
          "1,840 transactions fall into an 'unclassified' bucket in customer spend insights.",
          "Spend categories drive the rewards engine, so misclassification is a cash issue.",
        ],
        routing: "Card Operations owns the spend taxonomy; the analyst reviewing the network file is closest.",
        persona: { name: "Omar Haddad", title: "card operations analyst", initials: "OH" },
        channel: "Slack",
        shortQuestion: "Which spend category is this merchant code?",
        impact: {
          headline: "1,840 transactions unclassified",
          detail:
            "Spend categories drive the 3% rewards tier, so a misclassification is a cash issue rather than a reporting one.",
        },
        question: "MCC 5817 (“digital goods”) is new. Which spend category does it belong to?",
        context: ["1,840 transactions affected so far this month.", "Drives the 3% rewards tier."],
        options: ["Entertainment", "Software & subscriptions", "Retail", "Exclude from rewards", "Not sure"],
        suggested: 1,
        medianSeconds: 44,
        writeBack: {
          target: "override_table",
          artifact: "tap_ai_overrides.mcc_spend_category",
          file: "batched nightly · no pull request",
          diff: [
            { sign: " ", text: "mcc    label            spend_category           rewards_tier" },
            { sign: "+", text: "5817   digital goods    software_subscriptions   3%" },
          ],
          summary:
            "One answer classified the backlog and every future transaction on that code, without an engineer touching it.",
        },
        contribution:
          "You just fixed 1,840 miscategorized transactions and the rewards tier that depended on them, from your phone.",
        shipped: {
          reviewer: "not required for operational taps",
          checks: ["1,840 transactions reclassified", "rewards accrual recalculated"],
          effect:
            "Customer spend insights stopped showing an 'unclassified' slice, and the rewards engine pays the right tier.",
          facts: [
            { label: "Transactions fixed", value: "1,840" },
            { label: "Time to answer", value: "44s" },
            { label: "Rewards impact", value: "corrected" },
          ],
        },
      },
    },
  },

  // ------------------------------------------------------------------- legal
  {
    id: "legal",
    label: "Legal",
    blurb:
      "Contract interpretation is the definition of tacit knowledge. It ends up in a spreadsheet nobody syncs, or in one lawyer's head.",
    glyph: "M12 3v18M5 7h14M7 7l-3 7h6zm10 0l-3 7h6z",
    scenarios: {
      tactical: {
        id: "legal-matter",
        tab: "Matter coding",
        tapClass: "tactical",
        detected: {
          eventType: "record needs judgment",
          signal:
            "$86k of outside counsel invoices cannot be accrued because the matter code written on them does not exist.",
          where: "legal spend · unmatched matter",
          by: "e-billing intake · 4 invoices",
        },
        implications: [
          "Uncoded invoices cannot be accrued, so legal spend is understated at close.",
          "$86k across 4 invoices is waiting on a matter.",
        ],
        routing: "Legal Operations knows which matter a firm is actually working. Finance can only guess.",
        persona: { name: "Vera Osei", title: "legal operations manager", initials: "VO" },
        channel: "Slack",
        shortQuestion: "Which matter should this invoice bill to?",
        impact: {
          headline: "$86k unaccrued",
          detail:
            "Four invoices cannot be coded, so legal spend closes understated and the accrual has to be trued up next period.",
        },
        question: "Harlow & Voss invoice 88431 cites matter M-2291, which doesn't exist. Which matter is this?",
        context: ["$86k across 4 invoices is unaccrued.", "Firm's last 3 invoices were matter M-2219."],
        options: ["M-2219 — Delaware filing", "M-2304 — employment", "New matter", "Reject the invoice"],
        suggested: 0,
        medianSeconds: 41,
        writeBack: {
          target: "override_table",
          artifact: "tap_ai_overrides.invoice_matter",
          file: "batched nightly · no pull request",
          diff: [
            { sign: " ", text: "invoice_id   cited_matter   matter_id   confirmed_by" },
            { sign: "+", text: "88431        M-2291         M-2219      vosei" },
          ],
          summary:
            "A record-level correction, recorded against the invoice with the person who made the call.",
        },
        contribution:
          "You just unblocked $86k of accruals with one tap, instead of a back-and-forth with finance at month end.",
        shipped: {
          reviewer: "not required for tactical taps",
          checks: ["invoice coded to M-2219", "accrual posted"],
          effect: "Legal spend closes complete rather than understated, and the correction is attributable.",
          facts: [
            { label: "Spend accrued", value: "$86,000" },
            { label: "Close impact", value: "resolved same day" },
            { label: "Engineer review", value: "not required" },
          ],
        },
      },
      strategic: {
        id: "legal-renewal",
        tab: "Auto-renewal",
        tapClass: "strategic",
        detected: {
          eventType: "conflicting definitions",
          signal:
            "Three contracts signed this week use a renewal clause the obligation tracker cannot classify, and evergreen status changes the reserve.",
          where: "contract taxonomy · unclassified clause",
          by: "Contract intake · 3 new MSAs",
        },
        implications: [
          "Evergreen contracts require a 90-day notice reserve on the balance sheet.",
          "Misclassifying one auto-renewal has produced a surprise renewal twice before.",
          "The tracker feeds both Legal's calendar and Finance's accrual.",
        ],
        routing: "Only Legal can interpret a clause; Finance only consumes the classification.",
        persona: { name: "Priya Raman", title: "deputy general counsel", initials: "PR" },
        channel: "Slack",
        shortQuestion: "Does this renewal clause make the contract evergreen?",
        impact: {
          headline: "3 contracts, 90-day reserve",
          detail:
            "Evergreen status triggers a notice reserve on the balance sheet. Misclassifying one has produced a surprise renewal twice before.",
        },
        question:
          "This MSA renews automatically unless cancelled 60 days out. Does it count as evergreen for the obligation tracker?",
        context: ["3 contracts this week use the same clause.", "Evergreen triggers a notice reserve."],
        options: ["Yes, evergreen", "No, fixed term", "Needs my review of the full contract"],
        suggested: 0,
        medianSeconds: 210,
        writeBack: {
          target: "pull_request",
          artifact: "acme-legal/analytics #341",
          file: "seeds/contract_clause_taxonomy.csv",
          diff: [
            { sign: " ", text: "clause_pattern,classification,notice_days,reserve_required" },
            { sign: "-", text: "auto_renew_60d,unclassified,,false" },
            { sign: "+", text: "auto_renew_60d,evergreen,60,true" },
          ],
          summary:
            "A legal interpretation became a row in a versioned taxonomy — reviewable, diffable, and attributable to the lawyer who made the call.",
        },
        contribution:
          "You just turned a clause interpretation into a versioned rule that Legal's calendar and Finance's reserve both read from.",
        shipped: {
          reviewer: "Simone Whitaker, analytics engineer",
          checks: ["3 contracts reclassified", "notice reserve recalculated", "renewal calendar updated"],
          effect:
            "Legal's renewal calendar and Finance's reserve now agree, because they read the same classification rather than two spreadsheets.",
          facts: [
            { label: "Contracts corrected", value: "3" },
            { label: "Surprise renewals", value: "prevented" },
            { label: "Interpretation", value: "versioned" },
          ],
        },
      },
      operational: {
        id: "legal-retention",
        tab: "Retention",
        tapClass: "operational",
        detected: {
          eventType: "new value",
          signal:
            "A new document type is defaulting to indefinite retention because no schedule was ever set for it.",
          where: "records schedule · unset",
          by: "Document system sync · 412 documents",
        },
        implications: [
          "Documents with no schedule default to indefinite retention, which is its own liability.",
          "412 documents are already in the bucket.",
        ],
        routing: "Records Management owns retention schedules; this is routine for them and guesswork for anyone else.",
        persona: { name: "Rita Santos", title: "records manager", initials: "RS" },
        channel: "Teams",
        shortQuestion: "How long do we retain clinical trial consent?",
        impact: {
          headline: "412 documents, indefinite",
          detail:
            "With no schedule set, documents default to indefinite retention — which is its own liability.",
        },
        question: "New document type “clinical trial consent” has no retention schedule. Which applies?",
        context: ["412 documents already classified this way.", "Currently defaulting to indefinite."],
        options: ["7 years", "10 years", "25 years", "Permanent", "Not sure — escalate to counsel"],
        suggested: 2,
        medianSeconds: 62,
        writeBack: {
          target: "metadata_patch",
          artifact: "acme-legal/analytics #347",
          file: "models/marts/legal/_legal_schema.yml",
          diff: [
            { sign: " ", text: "  - name: dim_document_types" },
            { sign: " ", text: "    meta:" },
            { sign: " ", text: "      retention:" },
            { sign: "+", text: "        clinical_trial_consent: { years: 25, basis: 21CFR312.62 }" },
          ],
          summary:
            "Batched into a metadata patch — light enough not to need a full review cycle, governed enough that it still gets one.",
        },
        contribution:
          "You just set a retention rule with a regulatory citation attached, where before it sat at an indefinite default nobody owned.",
        shipped: {
          reviewer: "Phong Tran, analytics engineer",
          checks: ["412 documents scheduled", "purge job updated"],
          effect:
            "The retention job now has a rule instead of a default, and 412 documents left indefinite limbo.",
          facts: [
            { label: "Documents scheduled", value: "412" },
            { label: "Default avoided", value: "indefinite" },
            { label: "Basis cited", value: "21 CFR 312.62" },
          ],
        },
      },
    },
  },

  // --------------------------------------------------------------- insurance
  {
    id: "insurance",
    label: "Insurance",
    blurb:
      "Actuaries and adjusters carry the judgment that reserves depend on. None of them are going to open a pull request.",
    glyph: "M12 3l8 4v6c0 4-3.5 7-8 8-4.5-1-8-4-8-8V7z",
    scenarios: {
      operational: {
        id: "ins-occupancy",
        tab: "Occupancy class",
        tapClass: "operational",
        detected: {
          eventType: "new value",
          signal:
            "38 quotes are blocked because a new property type arrived with no rating tier.",
          where: "underwriting · unrated occupancy class",
          by: "Policy admin sync",
        },
        implications: [
          "Rating tier drives premium and the reinsurance cession percentage.",
          "38 in-flight quotes are blocked until the class is tiered.",
        ],
        routing: "Underwriting owns rating classification. This is a recurring judgment, not a one-off decision.",
        persona: { name: "Kwame Moreau", title: "underwriting operations manager", initials: "KM" },
        channel: "Teams",
        shortQuestion: "Which rating tier is an indoor vertical farm?",
        impact: {
          headline: "38 quotes blocked",
          detail:
            "Rating tier drives premium and the reinsurance cession percentage, so nothing can be quoted until the class is tiered.",
        },
        question: "New occupancy class “indoor vertical farm” needs a rating tier. Which one?",
        context: ["38 quotes are blocked.", "Closest existing class: greenhouse, tier 3."],
        options: ["Tier 2 — light industrial", "Tier 3 — agricultural", "Tier 4 — high hazard", "Refer to underwriting"],
        suggested: 1,
        medianSeconds: 96,
        writeBack: {
          target: "metadata_patch",
          artifact: "acme-ins/analytics #1502",
          file: "seeds/occupancy_rating.csv",
          diff: [
            { sign: " ", text: "occupancy_class,rating_tier,cession_pct,basis" },
            { sign: "-", text: "indoor_vertical_farm,,," },
            { sign: "+", text: "indoor_vertical_farm,3,0.25,analogous_to_greenhouse" },
          ],
          summary:
            "The tier, the cession, and the reasoning by analogy all landed together — so the next auditor asking why does not need to find Kwame.",
        },
        contribution:
          "You just released 38 blocked quotes and set the rating tier for every future policy of that type.",
        shipped: {
          reviewer: "Devon Palmer, vice president of data",
          checks: ["38 quotes released", "premium recalculated", "cession schedule updated"],
          effect:
            "Quotes went out the same day, priced against a tier an underwriter chose rather than a default nobody owned.",
          facts: [
            { label: "Quotes released", value: "38" },
            { label: "Rating basis", value: "documented" },
            { label: "Rule scope", value: "all future policies" },
          ],
        },
      },
      strategic: {
        id: "ins-cat",
        tab: "Catastrophe",
        tapClass: "strategic",
        detected: {
          eventType: "logic change",
          signal:
            "Reinsurance renewal is three weeks out and which perils belong in the catastrophe model is still unsettled.",
          where: "actuarial model · peril list in debate",
          by: "Raised ahead of renewal negotiations",
        },
        implications: [
          "Cat aggregation drives the reinsurance attachment point and the reserve.",
          "Including severe convective storm raises modeled PML by an estimated 6%.",
          "Reinsurance renewal negotiations start in three weeks.",
        ],
        routing: "The chief actuary owns aggregation methodology — this is a reserve decision, not a code decision.",
        persona: { name: "Adaeze Voss", title: "chief actuary", initials: "AV" },
        channel: "Email",
        shortQuestion: "Do severe storms count as catastrophe losses?",
        impact: {
          headline: "6% PML movement",
          detail:
            "Catastrophe aggregation sets the reinsurance attachment point, and renewal negotiations start in three weeks.",
        },
        question:
          "Should severe convective storm losses aggregate into the catastrophe PML, or stay in attritional?",
        context: [
          "Raises modeled PML by roughly 6%.",
          "Drives the reinsurance attachment point at renewal.",
        ],
        options: ["Aggregate as catastrophe", "Keep in attritional", "Model both for the renewal"],
        suggested: 2,
        medianSeconds: 240,
        writeBack: {
          target: "pull_request",
          artifact: "acme-ins/analytics #1477",
          file: "models/marts/actuarial/_actuarial_schema.yml",
          diff: [
            { sign: " ", text: "  - name: cat_pml" },
            { sign: "-", text: "    perils: [hurricane, earthquake, wildfire]" },
            { sign: "+", text: "    perils: [hurricane, earthquake, wildfire]" },
            { sign: "+", text: "  - name: cat_pml_incl_scs" },
            { sign: "+", text: "    perils: [hurricane, earthquake, wildfire, severe_convective_storm]" },
            { sign: "+", text: "    meta: { decided_by: avoss, purpose: reinsurance_renewal_2027 }" },
          ],
          summary:
            "The actuary asked for both views, so the tap created a second metric rather than overwriting the first — the renewal team can now negotiate against either.",
        },
        contribution:
          "You just shaped the reinsurance renewal three weeks early, with two defensible numbers instead of one nobody can source.",
        shipped: {
          reviewer: "Devon Palmer, vice president of data",
          checks: ["dbt build passed", "both PML views reconciled", "reinsurance extract regenerated"],
          effect:
            "Renewal negotiations start with two defensible numbers and a documented reason for the difference, rather than a single number nobody can source.",
          facts: [
            { label: "PML views", value: "2, reconciled" },
            { label: "Renewal readiness", value: "3 weeks early" },
            { label: "Methodology owner", value: "on record" },
          ],
        },
      },
      tactical: {
        id: "ins-cause",
        tab: "Loss cause",
        tapClass: "tactical",
        detected: {
          eventType: "record needs judgment",
          signal:
            "84 storm claims are waiting on whether the damage was wind or flood, and the two attach to different policies.",
          where: "claims queue · peril undetermined",
          by: "Storm event · inspected July 30",
        },
        implications: [
          "Wind and flood attach to different policies and different reinsurance treaties.",
          "84 claims from the same storm are waiting on the same call.",
        ],
        routing: "The field adjuster saw the property. No model can infer what they already know.",
        persona: { name: "Tobias Hoffman", title: "senior field adjuster", initials: "TH" },
        channel: "Slack",
        shortQuestion: "Wind, or flood?",
        impact: {
          headline: "84 claims, 2 treaties",
          detail:
            "Wind and flood attach to different policies and different reinsurance treaties. The routing decides who pays.",
        },
        question: "Claim CL-88210: was the primary loss cause wind or flood?",
        context: ["$62,400 estimate, inspected July 30.", "84 claims from this storm need the same call."],
        options: ["Wind", "Flood", "Both — concurrent causation", "Cannot determine from inspection"],
        suggested: 0,
        medianSeconds: 52,
        writeBack: {
          target: "override_table",
          artifact: "tap_ai_overrides.claim_peril_code",
          file: "batched nightly · no pull request",
          diff: [
            { sign: " ", text: "claim_id     event_id      peril_code   adjuster    basis" },
            { sign: "+", text: "CL-88210     STORM-2607    wind         thoffman    inspection" },
          ],
          summary:
            "Adjuster judgment recorded against the claim, with the adjuster named and the basis stated — which is exactly what a coverage dispute needs later.",
        },
        contribution:
          "You just routed a $62k claim to the correct treaty, and your reasoning survives if coverage is ever contested.",
        shipped: {
          reviewer: "not required for tactical taps",
          checks: ["claim routed to the correct treaty", "reserve posted"],
          effect:
            "The claim attaches to the right policy and the right treaty, and the reasoning survives if coverage is ever contested.",
          facts: [
            { label: "Claim value", value: "$62,400" },
            { label: "Treaty routing", value: "corrected" },
            { label: "Dispute defence", value: "documented" },
          ],
        },
      },
    },
  },
];

/* --------------------------------------------------------------- accessors */

export const TAP_CLASSES: TapClass[] = ["tactical", "operational", "strategic"];

export const ALL_SCENARIOS: Scenario[] = VERTICALS.flatMap((v) =>
  TAP_CLASSES.map((c) => v.scenarios[c])
);

export const verticalOf = (scenarioId: string): Vertical =>
  VERTICALS.find((v) => TAP_CLASSES.some((c) => v.scenarios[c].id === scenarioId)) ?? VERTICALS[0];

export const TARGET_LABEL: Record<WriteBackTarget, string> = {
  pull_request: "Pull request",
  override_table: "Governed table",
  metadata_patch: "Metadata patch",
};

/**
 * Seniority tier per tap class. The homepage asks visitors to pick who they are
 * rather than what kind of question it is, because "am I a director?" is a
 * question people can answer instantly and "is this operational?" is not.
 *
 * "Frontline" rather than "Analyst" on purpose -- the person closest to the work
 * is often a coder, an adjuster or a rep, not an analyst.
 */
export interface Tier {
  key: TapClass;
  label: string;
  who: string;
  /** What kind of call this person gets asked to make. */
  asks: string;
  /** What this person is uniquely trying to find out. */
  looksFor: string;
  /** The shape of their contribution. */
  contributes: string;
  /** Why a tap is worth their attention specifically. */
  means: string;
  glyph: string;
}

export const TIERS: Tier[] = [
  {
    key: "strategic",
    label: "C-Suite",
    who: "Executives who can bind the whole company to a definition",
    asks: "A decision every team downstream will report against",
    looksFor: "Whether the numbers your board sees mean what you think they mean.",
    contributes:
      "Rare, high-stakes calls that settle a definition for the whole company rather than one team.",
    means:
      "A finger on the pulse without another standing meeting — and your judgment reaching the systems that report on it, not just the deck that describes it.",
    glyph: "M3 20h18M12 4l3.5 6.5h-7z",
  },
  {
    key: "operational",
    label: "Director",
    who: "Managers and directors who own how a function operates",
    asks: "A recurring rule your team will live with",
    looksFor: "Whether your function's rules are actually being applied the way you set them.",
    contributes:
      "The recurring rules your team lives with — set once, applied to everything that arrives after.",
    means:
      "Policy you own enforced in the systems rather than re-litigated every quarter, and visibility when something new does not fit an existing rule.",
    glyph: "M4 18V9m5 9V5m5 13v-6m5 6V8",
  },
  {
    key: "tactical",
    label: "Frontline",
    who: "Coders, adjusters, reps, merchandisers — closest to the work",
    asks: "A routine call only you can make, dozens of times a week",
    looksFor: "Whether the work in front of you is classified the way you would classify it.",
    contributes:
      "The routine judgments only someone doing the work can make, and the system learns each one.",
    means:
      "Five seconds to settle something that would otherwise sit in a queue, or come back to you next week as a question from finance.",
    glyph: "M12 3v18M3 12h18",
  },
];

export const tierOf = (c: TapClass): Tier => TIERS.find((t) => t.key === c)!;

export const CLASS_COPY: Record<TapClass, { label: string; hint: string }> = {
  tactical: { label: "Tactical", hint: "A routine call. High volume, low stakes, answered by whoever is closest." },
  operational: { label: "Operational", hint: "A recurring rule. Medium volume, owned by a function, lightly reviewed." },
  strategic: { label: "Strategic", hint: "A company decision. Rare, consequential, requires authority and review." },
};
