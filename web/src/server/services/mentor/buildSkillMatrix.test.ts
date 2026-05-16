import { describe, expect, it } from "vitest";
import { buildSkillMatrixFromOutcomes } from "./buildSkillMatrix";

describe("buildSkillMatrixFromOutcomes", () => {
  it("boosts skills where mentor had successful outcomes", () => {
    const { matrix, summary } = buildSkillMatrixFromOutcomes([
      {
        problemTags: '["B2B_Enterprise","Go_To_Market"]',
        outcome: "Success",
        feedbackLog: "Closed enterprise deals",
        sector: "SaaS",
        stage: "Revenue",
        mentorNodeId: "m1",
        id: "1",
        startupName: "A",
        cohortYear: 2025,
        createdAt: new Date(),
      },
      {
        problemTags: '["B2B_Enterprise"]',
        outcome: "Success",
        feedbackLog: "Another win",
        sector: "Fintech",
        stage: "MVP",
        mentorNodeId: "m1",
        id: "2",
        startupName: "B",
        cohortYear: 2025,
        createdAt: new Date(),
      },
    ] as never);

    expect(matrix.B2B_Enterprise).toBeGreaterThan(0.7);
    expect(summary.successCount).toBe(2);
    expect(summary.startupsMentored).toBe(2);
  });

  it("penalizes skills associated with failed outcomes", () => {
    const { matrix } = buildSkillMatrixFromOutcomes([
      {
        problemTags: '["Marketing"]',
        outcome: "Fail",
        feedbackLog: "CAC too high",
        sector: "SaaS",
        stage: "MVP",
        mentorNodeId: "m1",
        id: "1",
        startupName: "C",
        cohortYear: 2025,
        createdAt: new Date(),
      },
      {
        problemTags: '["Marketing"]',
        outcome: "Success",
        feedbackLog: "One win",
        sector: "SaaS",
        stage: "MVP",
        mentorNodeId: "m1",
        id: "2",
        startupName: "D",
        cohortYear: 2025,
        createdAt: new Date(),
      },
    ] as never);

    expect(matrix.Marketing).toBeLessThan(0.85);
  });
});
