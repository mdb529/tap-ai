import type { TapClass } from "./scenarios";

/**
 * THE TAP TAXONOMY — two independent axes.
 *
 * These were conflated before, and conflating them was wrong. A tap has:
 *
 *   CLASS  — how much of the company the answer binds.
 *            tactical → operational → strategic. This decides who may answer,
 *            how long they have, and whether an engineer reviews it.
 *
 *   FAMILY — what the question is ABOUT. Records, data quality, business logic,
 *            metric definitions, governance. This decides where the answer
 *            lands and which expert is the right one to ask.
 *
 * They are orthogonal on purpose. "A metric question" tells you nothing about
 * stakes: retiring an unused dashboard metric is tactical, settling the
 * canonical definition of "active customer" is strategic. Both are `metric`.
 * A one-dimensional taxonomy forces you to choose which fact to encode, and
 * you need both to route correctly.
 *
 * A third axis, DETECTION, is how the tap gets raised in the first place. It is
 * not a property of the question — it is a property of how much machinery you
 * are paying for — which is why it maps so cleanly onto the plan tiers.
 *
 * WHY GATING LIVES HERE AND NOT IN tiers.ts: the cheapest plan that unlocks a
 * cell is a fact about the cell, not about the plan. Storing it the other way
 * round means a tier listing 14 cells by name, which is exactly the kind of
 * hand-maintained list that goes stale.
 */

export type PlanKey = "starter" | "growth" | "enterprise";

/**
 * How a tap gets raised. The ordering is meaningful — each mode requires
 * strictly more inference than the one before it.
 */
export type DetectionMode = "triggered" | "automatic" | "audit";

export const DETECTION: Record<
  DetectionMode,
  { label: string; how: string; needs: string; glyph: string }
> = {
  triggered: {
    label: "Triggered by an event",
    how: "A pull request changes a rule, a new value appears in a feed, a test fails.",
    // The honest reason this one is free: it needs no judgement from us.
    needs: "Deterministic. Something specific happened and we can point at it.",
    glyph: "M13 2L3 14h7l-1 8 10-12h-7z",
  },
  automatic: {
    label: "Detected automatically",
    how: "Usage and metadata are watched for patterns: definitions diverging, a metric nobody queries, a rule accumulating exceptions.",
    needs: "Cross-referencing over time. No single event fired — the pattern is the signal.",
    glyph: "M3 12h4l3-8 4 16 3-8h4",
  },
  audit: {
    label: "Found by an AI agent audit",
    how: "An agent sweeps the project and proposes taps nobody thought to configure, with its reasoning attached for a human to accept or reject.",
    needs: "Judgement. This is the mode that finds the questions you did not know to ask.",
    glyph: "M11 3a8 8 0 105.3 14L21 21M11 3a8 8 0 010 16",
  },
};

export interface FamilyCell {
  /** A concrete question, in the words the person answering would use. */
  example: string;
  /** Cheapest plan that includes this family × class combination. */
  plan: PlanKey;
  detection: DetectionMode;
}

export interface TapFamily {
  id: string;
  label: string;
  /** What this family is fundamentally asking about. */
  asks: string;
  /** Who tends to be the right person to answer it. */
  answeredBy: string;
  glyph: string;
  /** null where the family does not meaningfully produce that class. */
  cells: Record<TapClass, FamilyCell | null>;
}

