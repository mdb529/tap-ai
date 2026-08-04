/**
 * ROI MODEL.
 *
 * Every figure the site shows is COMPUTED from the constants below. Nothing is
 * hand-typed, because hand-typed totals are how a model quietly stops matching
 * its own assumptions — and a CFO who catches one arithmetic error discards the
 * whole page.
 *
 * These constants are duplicated from config/plan.yml (`value_assumptions` and
 * `roi_scenarios`). scripts/drift_check.py fails the build if the two disagree.
 *
 * ON HONESTY. This model is deliberately conservative and it is designed to
 * survive a hostile read:
 *
 *   * The ATTRIBUTION HAIRCUT discards 45% of modelled gross value. Some of
 *     these decisions would have been made anyway, later and more expensively.
 *     Claiming all of it would be indefensible.
 *   * Nothing is counted twice. Rework hours are engineering time only; the
 *     meeting figure counts stakeholder time in meetings that no longer need to
 *     happen, which is a different pool of people.
 *   * WHAT IS NOT COUNTED, and could have been: revenue from decisions made
 *     faster, the value of retiring BI licences, reduced audit preparation, the
 *     option value of a decision record your agents can read. All plausible,
 *     none measurable enough to put a number on.
 *
 * The result lands at roughly 2–3× on the paid tiers. That is a credible
 * enterprise software return, not a spectacular one, and stating it plainly is
 * worth more than a bigger number nobody believes.
 */

/** Blended fully-loaded hourly costs. From config/plan.yml. */
export const RATE = {
  /** Analytics or data engineer — the person who does the rework today. */
  engineer: 95,
  /** Business stakeholder — the person sitting in the reconciliation meeting. */
  stakeholder: 130,
} as const;

export const ASSUMPTION = {
  /** Engineering hours of rework avoided when a company-level decision is settled. */
  reworkHoursPerStrategic: 6.5,
  /** Same, for a routine record-level answer. Small, but they are numerous. */
  reworkHoursPerRoutine: 0.35,
  /** Cost of one prevented metric inconsistency reaching a decision. */
  incidentCost: 2400,
  /** Fraction of modelled gross value we actually claim. */
  attribution: 0.55,
} as const;

export interface RoiScenario {
  key: string;
  label: string;
  /** Headcount, for orientation only — nothing is derived from it. */
  employees: number;
  /** People who actually answer taps. This is what the plan caps. */
  contributors: number;
  plan: "Starter" | "Growth" | "Enterprise";
  /** Annual fee for that plan. Mirrors config/plan.yml. */
  annualFee: number;
  strategicPerYear: number;
  routinePerYear: number;
  inconsistenciesPrevented: number;
  /** Stakeholder hours in reconciliation meetings that stop being necessary. */
  meetingHoursAvoided: number;
}

export const SCENARIOS: RoiScenario[] = [
  {
    key: "small",
    label: "150 employees",
    employees: 150,
    contributors: 10,
    plan: "Starter",
    annualFee: 0,
    strategicPerYear: 12,
    routinePerYear: 500,
    inconsistenciesPrevented: 5,
    meetingHoursAvoided: 70,
  },
  {
    key: "mid",
    label: "600 employees",
    employees: 600,
    contributors: 50,
    plan: "Growth",
    annualFee: 54000,
    strategicPerYear: 45,
    routinePerYear: 2600,
    inconsistenciesPrevented: 18,
    meetingHoursAvoided: 300,
  },
  {
    key: "large",
    label: "2,500 employees",
    employees: 2500,
    contributors: 220,
    plan: "Enterprise",
    annualFee: 145000,
    strategicPerYear: 140,
    routinePerYear: 11000,
    inconsistenciesPrevented: 60,
    meetingHoursAvoided: 1100,
  },
];

export interface RoiLine {
  id: string;
  label: string;
  /** Plain-language claim. */
  claim: string;
  /** The arithmetic, shown so nobody has to trust us. */
  workings: string;
  gross: number;
}

export interface RoiResult {
  lines: RoiLine[];
  gross: number;
  /** After the attribution haircut. This is the number we actually claim. */
  claimed: number;
  discarded: number;
  fee: number;
  net: number;
  /** Claimed value per dollar of fee. Infinite on the free tier. */
  multiple: number | null;
  engineerHours: number;
}

const money = (n: number) =>
  n >= 1000 ? `$${Math.round(n).toLocaleString()}` : `$${Math.round(n)}`;

export function computeRoi(s: RoiScenario): RoiResult {
  const strategicHours = s.strategicPerYear * ASSUMPTION.reworkHoursPerStrategic;
  const routineHours = s.routinePerYear * ASSUMPTION.reworkHoursPerRoutine;
  const engineerHours = strategicHours + routineHours;

  const lines: RoiLine[] = [
    {
      id: "engineering",
      label: "Engineering time returned to the backlog",
      claim:
        "Rework that never has to happen: no reconciliation, no rebuilding a model against a rule that was wrong from the start.",
      workings: `${s.strategicPerYear} company decisions × ${ASSUMPTION.reworkHoursPerStrategic}h + ${s.routinePerYear.toLocaleString()} routine answers × ${ASSUMPTION.reworkHoursPerRoutine}h = ${Math.round(engineerHours).toLocaleString()}h × $${RATE.engineer}/h`,
      gross: engineerHours * RATE.engineer,
    },
    {
      id: "meetings",
      label: "Meetings that stop being necessary",
      claim:
        "The recurring “whose number is right” meeting. The question gets answered in seconds by the one person who knew, in the tool they were already in.",
      workings: `${s.meetingHoursAvoided.toLocaleString()} stakeholder hours × $${RATE.stakeholder}/h`,
      gross: s.meetingHoursAvoided * RATE.stakeholder,
    },
    {
      id: "risk",
      label: "Stale and conflicting metrics caught early",
      claim:
        "A definition that drifted, or a rule nobody revisited, found before it reaches a board deck or a regulator.",
      workings: `${s.inconsistenciesPrevented} prevented × ${money(ASSUMPTION.incidentCost)} each`,
      gross: s.inconsistenciesPrevented * ASSUMPTION.incidentCost,
    },
  ];

  const gross = lines.reduce<number>((n, l) => n + l.gross, 0);
  const claimed = gross * ASSUMPTION.attribution;
  const net = claimed - s.annualFee;

  return {
    lines,
    gross,
    claimed,
    discarded: gross - claimed,
    fee: s.annualFee,
    net,
    multiple: s.annualFee > 0 ? claimed / s.annualFee : null,
    engineerHours,
  };
}

/** Things this model deliberately leaves on the table. Shown to the user. */
export const NOT_COUNTED = [
  "Revenue from decisions made weeks earlier",
  "BI licences retired once dashboards stop multiplying",
  "Audit and SOX preparation time",
  "The option value of a decision record your AI agents can read",
];

export const fmtMoney = money;
