import { ProjectState, UserRole, type Prisma } from "@prisma/client";
import { jsonError, jsonOk, OPTIONS } from "@/lib/api";
import { requireAuthWithRoles } from "@/lib/auth";
import { parseApplicationRequest } from "@/lib/parseApplicationRequest";
import { prisma } from "@/lib/db";
import { createApplication } from "@/server/services/intake/createApplication";
import { runApplicationAudit } from "@/server/services/intake/runAudit";

export { OPTIONS };

export async function GET(request: Request) {
  const auth = await requireAuthWithRoles(request, [
    UserRole.Founder,
    UserRole.Admin,
    UserRole.Mentor,
    UserRole.Investor,
  ]);
  if (auth instanceof Response) return auth;

  let where: Prisma.ApplicationWhereInput = {};
  if (auth.role === UserRole.Founder) {
    where = { ecosystemProject: { founderEmail: auth.email } };
  } else if (auth.role === UserRole.Mentor) {
    where = {
      OR: [
        { ecosystemProject: { state: ProjectState.In_Program } },
        {
          routingDecisions: {
            some: { recommendedProgramme: { slug: "mentor-readiness" } },
          },
        },
      ],
    };
  } else if (auth.role === UserRole.Investor) {
    where = { ecosystemProject: { state: ProjectState.Graduated } };
  }

  const applications = await prisma.application.findMany({
    where,
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
  });

  return jsonOk({ applications });
}

export async function POST(request: Request) {
  const auth = await requireAuthWithRoles(request, [UserRole.Founder, UserRole.Admin]);
  if (auth instanceof Response) return auth;

  try {
    const parsed = await parseApplicationRequest(request);
    if (!parsed.ok) {
      return jsonError("Validation failed", parsed.status, parsed.error);
    }

    const founderEmail = "founderEmail" in parsed.value.data ? parsed.value.data.founderEmail : undefined;
    if (
      auth.role === UserRole.Founder &&
      founderEmail?.toLowerCase() !== auth.email.toLowerCase()
    ) {
      return jsonError("Founder email must match your account", 403);
    }

    const pitchOpts = parsed.value.pitchDeck
      ? {
          pitchDeckFileName: parsed.value.pitchDeck.fileName,
          pitchDeckMimeType: parsed.value.pitchDeck.mimeType,
          pitchDeckText: parsed.value.pitchDeck.text,
        }
      : undefined;

    const { application } = await createApplication(
      parsed.value.data as import("@/lib/validation/applicationSchema").ApplicationFormData,
      pitchOpts,
    );
    const audit = await runApplicationAudit(application.id);

    const updated = await prisma.application.findUnique({
      where: { id: application.id },
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
    });

    return jsonOk({
      applicationId: application.id,
      audit,
      application: updated,
    });
  } catch (error) {
    console.error("POST /api/applications", error);
    return jsonError(error instanceof Error ? error.message : "Internal error", 500);
  }
}
