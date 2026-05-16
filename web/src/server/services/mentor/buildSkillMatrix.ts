import type { HistoricalOutcome, LinkageOutcome } from "@prisma/client";
import { SKILL_TAGS, type SkillMatrix } from "./skillTags";

function parseTags(json: string): string[] {
  try {
    return JSON.parse(json) as string[];
  } catch {
    return [];
  }
}

/**
 * Builds dynamic skill matrix from 2025 cohort historical outcomes (Feature 2.1).
 * Success outcomes boost tags; Fail outcomes penalize tags mentioned in feedback.
 */
export function buildSkillMatrixFromOutcomes(
  outcomes: Pick<HistoricalOutcome, "problemTags" | "outcome" | "feedbackLog" | "sector">[],
): { matrix: SkillMatrix; summary: Record<string, unknown> } {
  const scores: Record<string, { wins: number; total: number }> = {};
  for (const tag of SKILL_TAGS) {
    scores[tag] = { wins: 0, total: 0 };
  }

  for (const o of outcomes) {
    const tags = parseTags(o.problemTags);
    const isWin = o.outcome === "Success";
    const isFail = o.outcome === "Fail";
    for (const tag of tags) {
      if (!scores[tag]) scores[tag] = { wins: 0, total: 0 };
      scores[tag].total += 1;
      if (isWin) scores[tag].wins += 1;
      if (isFail) scores[tag].wins -= 0.5;
    }
  }

  const matrix: SkillMatrix = {};
  let topTag = "";
  let topScore = 0;
  for (const tag of SKILL_TAGS) {
    const s = scores[tag];
    if (s.total === 0) {
      matrix[tag] = 0.5;
      continue;
    }
    const normalized = Math.min(1, Math.max(0.1, (s.wins / s.total + 1) / 2));
    matrix[tag] = Math.round(normalized * 100) / 100;
    if (matrix[tag] > topScore) {
      topScore = matrix[tag];
      topTag = tag;
    }
  }

  const successCount = outcomes.filter((o) => o.outcome === "Success").length;
  const failCount = outcomes.filter((o) => o.outcome === "Fail").length;

  return {
    matrix,
    summary: {
      cohortYear: 2025,
      startupsMentored: outcomes.length,
      successRate: outcomes.length ? Math.round((successCount / outcomes.length) * 100) : 0,
      successCount,
      failCount,
      pivotCount: outcomes.filter((o) => o.outcome === "Pivot").length,
      strongestSkill: topTag,
      strongestScore: topScore,
    },
  };
}

export function rebuildAllMentorSkillMatrices(
  mentors: { id: string; historicalOutcomes: HistoricalOutcome[] }[],
) {
  return mentors.map((m) => {
    const { matrix, summary } = buildSkillMatrixFromOutcomes(m.historicalOutcomes);
    return {
      mentorId: m.id,
      dynamicSkillMatrix: JSON.stringify(matrix),
      outcomeSummary: JSON.stringify(summary),
    };
  });
}
