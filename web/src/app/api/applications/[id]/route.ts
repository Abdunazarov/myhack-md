import { UserRole } from "@prisma/client";
import { jsonError, jsonOk, OPTIONS } from "@/lib/api";
import {
  applicationBelongsToFounder,
  getAuthUser,
  requireAuthWithRoles,
} from "@/lib/auth";
import { parseApplicationRequest } from "@/lib/parseApplicationRequest";
import { prisma } from "@/lib/db";
import { serializeAudit } from "@/server/serializers/application";
import { updateApplication } from "@/server/services/intake/updateApplication";
import { runApplicationAudit } from "@/server/services/intake/runAudit";

export { OPTIONS };

async function canAccessApplication(
  request: Request,
  applicationId: string,
): Promise<{ allowed: true } | Response> {
  const user = await getAuthUser(request);
  if (!user) {
    return jsonError("Authentication required", 401);
  }
  if (user.role === UserRole.Admin) return { allowed: true };
  if (user.role === UserRole.Founder) {
    const owns = await applicationBelongsToFounder(applicationId, user.email);
    if (!owns) return jsonError("Forbidden", 403);
    return { allowed: true };
  }
  if (user.role === UserRole.Mentor || user.role === UserRole.Investor) {
    return { allowed: true };
  }
  return jsonError("Forbidden", 403);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await canAccessApplication(request, id);
  if (!("allowed" in access)) return access;

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      ecosystemProject: true,
      targetProgramme: true,
      intakeAudits: { orderBy: { createdAt: "desc" }, take: 1 },
      routingDecisions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!application) {
    return jsonError("Application not found", 404);
  }

  const audit = application.intakeAudits[0];
  const routing = application.routingDecisions[0];

  return jsonOk({
    application,
    audit: serializeAudit(audit),
    routing,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAuthWithRoles(request, [UserRole.Founder, UserRole.Admin]);
  if (auth instanceof Response) return auth;

  if (auth.role === UserRole.Founder) {
    const owns = await applicationBelongsToFounder(id, auth.email);
    if (!owns) return jsonError("Forbidden", 403);
  }

  try {
    const parsed = await parseApplicationRequest(request, "update");
    if (!parsed.ok) {
      return jsonError("Validation failed", parsed.status, parsed.error);
    }

    const pitchOpts = parsed.value.pitchDeck
      ? {
          pitchDeckFileName: parsed.value.pitchDeck.fileName,
          pitchDeckMimeType: parsed.value.pitchDeck.mimeType,
          pitchDeckText: parsed.value.pitchDeck.text,
        }
      : undefined;

    const { application } = await updateApplication(id, parsed.value.data, pitchOpts);

    const url = new URL(request.url);
    const reaudit = url.searchParams.get("reaudit") === "true";
    let audit = null;
    if (reaudit) {
      audit = await runApplicationAudit(application.id);
    }

    const updated = await prisma.application.findUnique({
      where: { id },
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

    return jsonOk({ application: updated, audit });
  } catch (error) {
    console.error("PATCH /api/applications/:id", error);
    return jsonError(error instanceof Error ? error.message : "Internal error", 500);
  }
}
