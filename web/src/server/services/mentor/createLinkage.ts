import { prisma } from "@/lib/db";
import { matchMentorToRoadblock } from "./matchMentor";
import type { SkillTag } from "./skillTags";

export async function createRoadblockAndMatch(input: {
  ecosystemProjectId: string;
  roadblock: string;
  problemCategory?: string | null;
  stage: string;
  sector: string;
  actorEmail?: string;
}) {
  const project = await prisma.ecosystemProject.findUniqueOrThrow({
    where: { id: input.ecosystemProjectId },
  });

  const match = await matchMentorToRoadblock({
    roadblock: input.roadblock,
    problemCategory: input.problemCategory,
    sector: input.sector || project.sector,
    stage: input.stage || project.stage,
  });

  const linkage = await prisma.linkageEntity.create({
    data: {
      ecosystemProjectId: project.id,
      mentorNodeId: match.mentor.id,
      goal: input.roadblock,
      problemTags: JSON.stringify(match.problemTags),
      status: "Active",
      healthScore: 100,
      matchScore: match.matchScore,
      matchExplanation: match.explanation,
      lastActivityAt: new Date(),
    },
    include: {
      mentor: true,
      ecosystemProject: true,
    },
  });

  const request = await prisma.roadblockRequest.create({
    data: {
      ecosystemProjectId: project.id,
      roadblock: input.roadblock,
      problemCategory: input.problemCategory ?? null,
      stage: input.stage || project.stage,
      sector: input.sector || project.sector,
      status: "matched",
      matchedLinkageId: linkage.id,
      matchExplanation: match.explanation,
    },
  });

  if (project.state === "Lead") {
    await prisma.ecosystemProject.update({
      where: { id: project.id },
      data: { state: "In_Program" },
    });
  }

  await prisma.auditEvent.create({
    data: {
      entityType: "linkage",
      entityId: linkage.id,
      eventType: "mentor_matched",
      actorType: input.actorEmail ? "founder" : "system",
      metadata: JSON.stringify({
        mentorId: match.mentor.id,
        matchScore: match.matchScore,
        problemTags: match.problemTags,
      }),
    },
  });

  return { linkage, request, match };
}

export async function appendLinkageFeedback(
  linkageId: string,
  feedback: { note: string; sentiment?: "positive" | "neutral" | "negative"; actorType: string },
) {
  const linkage = await prisma.linkageEntity.findUniqueOrThrow({
    where: { id: linkageId },
  });

  const logs = JSON.parse(linkage.feedbackLogs || "[]") as {
    note: string;
    sentiment?: string;
    at: string;
    actorType: string;
  }[];
  logs.push({
    note: feedback.note,
    sentiment: feedback.sentiment ?? "neutral",
    at: new Date().toISOString(),
    actorType: feedback.actorType,
  });

  let healthScore = linkage.healthScore;
  if (feedback.sentiment === "positive") healthScore = Math.min(100, healthScore + 5);
  if (feedback.sentiment === "negative") healthScore = Math.max(0, healthScore - 15);

  const daysSinceActivity =
    (Date.now() - new Date(linkage.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceActivity > 14) healthScore = Math.max(0, healthScore - 20);

  let status = linkage.status;
  if (healthScore < 40) status = "Requires_Intervention";

  const updated = await prisma.linkageEntity.update({
    where: { id: linkageId },
    data: {
      feedbackLogs: JSON.stringify(logs),
      healthScore,
      status,
      lastActivityAt: new Date(),
    },
    include: { mentor: true, ecosystemProject: true },
  });

  return updated;
}

export function tagsFromLinkage(json: string): SkillTag[] {
  try {
    return JSON.parse(json) as SkillTag[];
  } catch {
    return [];
  }
}
