import { prisma } from "@/lib/db";

const PROGRAMME_SLUGS_ENROLL = [
  "grant-track",
  "mystartup-pre-accelerator",
  "mentor-readiness",
  "financial-model-repair",
  "vc-readiness",
];

/**
 * Module 1 completion: when admin confirms routing, move project into ecosystem programme.
 */
export async function enrollProjectInProgramme(applicationId: string, programmeId?: string) {
  const application = await prisma.application.findUniqueOrThrow({
    where: { id: applicationId },
    include: {
      ecosystemProject: true,
      targetProgramme: true,
      routingDecisions: { orderBy: { createdAt: "desc" }, take: 1, include: { recommendedProgramme: true } },
      intakeAudits: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const programme =
    programmeId != null
      ? await prisma.programme.findUnique({ where: { id: programmeId } })
      : application.targetProgramme;

  if (!programme || !PROGRAMME_SLUGS_ENROLL.includes(programme.slug)) {
    return application.ecosystemProject;
  }

  const audit = application.intakeAudits[0];
  const routing = application.routingDecisions[0];

  const passport = {
    enrolledAt: new Date().toISOString(),
    programme: programme.name,
    programmeSlug: programme.slug,
    readinessScore: audit?.readinessScore ?? null,
    routingDecision: routing?.decisionType ?? null,
    intakeComplete: true,
    mentorMatchingEligible: ["mentor-readiness", "mystartup-pre-accelerator", "vc-readiness"].includes(
      programme.slug,
    ),
  };

  return prisma.ecosystemProject.update({
    where: { id: application.ecosystemProjectId },
    data: {
      state: "In_Program",
      passportSnapshot: JSON.stringify({
        ...JSON.parse(application.ecosystemProject.passportSnapshot || "{}"),
        enrollment: passport,
      }),
    },
  });
}
