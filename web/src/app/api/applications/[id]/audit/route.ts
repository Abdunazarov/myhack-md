import { UserRole } from "@prisma/client";
import { jsonError, jsonOk, OPTIONS } from "@/lib/api";
import { applicationBelongsToFounder, requireAuthWithRoles } from "@/lib/auth";
import { runApplicationAudit } from "@/server/services/intake/runAudit";
import { prisma } from "@/lib/db";

export { OPTIONS };

export async function POST(
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
    const audit = await runApplicationAudit(id);
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        targetProgramme: true,
        routingDecisions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    return jsonOk({ audit, application });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Audit failed", 500);
  }
}
