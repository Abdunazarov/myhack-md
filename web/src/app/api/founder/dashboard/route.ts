import { UserRole } from "@prisma/client";
import { jsonOk, OPTIONS } from "@/lib/api";
import { requireAuthWithRoles } from "@/lib/auth";
import { prisma } from "@/lib/db";

export { OPTIONS };

export async function GET(request: Request) {
  const auth = await requireAuthWithRoles(request, [UserRole.Founder, UserRole.Admin]);
  if (auth instanceof Response) return auth;

  const email = auth.role === UserRole.Founder ? auth.email : undefined;

  const projects = await prisma.ecosystemProject.findMany({
    where: email ? { founderEmail: email } : undefined,
    include: {
      applications: {
        orderBy: { submittedAt: "desc" },
        take: 1,
        include: {
          intakeAudits: { orderBy: { createdAt: "desc" }, take: 1 },
          routingDecisions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { recommendedProgramme: true },
          },
          targetProgramme: true,
        },
      },
      linkages: {
        include: { mentor: true },
        orderBy: { updatedAt: "desc" },
      },
      roadblockRequests: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  return jsonOk({
    founder: { name: auth.name, email: auth.email },
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      state: p.state,
      sector: p.sector,
      stage: p.stage,
      latestApplication: p.applications[0] ?? null,
      activeLinkages: p.linkages.filter((l) => l.status === "Active"),
      mentorMatchingEligible: p.state === "In_Program" || p.state === "Lead",
    })),
    stats: {
      applications: projects.reduce((n, p) => n + p.applications.length, 0),
      activeMentorships: projects.reduce(
        (n, p) => n + p.linkages.filter((l) => l.status === "Active").length,
        0,
      ),
    },
  });
}
