import type { NormalizedApplication } from "@/lib/validation/applicationSchema";
import type { Programme, ProgrammeRule } from "@prisma/client";
import { parseJson } from "@/lib/json";
import type { EligibilityRuleResult, ProgrammeEligibilityResult } from "../intake/intakeTypes";

type RuleExpected = string | number | boolean | string[];

function evaluateRule(
  app: NormalizedApplication,
  rule: ProgrammeRule,
): EligibilityRuleResult {
  const expected = parseJson<RuleExpected>(rule.expectedValue, rule.expectedValue as unknown as RuleExpected);
  let passed = false;
  let actual: unknown;

  switch (rule.ruleKey) {
    case "country":
      actual = app.country;
      passed = String(actual).toLowerCase() === String(expected).toLowerCase();
      break;
    case "incorporated":
      actual = app.incorporated;
      passed = app.incorporated === expected;
      break;
    case "stage_in":
      actual = app.stage;
      passed = Array.isArray(expected) && expected.includes(app.stage);
      break;
    case "stage_not":
      actual = app.stage;
      passed = Array.isArray(expected) && !expected.includes(app.stage);
      break;
    case "funding_ask_max":
      actual = app.fundingAsk;
      passed = app.fundingAsk <= Number(expected);
      break;
    case "runway_min":
      actual = app.runwayMonths;
      passed = app.runwayMonths >= Number(expected);
      break;
    case "mrr_min":
      actual = app.mrr;
      passed = app.mrr >= Number(expected);
      break;
    case "sector_not_excluded":
      actual = app.sector;
      passed = Array.isArray(expected) && !expected.includes(app.sector);
      break;
    case "company_age_max":
      actual = app.companyAgeMonths;
      passed = app.companyAgeMonths <= Number(expected);
      break;
    default:
      actual = null;
      passed = true;
  }

  return {
    ruleKey: rule.ruleKey,
    passed,
    ruleType: rule.ruleType,
    message: passed ? `OK: ${rule.ruleKey}` : rule.failureReason,
    weight: rule.weight,
  };
}

export function evaluateProgrammeEligibility(
  app: NormalizedApplication,
  programme: Programme & { rules: ProgrammeRule[] },
): ProgrammeEligibilityResult {
  const rules = programme.rules.map((rule) => evaluateRule(app, rule));
  const hardRules = rules.filter((r) => r.ruleType === "Hard");
  const softRules = rules.filter((r) => r.ruleType === "Soft");
  const hardPass = hardRules.every((r) => r.passed);
  const softPassed = softRules.filter((r) => r.passed);
  const softScore =
    softRules.length === 0
      ? 100
      : (softPassed.reduce((s, r) => s + r.weight, 0) /
          softRules.reduce((s, r) => s + r.weight, 0)) *
        100;

  return {
    programmeId: programme.id,
    programmeSlug: programme.slug,
    programmeName: programme.name,
    hardPass,
    softScore,
    rules,
  };
}

export function evaluateAllProgrammes(
  app: NormalizedApplication,
  programmes: (Programme & { rules: ProgrammeRule[] })[],
): ProgrammeEligibilityResult[] {
  return programmes.map((p) => evaluateProgrammeEligibility(app, p));
}
