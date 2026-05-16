import type { NormalizedApplication } from "@/lib/validation/applicationSchema";
import type { BenchmarkDelta, ProgrammeEligibilityResult, ScoreBreakdown } from "./intakeTypes";

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

export function computeReadinessScore(
  app: NormalizedApplication,
  grantEligibility: ProgrammeEligibilityResult | undefined,
  benchmarkDeltas: BenchmarkDelta[],
): ScoreBreakdown {
  const hardRules = grantEligibility?.rules.filter((r) => r.ruleType === "Hard") ?? [];
  const hardPassed = hardRules.filter((r) => r.passed).length;
  const eligibilityFit = hardRules.length
    ? clamp((hardPassed / hardRules.length) * 100)
    : 50;

  let tractionStrength = 30;
  if (app.mrr > 0) tractionStrength += 25;
  if (app.activeUsers >= 100) tractionStrength += 20;
  if (app.pilots >= 1) tractionStrength += 15;
  if (app.revenueGrowthPct >= 10) tractionStrength += 10;
  tractionStrength = clamp(tractionStrength);

  let financialHealth = 40;
  if (app.runwayMonths >= 6) financialHealth += 25;
  else if (app.runwayMonths >= 3) financialHealth += 10;
  if (app.grossMarginPct >= 50) financialHealth += 15;
  if (app.cac > 0 && app.mrr > 0 && app.cac / app.mrr < 3) financialHealth += 20;
  const cacDelta = benchmarkDeltas.find((d) => d.metricName === "cac");
  if (cacDelta?.status === "above") financialHealth -= 15;
  const runwayDelta = benchmarkDeltas.find((d) => d.metricName === "runway_months");
  if (runwayDelta?.status === "below") financialHealth -= 15;
  financialHealth = clamp(financialHealth);

  const prioritySectors = ["SaaS", "Fintech", "Healthtech", "Cleantech", "Edtech"];
  const marketSectorFit = prioritySectors.includes(app.sector) ? 85 : 65;

  const requiredFields: (keyof NormalizedApplication)[] = [
    "problem",
    "solution",
    "targetCustomers",
    "tractionSummary",
    "useOfFunds",
  ];
  const filled = requiredFields.filter((f) => String(app[f]).length > 10).length;
  const dataCompleteness = clamp((filled / requiredFields.length) * 100);

  const total = clamp(
    eligibilityFit * 0.3 +
      tractionStrength * 0.25 +
      financialHealth * 0.2 +
      marketSectorFit * 0.15 +
      dataCompleteness * 0.1,
  );

  return {
    eligibilityFit,
    tractionStrength,
    financialHealth,
    marketSectorFit,
    dataCompleteness,
    total,
  };
}
