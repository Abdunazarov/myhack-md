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
          historicalOutcomes: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      })
    : await prisma.mentorNode.findFirst({
        include: {
      linkages: {
        include: { ecosystemProject: true },
        orderBy: { updatedAt: "desc" },
      },
      historicalOutcomes: { orderBy: { createdAt: "desc" }, take: 5 },
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
      completedSessions: node.linkages.filter((l) => l.status === "Completed").length,
      historicalOutcomes: node.historicalOutcomes.length,
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
    })),
    interventionQueue: intervention.map((l) => ({
      linkageId: l.id,
      startup: l.ecosystemProject.name,
      healthScore: l.healthScore,
      goal: l.goal,
    })),
    recentHistoricalWins: node.historicalOutcomes
      .filter((h) => h.outcome === "Success")
      .map((h) => ({
        startupName: h.startupName,
        sector: h.sector,
        problemTags: JSON.parse(h.problemTags),
        feedbackLog: h.feedbackLog.slice(0, 200),
      })),
  });
}
