import { UserRole } from "@prisma/client";
import { jsonOk, OPTIONS } from "@/lib/api";
import { requireAuthWithRoles } from "@/lib/auth";
import { prisma } from "@/lib/db";

export { OPTIONS };

export async function GET(request: Request) {
  const auth = await requireAuthWithRoles(request, [UserRole.Admin]);
  if (auth instanceof Response) return auth;
  const [totalApplications, totalProjects, applicationsByStatus, latestApplications] =
    await Promise.all([
      prisma.application.count(),
      prisma.ecosystemProject.count(),
      prisma.application.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.application.findMany({
        take: 10,
        orderBy: { submittedAt: "desc" },
        include: {
          ecosystemProject: true,
          targetProgramme: true,
          intakeAudits: { orderBy: { createdAt: "desc" }, take: 1 },
          routingDecisions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { recommendedProgramme: true },
          },
        },
      }),
    ]);

  const averageReadiness = await prisma.intakeAudit.aggregate({
    _avg: { readinessScore: true },
  });

  return jsonOk({
    totals: {
      applications: totalApplications,
      ecosystemProjects: totalProjects,
      averageReadinessScore: averageReadiness._avg.readinessScore ?? 0,
    },
    applicationsByStatus: applicationsByStatus.map((row) => ({
      status: row.status,
      count: row._count.status,
    })),
    latestApplications,
  });
}
