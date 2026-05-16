import { describe, expect, it } from "vitest";
import { ProgrammeType } from "@prisma/client";
import { selectBestProgramme } from "./selectBestProgramme";
import { baseApplication } from "../intake/testFixtures";
import type { ProgrammeEligibilityResult, ScoreBreakdown } from "../intake/intakeTypes";

const programmes = [
  {
    id: "grant",
    slug: "grant-track",
    name: "Grant Track",
    type: ProgrammeType.Grant,
    description: "",
    priority: 100,
    active: true,
  },
  {
    id: "pre",
    slug: "mystartup-pre-accelerator",
    name: "MYStartup Pre-Accelerator",
    type: ProgrammeType.Pre_Accelerator,
    description: "",
    priority: 80,
    active: true,
  },
  {
    id: "mentor",
    slug: "mentor-readiness",
    name: "Mentor Readiness Track",
    type: ProgrammeType.Mentorship,
    description: "",
    priority: 70,
    active: true,
  },
  {
    id: "finance",
    slug: "financial-model-repair",
    name: "Financial Model Repair Track",
    type: ProgrammeType.Sandbox,
    description: "",
    priority: 60,
    active: true,
  },
  {
    id: "vc",
    slug: "vc-readiness",
    name: "VC Readiness Track",
    type: ProgrammeType.VC_Readiness,
    description: "",
    priority: 50,
    active: true,
  },
];

const strongScore: ScoreBreakdown = {
  eligibilityFit: 100,
  tractionStrength: 90,
  financialHealth: 85,
  marketSectorFit: 85,
  dataCompleteness: 100,
  total: 90,
};

const eligibility: ProgrammeEligibilityResult[] = [
  {
    programmeId: "grant",
    programmeSlug: "grant-track",
    programmeName: "Grant Track",
    hardPass: true,
    softScore: 100,
    rules: [],
  },
];

describe("programme routing", () => {
  it("routes grant-ready applications to grant review", () => {
    const result = selectBestProgramme(baseApplication, programmes, eligibility, strongScore);

    expect(result.decisionType).toBe("Grant_Eligible");
    expect(result.recommendedProgrammeSlug).toBe("grant-track");
  });

  it("routes idea-stage applications to pre-accelerator", () => {
    const result = selectBestProgramme(
      { ...baseApplication, stage: "Idea", incorporated: false },
      programmes,
      [{ ...eligibility[0], hardPass: false, rules: [{ ruleKey: "stage_in", passed: false, ruleType: "Hard", message: "Too early", weight: 1 }] }],
      { ...strongScore, total: 45 },
    );

    expect(result.decisionType).toBe("Auto_Routed");
    expect(result.recommendedProgrammeSlug).toBe("mystartup-pre-accelerator");
  });

  it("routes weak financial applications to financial repair", () => {
    const result = selectBestProgramme(
      { ...baseApplication, runwayMonths: 1 },
      programmes,
      [{ ...eligibility[0], hardPass: false, rules: [{ ruleKey: "runway_min", passed: false, ruleType: "Hard", message: "Low runway", weight: 1 }] }],
      { ...strongScore, total: 55 },
    );

    expect(result.recommendedProgrammeSlug).toBe("financial-model-repair");
  });
});
