import { describe, expect, it } from "vitest";
import { extractProblemTags } from "./skillTags";
import { buildSkillMatrixFromOutcomes } from "./buildSkillMatrix";

describe("mentor matching", () => {
  it("extracts problem tags from roadblock text", () => {
    const tags = extractProblemTags(
      "We need help with enterprise sales pipeline and closing B2B pilots",
    );
    expect(tags).toContain("B2B_Enterprise");
    expect(tags.length).toBeGreaterThan(0);
  });

  it("builds skill matrix from historical outcomes", () => {
    const { matrix, summary } = buildSkillMatrixFromOutcomes([
      {
        problemTags: '["B2B_Enterprise"]',
        outcome: "Success",
        feedbackLog: "Great",
        sector: "SaaS",
        stage: "Revenue",
        mentorNodeId: "x",
        id: "1",
        startupName: "A",
        cohortYear: 2025,
        createdAt: new Date(),
      },
      {
        problemTags: '["Marketing"]',
        outcome: "Fail",
        feedbackLog: "Weak",
        sector: "SaaS",
        stage: "MVP",
        mentorNodeId: "x",
        id: "2",
        startupName: "B",
        cohortYear: 2025,
        createdAt: new Date(),
      },
    ]);
    expect(matrix.B2B_Enterprise).toBeGreaterThan(0.5);
    expect(summary.startupsMentored).toBe(2);
  });
});
