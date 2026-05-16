import { UserRole } from "@prisma/client";
import { jsonOk, OPTIONS } from "@/lib/api";
import { requireAuthWithRoles } from "@/lib/auth";
import { prisma } from "@/lib/db";

export { OPTIONS };

export async function GET(request: Request) {
  const auth = await requireAuthWithRoles(request, [UserRole.Mentor, UserRole.Admin]);
  if (auth instanceof Response) return auth;

  const inProgram = await prisma.ecosystemProject.findMany({
    where: { state: "In_Program" },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  const mentorTrackApps = await prisma.application.findMany({
    where: {
      routingDecisions: {
        some: {
          recommendedProgramme: { slug: "mentor-readiness" },
        },
      },
    },
    include: {
      ecosystemProject: true,
      routingDecisions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { recommendedProgramme: true },
      },
      intakeAudits: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { submittedAt: "desc" },
    take: 10,
  });

  return jsonOk({
    module: "dynamic-cohort-orchestration",
    status: "preview",
    message:
      "Module 2 mentor matching is preview-only for the hackathon. Data below is seeded for demo storytelling.",
    mentor: { name: auth.name, email: auth.email },
    stats: {
      assignedStartups: inProgram.length,
      pendingLinkages: 2,
      completedSessions: 14,
    },
    assignedStartups: inProgram.map((p) => ({
      id: p.id,
      name: p.name,
      sector: p.sector,
      stage: p.stage,
      state: p.state,
      founderName: p.founderName,
    })),
    pipeline: mentorTrackApps.map((a) => ({
      applicationId: a.id,
      companyName: a.ecosystemProject.name,
      readinessScore: a.intakeAudits[0]?.readinessScore ?? null,
      programme: a.routingDecisions[0]?.recommendedProgramme.name ?? null,
      suggestedAction: "Schedule intro call",
    })),
    upcomingSessions: [
      { id: "s1", startup: "PayFlow MY", topic: "GTM review", scheduledAt: "2026-05-20T10:00:00Z" },
      { id: "s2", startup: "GreenLedger", topic: "Unit economics", scheduledAt: "2026-05-22T14:00:00Z" },
    ],
  });
}
