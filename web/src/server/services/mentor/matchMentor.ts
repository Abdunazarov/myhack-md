import type { MentorNode } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  extractProblemTags,
  parseSkillMatrix,
  type SkillTag,
} from "./skillTags";

export type MentorMatchResult = {
  mentor: {
    id: string;
    name: string;
    email: string;
    title: string;
    dynamicSkillMatrix: Record<string, number>;
    outcomeSummary: Record<string, unknown>;
  };
  matchScore: number;
  explanation: string;
  problemTags: SkillTag[];
  alternatives: { mentorId: string; name: string; matchScore: number }[];
};

export async function matchMentorToRoadblock(input: {
  roadblock: string;
  problemCategory?: string | null;
  sector: string;
  stage: string;
  excludeMentorIds?: string[];
}): Promise<MentorMatchResult> {
  const problemTags = extractProblemTags(input.roadblock, input.problemCategory);

  const mentors = await prisma.mentorNode.findMany({
    where: { active: true },
    include: {
      linkages: { where: { status: "Active" } },
      historicalOutcomes: { take: 3, orderBy: { createdAt: "desc" } },
    },
  });

  const scored = mentors
    .filter((m) => !input.excludeMentorIds?.includes(m.id))
    .map((mentor) => scoreMentor(mentor, problemTags, input.sector, input.stage))
    .filter((s) => s.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);

  if (scored.length === 0) {
    throw new Error("No available mentors for this roadblock");
  }

  const best = scored[0];
  const mentor = mentors.find((m) => m.id === best.mentorId)!;

  return {
    mentor: {
      id: mentor.id,
      name: mentor.name,
      email: mentor.email,
      title: mentor.title,
      dynamicSkillMatrix: parseSkillMatrix(mentor.dynamicSkillMatrix),
      outcomeSummary: JSON.parse(mentor.outcomeSummary || "{}") as Record<string, unknown>,
    },
    matchScore: best.matchScore,
    explanation: best.explanation,
    problemTags,
    alternatives: scored.slice(1, 4).map((s) => ({
      mentorId: s.mentorId,
      name: mentors.find((m) => m.id === s.mentorId)!.name,
      matchScore: s.matchScore,
    })),
  };
}

function scoreMentor(
  mentor: MentorNode & {
    linkages: { id: string }[];
    historicalOutcomes: {
      startupName: string;
      outcome: string;
      problemTags: string;
      sector: string;
      stage: string;
    }[];
  },
  problemTags: SkillTag[],
  sector: string,
  stage: string,
): { mentorId: string; matchScore: number; explanation: string } {
  const matrix = parseSkillMatrix(mentor.dynamicSkillMatrix);
  const activeCount = mentor.linkages.length;
  if (activeCount >= mentor.availabilityCapacity) {
    return { mentorId: mentor.id, matchScore: 0, explanation: "" };
  }

  let tagScore = 0;
  const tagReasons: string[] = [];
  for (const tag of problemTags) {
    const skill = matrix[tag] ?? 0.5;
    tagScore += skill;
    if (skill >= 0.75) {
      tagReasons.push(`${tag.replace(/_/g, " ")} (${Math.round(skill * 100)}% historical success)`);
    }
  }
  tagScore = tagScore / problemTags.length;

  const sectorBonus = mentor.historicalOutcomes.some((h) => h.sector === sector) ? 0.08 : 0;
  const stageBonus = mentor.historicalOutcomes.some((h) => h.stage === stage) ? 0.05 : 0;
  const capacityPenalty = activeCount * 0.03;
  const matchScore = Math.round((tagScore + sectorBonus + stageBonus - capacityPenalty) * 100) / 100;

  const winExample = mentor.historicalOutcomes.find((h) => h.outcome === "Success");
  const explanationParts = [
    `Matched for ${problemTags.map((t) => t.replace(/_/g, " ")).join(", ")}.`,
    tagReasons.length
      ? `Strongest fit: ${tagReasons.slice(0, 2).join("; ")}.`
      : `Skill profile weighted across ${problemTags.length} dimensions.`,
  ];
  if (winExample) {
    explanationParts.push(
      `Historical proof: mentored ${winExample.startupName} (${JSON.parse(winExample.problemTags)[0] ?? "similar problem"}) to a successful outcome in 2024.`,
    );
  }
  explanationParts.push(
    `Currently mentoring ${activeCount}/${mentor.availabilityCapacity} startups.`,
  );

  return {
    mentorId: mentor.id,
    matchScore: Math.max(0, Math.min(1, matchScore)),
    explanation: explanationParts.join(" "),
  };
}