export const FAMILIES: TapFamily[] = [
  {
    id: "record",
    label: "Records and mappings",
    asks: "A value arrived that your systems have never seen. Where does it belong?",
    answeredBy: "Whoever works with the records daily",
    glyph: "M4 6h16M4 12h16M4 18h10",
    cells: {
      tactical: {
        example: "An unrecognized SKU appeared in the feed. Which category is it?",
        plan: "starter",
        detection: "triggered",
      },
      operational: {
        example:
          "This mapping rule has needed eleven manual exceptions. Should the rule change?",
        plan: "growth",
        detection: "automatic",
      },
      // Records do not produce company-binding decisions. Inventing a cell to
      // fill the grid would be a lie in the shape of a table.
      strategic: null,
    },
  },
  {
    id: "quality",
    label: "Data quality and freshness",
    asks: "Is this number wrong, or is the business genuinely different this month?",
    answeredBy: "The person closest to the operation",
    glyph: "M12 3l9 16H3zM12 9v5M12 17h.01",
    cells: {
      tactical: {
        example:
          "Charge-per-encounter moved two standard deviations. Real change, or a data problem?",
        plan: "starter",
        detection: "triggered",
      },
      operational: {
        example:
          "Three tests on this model have been failing and muted for a month. Is the rule wrong?",
        plan: "growth",
        detection: "automatic",
      },
      strategic: {
        example:
          "A regulatory submission depends on a source with no owner and no freshness guarantee.",
        plan: "enterprise",
        detection: "audit",
      },
    },
  },
  {
    id: "logic",
    label: "Business logic",
    asks: "The rule in code says X. Is X still what the business means?",
    answeredBy: "The function that owns the policy",
    glyph: "M8 6l-5 6 5 6M16 6l5 6-5 6M13 4l-2 16",
    cells: {
      tactical: {
        example: "A promotion now stacks with loyalty discounts. Was that intended?",
        plan: "starter",
        detection: "triggered",
      },
      operational: {
        example:
          "This discount rule carries nine hardcoded exceptions. Should it become a policy?",
        plan: "growth",
        detection: "automatic",
      },
      strategic: {
        example:
          "Revenue recognition logic changed in a way that moves the reported number.",
        plan: "growth",
        detection: "triggered",
      },
    },
  },
  {
    id: "metric",
    label: "Metrics and definitions",
    asks: "Does everyone in the company mean the same thing by this number?",
    answeredBy: "The owner of the definition, or an executive",
    glyph: "M4 19h16M7 16V9M12 16V5M17 16v-5",
    cells: {
      tactical: {
        example: "Nobody has queried this metric in ninety days. Retire it?",
        plan: "growth",
        detection: "automatic",
      },
      operational: {
        example: "Two teams compute pipeline coverage differently. Which is right?",
        plan: "growth",
        detection: "automatic",
      },
      strategic: {
        example:
          "Forty-one dashboards use three definitions of “active customer.” Which is canonical?",
        plan: "growth",
        detection: "automatic",
      },
    },
  },
  {
    id: "governance",
    label: "Governance and privacy",
    asks: "Who may see this, who signed off, and when was that last true?",
    answeredBy: "A data steward or a compliance owner",
    glyph: "M12 3l8 4v6c0 5-3.5 7.5-8 8-4.5-.5-8-3-8-8V7z",
    cells: {
      tactical: {
        example: "A new column looks like protected health information. Confirm the classification.",
        plan: "growth",
        detection: "triggered",
      },
      operational: {
        example: "This dataset's access policy has not been reviewed in fourteen months.",
        plan: "growth",
        detection: "automatic",
      },
      strategic: {
        example:
          "Nobody has ever attested to the definition behind a regulated report.",
        plan: "enterprise",
        detection: "audit",
      },
    },
  },
];

/**
 * How many family x class cells exist at all. Derived, because the pricing page
 * renders "N of TOTAL" and a hand-typed total is the first thing to go stale when
 * a family is added.
 */
export const TOTAL_CELLS = FAMILIES.reduce<number>(
  (n, f) => n + Object.values(f.cells).filter(Boolean).length,
  0
);

/** Plan ordering, cheapest first. Used to test "does plan X include cell Y". */
export const PLAN_ORDER: PlanKey[] = ["starter", "growth", "enterprise"];

export const PLAN_LABEL: Record<PlanKey, string> = {
  starter: "Starter",
  growth: "Growth",
  enterprise: "Enterprise",
};

/** True when `plan` is at least as high as the cell's requirement. */
export function planIncludes(plan: PlanKey, cell: FamilyCell | null): boolean {
  if (!cell) return false;
  return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(cell.plan);
}

/** Every family × class cell a plan unlocks. Derived, never hand-listed. */
export function cellsForPlan(plan: PlanKey): number {
  return FAMILIES.reduce<number>(
    (n, f) =>
      n + (Object.values(f.cells).filter((c) => planIncludes(plan, c)).length as number),
    0
  );
}

/** Detection modes a plan can use. Derived from the cells it unlocks. */
export function detectionForPlan(plan: PlanKey): DetectionMode[] {
  const modes = new Set<DetectionMode>();
  FAMILIES.forEach((f) =>
    Object.values(f.cells).forEach((c) => {
      if (planIncludes(plan, c) && c) modes.add(c.detection);
    })
  );
  return (["triggered", "automatic", "audit"] as DetectionMode[]).filter((m) => modes.has(m));
}

export const CLASS_LABEL: Record<TapClass, string> = {
  tactical: "Tactical",
  operational: "Operational",
  strategic: "Strategic",
};

export const CLASS_MEANS: Record<TapClass, string> = {
  tactical: "Binds one record. Answered by whoever is closest.",
  operational: "Binds a team's recurring rule. Lightly reviewed.",
  strategic: "Binds the whole company. Needs authority and full review.",
};
