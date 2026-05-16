import { describe, expect, it } from "vitest";
import { baseApplication } from "./testFixtures";
import { computeReadinessScore } from "./computeReadinessScore";
import type { ProgrammeEligibilityResult } from "./intakeTypes";

const grantEligibilityPass: ProgrammeEligibilityResult = {
  programmeId: "grant-1",
  programmeSlug: "grant-track",
  programmeName: "Grant Track",
  hardPass: true,
  softScore: 80,
  rules: [
    { ruleKey: "country", ruleType: "Hard", passed: true, message: "ok", weight: 1 },
    { ruleKey: "incorporated", ruleType: "Hard", passed: true, message: "ok", weight: 1 },
    { ruleKey: "stage_in", ruleType: "Hard", passed: true, message: "ok", weight: 1 },
  ],
};

describe("computeReadinessScore", () => {
  it("returns weighted total between 0 and 100", () => {
    const result = computeReadinessScore(baseApplication, grantEligibilityPass, []);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.eligibilityFit).toBeGreaterThan(0);
    expect(result.tractionStrength).toBeGreaterThan(0);
  });

  it("lowers financial health when runway benchmark is below median", () => {
    const withLowRunway = computeReadinessScore(baseApplication, grantEligibilityPass, [
      {
        metricName: "runway_months",
        value: 2,
        median: 8,
        p25: 4,
        p75: 14,
        deltaPct: -75,
        status: "below",
        message: "Runway below median",
      },
    ]);
    const baseline = computeReadinessScore(baseApplication, grantEligibilityPass, []);
    expect(withLowRunway.financialHealth).toBeLessThan(baseline.financialHealth);
  });
});
