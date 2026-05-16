import { UserRole } from "@prisma/client";
import { jsonOk, OPTIONS } from "@/lib/api";
import { requireAuthWithRoles } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseSkillMatrix } from "@/server/services/mentor/skillTags";

export { OPTIONS };

export async function GET(request: Request) {
  const auth = await requireAuthWithRoles(request, [UserRole.Mentor, UserRole.Admin]);
  if (auth instanceof Response) return auth;

  const mentorUser =
    auth.role === UserRole.Mentor
      ? await prisma.user.findUnique({ where: { email: auth.email }, include: { mentorNode: true } })
      : null;

  const mentor = mentorUser?.mentorNode
    ? await prisma.mentorNode.findUnique({
        where: { id: mentorUser.mentorNode.id },
        include: {
          linkages: {
            include: { ecosystemProject: true },
            orderBy: { updatedAt: "desc" },
          },
          historicalOutcomes: { orderBy: { createdAt: "desc" } },
        },
      })
    : await prisma.mentorNode.findFirst({
        include: {
      linkages: {
        include: { ecosystemProject: true },
        orderBy: { updatedAt: "desc" },
      },
      historicalOutcomes: { orderBy: { createdAt: "desc" } },
        },
      });

  if (!mentor && auth.role === UserRole.Mentor) {
    return jsonOk({
      module: "dynamic-cohort-orchestration",
      message: "No mentor profile linked to this account",
      mentor: { name: auth.name, email: auth.email },
    });
  }

  const node =
    mentor ??
    (await prisma.mentorNode.findFirst({
      include: {
        linkages: { include: { ecosystemProject: true } },
        historicalOutcomes: { take: 5 },
      },
    }));

  if (!node) {
    return jsonOk({ module: "dynamic-cohort-orchestration", linkages: [], stats: {} });
  }

  const active = node.linkages.filter((l) => l.status === "Active");
  const intervention = node.linkages.filter((l) => l.status === "Requires_Intervention");
  const completed = node.linkages.filter((l) => l.status === "Completed");

  function parseHealthHistory(feedbackLogs: string): number[] {
    try {
      const logs = JSON.parse(feedbackLogs) as Array<{ type?: string; score?: number }>;
      return logs.filter((e) => e.type === "health" && typeof e.score === "number").map((e) => e.score!);
    } catch {
      return [];
    }
  }

  const sectorCounts: Record<string, number> = {};
  for (const l of active) {
    const s = l.ecosystemProject.sector;
    sectorCounts[s] = (sectorCounts[s] ?? 0) + 1;
  }

  const cohortHealthTrend = [0, 1, 2, 3, 4, 5].map((i) => {
    const scores = active
      .map((l) => parseHealthHistory(l.feedbackLogs)[i])
      .filter((s): s is number => typeof s === "number");
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  });

  const historical = node.historicalOutcomes;
  const outcomeBreakdown = {
    success: historical.filter((h) => h.outcome === "Success").length,
    fail: historical.filter((h) => h.outcome === "Fail").length,
    pivot: historical.filter((h) => h.outcome === "Pivot").length,
  };

  const skillMatrix = parseSkillMatrix(node.dynamicSkillMatrix);
  const topSkills = Object.entries(skillMatrix)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([tag, score]) => ({ tag: tag.replace(/_/g, " "), score: Math.round((score as number) * 100) }));

  return jsonOk({
    module: "dynamic-cohort-orchestration",
    status: "live",
    mentor: {
      id: node.id,
      name: node.name,
      email: node.email,
      title: node.title,
      dynamicSkillMatrix: parseSkillMatrix(node.dynamicSkillMatrix),
      outcomeSummary: JSON.parse(node.outcomeSummary || "{}"),
      capacity: node.availabilityCapacity,
      activeCount: active.length,
    },
    stats: {
      assignedStartups: active.length,
      requiresIntervention: intervention.length,
      completedSessions: completed.length,
      historicalOutcomes: node.historicalOutcomes.length,
      capacity: node.availabilityCapacity,
      capacityUsed: active.length + intervention.length,
    },
    analytics: {
      cohortHealthTrend,
      sectorBreakdown: Object.entries(sectorCounts).map(([sector, count]) => ({ sector, count })),
      outcomeBreakdown,
      topSkills,
      healthDistribution: active.map((l) => ({
        name: l.ecosystemProject.name,
        healthScore: l.healthScore,
      })),
    },
    assignedStartups: active.map((l) => ({
      linkageId: l.id,
      projectId: l.ecosystemProjectId,
      name: l.ecosystemProject.name,
      sector: l.ecosystemProject.sector,
      stage: l.ecosystemProject.stage,
      healthScore: l.healthScore,
      goal: l.goal,
      lastActivityAt: l.lastActivityAt,
      healthHistory: parseHealthHistory(l.feedbackLogs),
      matchScore: l.matchScore,
    })),
    interventionQueue: intervention.map((l) => ({
      linkageId: l.id,
      startup: l.ecosystemProject.name,
      healthScore: l.healthScore,
      goal: l.goal,
    })),
    recentHistoricalWins: historical
      .filter((h) => h.outcome === "Success")
      .slice(0, 8)
      .map((h) => ({
        startupName: h.startupName,
        sector: h.sector,
        problemTags: JSON.parse(h.problemTags),
        feedbackLog: h.feedbackLog.slice(0, 200),
      })),
  });
}
