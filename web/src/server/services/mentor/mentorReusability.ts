import type { EcosystemProject, HistoricalOutcome, MentorNode } from "@prisma/client";
import { prisma } from "@/lib/db";
import { extractProblemTags, parseSkillMatrix } from "./skillTags";

export type SectorTrackRecord = {
  sector: string;
  mentored: number;
  successCount: number;
  successRate: number;
  highlights: Array<{
    startupName: string;
    outcome: string;
    cohortYear: number;
    snippet: string;
  }>;
};

export type MentorTrackRecord = {
  headline: string;
  subheadline: string;
  bySector: SectorTrackRecord[];
  provenSkills: Array<{ tag: string; score: number; proof: string }>;
};

export type SuggestedAssignment = {
  projectId: string;
  name: string;
  sector: string;
  stage: string;
  roadblock: string;
  matchScore: number;
  matchedCriteria: string[];
  explanation: string;
  similarPastWin: {
    startupName: string;
    sector: string;
    outcome: string;
    feedbackLog: string;
  } | null;
};

function parseTags(json: string): string[] {
  try {
    return JSON.parse(json) as string[];
  } catch {
    return [];
  }
}

export function buildMentorTrackRecord(
  outcomes: HistoricalOutcome[],
  skillMatrix: Record<string, number>,
): MentorTrackRecord {
  const bySectorMap = new Map<
    string,
    { total: number; success: number; highlights: SectorTrackRecord["highlights"] }
  >();

  for (const o of outcomes) {
    const entry = bySectorMap.get(o.sector) ?? { total: 0, success: 0, highlights: [] };
    entry.total += 1;
    if (o.outcome === "Success") entry.success += 1;
    if (entry.highlights.length < 2) {
      entry.highlights.push({
        startupName: o.startupName,
        outcome: o.outcome,
        cohortYear: o.cohortYear,
        snippet: o.feedbackLog.slice(0, 120),
      });
    }
    bySectorMap.set(o.sector, entry);
  }

  const bySector: SectorTrackRecord[] = [...bySectorMap.entries()]
    .map(([sector, v]) => ({
      sector,
      mentored: v.total,
      successCount: v.success,
      successRate: v.total ? Math.round((v.success / v.total) * 100) : 0,
      highlights: v.highlights,
    }))
    .sort((a, b) => b.successRate - a.successRate || b.mentored - a.mentored);

  const strongSectors = bySector.filter((s) => s.successRate >= 75 && s.mentored >= 1);
  const sectorNames = strongSectors.slice(0, 3).map((s) => s.sector);
  const headline =
    sectorNames.length > 0
      ? `You excelled on ${sectorNames.join(", ")} projects in 2025`
      : "Your 2025 cohort outcomes inform smarter matching";

  const totalMentored = outcomes.length;
  const totalWins = outcomes.filter((o) => o.outcome === "Success").length;
  const overallRate = totalMentored ? Math.round((totalWins / totalMentored) * 100) : 0;
  const subheadline =
    totalMentored > 0
      ? `${overallRate}% overall success across ${totalMentored} startups in 2025 — validated skills carry forward to new matches.`
      : "Historical mentorship data powers explainable recommendations.";

  const provenSkills = Object.entries(skillMatrix)
    .filter(([, score]) => score >= 0.55)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([tag, score]) => {
      const tagLabel = tag.replace(/_/g, " ");
      const proofOutcome = outcomes.find(
        (o) => o.outcome === "Success" && parseTags(o.problemTags).includes(tag),
      );
      return {
        tag: tagLabel,
        score: Math.round(score * 100),
        proof: proofOutcome
          ? `Proven on ${proofOutcome.startupName} (${proofOutcome.sector}, ${proofOutcome.cohortYear})`
          : `Strong historical signal across cohort logs`,
      };
    });

  return { headline, subheadline, bySector, provenSkills };
}

