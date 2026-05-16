import { describe, expect, it } from "vitest";
import { ProgrammeType, RuleType } from "@prisma/client";
import { evaluateProgrammeEligibility } from "./evaluateProgrammeRules";
import { baseApplication } from "../intake/testFixtures";

const grantProgramme = {
  id: "grant",
  slug: "cradle-grant",
  name: "Cradle Grant Track",
  type: ProgrammeType.Grant,
  description: "Grant track",
  priority: 100,
  active: true,
  rules: [
    {
      id: "r1",
      programmeId: "grant",
      ruleKey: "country",
      ruleType: RuleType.Hard,
      operator: "eq",
      expectedValue: '"Malaysia"',
      failureReason: "Malaysia only",
      weight: 1,
    },
    {
      id: "r2",
      programmeId: "grant",
      ruleKey: "funding_ask_max",
      ruleType: RuleType.Hard,
      operator: "lte",
      expectedValue: "500000",
      failureReason: "Funding ask too high",
      weight: 1,
    },
  ],
};

describe("programme eligibility", () => {
  it("passes hard rules for an eligible application", () => {
    const result = evaluateProgrammeEligibility(baseApplication, grantProgramme);

    expect(result.hardPass).toBe(true);
    expect(result.rules.every((rule) => rule.passed)).toBe(true);
  });

  it("fails hard rules when application violates grant constraints", () => {
    const result = evaluateProgrammeEligibility(
      { ...baseApplication, fundingAsk: 800000 },
      grantProgramme,
    );

    expect(result.hardPass).toBe(false);
    expect(result.rules.find((rule) => rule.ruleKey === "funding_ask_max")?.passed).toBe(false);
  });
});
