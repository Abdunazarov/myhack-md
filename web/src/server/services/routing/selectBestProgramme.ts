import type { Programme } from "@prisma/client";
import type { NormalizedApplication } from "@/lib/validation/applicationSchema";
import type {
  ProgrammeEligibilityResult,
  RoutingResult,
  ScoreBreakdown,
} from "../intake/intakeTypes";

const GRANT_SLUG = "grant-track";
const PRE_ACCEL_SLUG = "mystartup-pre-accelerator";
const MENTOR_SLUG = "mentor-readiness";
const FINANCIAL_SLUG = "financial-model-repair";
const VC_SLUG = "vc-readiness";

export function selectBestProgramme(
  app: NormalizedApplication,
  programmes: Programme[],
  eligibilityResults: ProgrammeEligibilityResult[],
  scoreBreakdown: ScoreBreakdown,
): RoutingResult {
  const bySlug = Object.fromEntries(programmes.map((p) => [p.slug, p]));
  const grant = eligibilityResults.find((e) => e.programmeSlug === GRANT_SLUG);
  const grantProgramme = bySlug[GRANT_SLUG];

  if (grant?.hardPass && scoreBreakdown.total >= 65) {
    return {
      decisionType: "Grant_Eligible",
      recommendedProgrammeId: grantProgramme!.id,
      recommendedProgrammeSlug: GRANT_SLUG,
      recommendedProgrammeName: grantProgramme!.name,
      reasonCodes: ["grant_hard_pass", "readiness_above_threshold"],
      explanation:
        "The startup passes all hard grant constraints and is ready for grant committee review.",
    };
  }

  const failedHard = grant?.rules.filter((r) => r.ruleType === "Hard" && !r.passed) ?? [];
  const reasonCodes = failedHard.map((r) => `failed_${r.ruleKey}`);

  if (app.stage === "Idea" || !app.incorporated) {
    const prog = bySlug[PRE_ACCEL_SLUG];
    return {
      decisionType: "Auto_Routed",
      recommendedProgrammeId: prog.id,
      recommendedProgrammeSlug: PRE_ACCEL_SLUG,
      recommendedProgrammeName: prog.name,
      reasonCodes: [...reasonCodes, "early_stage"],
      explanation:
        "The startup is too early or not incorporated yet, so the profile is automatically routed to MYStartup Pre-Accelerator without re-entry.",
    };
  }

  if (app.runwayMonths < 3 || app.cac === 0 || app.grossMarginPct === 0) {
    const prog = bySlug[FINANCIAL_SLUG];
    return {
      decisionType: "Auto_Routed",
      recommendedProgrammeId: prog.id,
      recommendedProgrammeSlug: FINANCIAL_SLUG,
      recommendedProgrammeName: prog.name,
      reasonCodes: [...reasonCodes, "weak_financials"],
      explanation:
        "Financial readiness is not strong enough for grant review yet. Route to Financial Model Repair before resubmission.",
    };
  }

  if (app.stage === "Growth" && app.mrr > 50000) {
    const prog = bySlug[VC_SLUG];
    return {
      decisionType: "Auto_Routed",
      recommendedProgrammeId: prog.id,
      recommendedProgrammeSlug: VC_SLUG,
      recommendedProgrammeName: prog.name,
      reasonCodes: [...reasonCodes, "growth_stage"],
      explanation:
        "The startup is not the best grant fit, but traction suggests VC Readiness is the better next route.",
    };
  }

  if (scoreBreakdown.total >= 50 && scoreBreakdown.total < 65) {
    const prog = bySlug[MENTOR_SLUG];
    return {
      decisionType: "Needs_Review",
      recommendedProgrammeId: prog.id,
      recommendedProgrammeSlug: MENTOR_SLUG,
      recommendedProgrammeName: prog.name,
      reasonCodes: [...reasonCodes, "borderline_score"],
      explanation:
        "Readiness is borderline. Mentor Readiness is recommended, with final review by a program admin.",
    };
  }

  const prog = bySlug[PRE_ACCEL_SLUG];
  return {
    decisionType: "Auto_Routed",
    recommendedProgrammeId: prog.id,
    recommendedProgrammeSlug: PRE_ACCEL_SLUG,
    recommendedProgrammeName: prog.name,
    reasonCodes: [...reasonCodes, "default_route"],
    explanation:
      "The application fails grant hard constraints and has been routed to the most suitable ecosystem programme.",
  };
}