function scoreProjectForMentor(
  mentor: MentorNode & { historicalOutcomes: HistoricalOutcome[] },
  project: EcosystemProject,
  roadblock: string,
  problemCategory: string | null | undefined,
  activeLinkageCount: number,
): {
  matchScore: number;
  matchedCriteria: string[];
  explanation: string;
  similarPastWin: SuggestedAssignment["similarPastWin"];
} {
  const matrix = parseSkillMatrix(mentor.dynamicSkillMatrix);
  const problemTags = extractProblemTags(roadblock, problemCategory);
  const matchedCriteria: string[] = [];

  let tagScore = 0;
  for (const tag of problemTags) {
    const skill = matrix[tag] ?? 0.5;
    tagScore += skill;
    if (skill >= 0.75) {
      matchedCriteria.push(
        `${tag.replace(/_/g, " ")}: ${Math.round(skill * 100)}% historical success`,
      );
    }
  }
  tagScore = problemTags.length ? tagScore / problemTags.length : 0.5;

  const sectorWins = mentor.historicalOutcomes.filter(
    (h) => h.sector === project.sector && h.outcome === "Success",
  );
  const sectorTotal = mentor.historicalOutcomes.filter((h) => h.sector === project.sector);
  if (sectorTotal.length > 0) {
    const rate = Math.round((sectorWins.length / sectorTotal.length) * 100);
    matchedCriteria.push(`${project.sector}: ${rate}% success (${sectorTotal.length} prior)`);
  }

  const stageMatch = mentor.historicalOutcomes.some((h) => h.stage === project.stage);
  if (stageMatch) {
    matchedCriteria.push(`${project.stage} stage: prior cohort experience`);
  }

  const sectorBonus = sectorWins.length > 0 ? 0.1 : 0;
  const stageBonus = stageMatch ? 0.05 : 0;
  const capacityPenalty = activeLinkageCount * 0.02;
  const matchScore = Math.max(
    0,
    Math.min(1, Math.round((tagScore + sectorBonus + stageBonus - capacityPenalty) * 100) / 100),
  );

  const similarPastWin =
    sectorWins[0] ??
    mentor.historicalOutcomes.find((h) => h.outcome === "Success") ??
    null;

  const explanation = [
    `Recommended because ${project.name} needs ${problemTags.map((t) => t.replace(/_/g, " ")).join(", ")}.`,
    matchedCriteria.length
      ? `Matches your track record: ${matchedCriteria.slice(0, 2).join("; ")}.`
      : "Fits your dynamic skill profile from 2025 outcomes.",
    similarPastWin
      ? `Similar win: ${similarPastWin.startupName} (${similarPastWin.sector}, ${similarPastWin.cohortYear}).`
      : "",
    `You have capacity for ${mentor.availabilityCapacity - activeLinkageCount} more active slot${mentor.availabilityCapacity - activeLinkageCount === 1 ? "" : "s"}.`,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    matchScore,
    matchedCriteria,
    explanation,
    similarPastWin: similarPastWin
      ? {
          startupName: similarPastWin.startupName,
          sector: similarPastWin.sector,
          outcome: similarPastWin.outcome,
          feedbackLog: similarPastWin.feedbackLog.slice(0, 200),
        }
      : null,
  };
}

export async function suggestAssignmentsForMentor(
  mentorId: string,
): Promise<SuggestedAssignment[]> {
  const mentor = await prisma.mentorNode.findUnique({
    where: { id: mentorId },
    include: {
      historicalOutcomes: true,
      linkages: {
        where: { status: { in: ["Active", "Requires_Intervention"] } },
      },
    },
  });
  if (!mentor) return [];

  const assignedIds = new Set(mentor.linkages.map((l) => l.ecosystemProjectId));

  const candidates = await prisma.ecosystemProject.findMany({
    where: {
      id: { notIn: [...assignedIds] },
      state: { in: ["Lead", "In_Program"] },
    },
    include: {
      roadblockRequests: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const scored = candidates
    .map((project) => {
      const rb = project.roadblockRequests[0];
      const roadblock =
        rb?.roadblock ??
        `Seeking mentorship for ${project.sector} ${project.stage} growth and go-to-market.`;
      const result = scoreProjectForMentor(
        mentor,
        project,
        roadblock,
        rb?.problemCategory,
        mentor.linkages.length,
      );
      if (result.matchScore < 0.55) return null;
      return {
        projectId: project.id,
        name: project.name,
        sector: project.sector,
        stage: project.stage,
        roadblock,
        ...result,
      };
    })
    .filter((s): s is SuggestedAssignment => s != null)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  return scored;
}

export async function getMentorReusability(mentorId: string) {
  const mentor = await prisma.mentorNode.findUnique({
    where: { id: mentorId },
    include: { historicalOutcomes: { orderBy: { cohortYear: "desc" } } },
  });
  if (!mentor) {
    return { trackRecord: null, suggestedAssignments: [] };
  }

  const skillMatrix = parseSkillMatrix(mentor.dynamicSkillMatrix);
  const trackRecord = buildMentorTrackRecord(mentor.historicalOutcomes, skillMatrix);
  const suggestedAssignments = await suggestAssignmentsForMentor(mentorId);

  return { trackRecord, suggestedAssignments };
}
