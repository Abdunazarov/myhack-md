import { prisma } from "@/lib/db";

export async function getCohortHealthDashboard() {
  const linkages = await prisma.linkageEntity.findMany({
    include: {
      ecosystemProject: true,
      mentor: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const active = linkages.filter((l) => l.status === "Active");
  const intervention = linkages.filter((l) => l.status === "Requires_Intervention");
  const completed = linkages.filter((l) => l.status === "Completed");

  const avgHealth =
    active.length > 0
      ? active.reduce((s, l) => s + l.healthScore, 0) / active.length
      : 0;

  const healthDistribution = [
    { band: "healthy", label: "70–100", count: active.filter((l) => l.healthScore >= 70).length },
    { band: "at_risk", label: "40–69", count: active.filter((l) => l.healthScore >= 40 && l.healthScore < 70).length },
    { band: "critical", label: "0–39", count: active.filter((l) => l.healthScore < 40).length },
  ];

  const staleLinkages = active.filter((l) => {
    const days = (Date.now() - new Date(l.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24);
    return days > 14;
  });

  return {
    module: "dynamic-cohort-orchestration",
    totals: {
      activeLinkages: active.length,
      requiresIntervention: intervention.length,
      completedLinkages: completed.length,
      averageHealthScore: Math.round(avgHealth * 10) / 10,
      staleLinkages: staleLinkages.length,
    },
    healthDistribution,
    interventionQueue: intervention.map((l) => ({
      linkageId: l.id,
      startup: l.ecosystemProject.name,
      mentor: l.mentor.name,
      healthScore: l.healthScore,
      goal: l.goal,
      daysSinceActivity: Math.floor(
        (Date.now() - new Date(l.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24),
      ),
    })),
    activeLinkages: active.map((l) => ({
      linkageId: l.id,
      startup: l.ecosystemProject.name,
      sector: l.ecosystemProject.sector,
      stage: l.ecosystemProject.stage,
      mentor: l.mentor.name,
      healthScore: l.healthScore,
      status: l.status,
      goal: l.goal.slice(0, 120),
      matchScore: l.matchScore,
    })),
    alerts: [
      ...intervention.map((l) => ({
        type: "requires_intervention" as const,
        linkageId: l.id,
        message: `${l.ecosystemProject.name} linkage health dropped to ${l.healthScore} — admin review recommended`,
      })),
      ...staleLinkages
        .filter((l) => l.status === "Active")
        .map((l) => ({
          type: "stale_activity" as const,
          linkageId: l.id,
          message: `No activity on ${l.ecosystemProject.name} ↔ ${l.mentor.name} for 14+ days`,
        })),
    ],
  };
}
