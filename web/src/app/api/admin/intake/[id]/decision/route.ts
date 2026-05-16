import { UserRole } from "@prisma/client";
import { z } from "zod";
import { jsonError, jsonOk, OPTIONS } from "@/lib/api";
import { requireAuthWithRoles } from "@/lib/auth";
import { prisma } from "@/lib/db";

export { OPTIONS };

const decisionSchema = z.object({
  decision: z.enum(["approve_grant", "confirm_route", "reject", "request_info"]),
  programmeId: z.string().optional(),
  adminNote: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthWithRoles(request, [UserRole.Admin]);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const body = await request.json();
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten());
  }

  const { decision, programmeId, adminNote } = parsed.data;

  let status: "Eligible" | "Routed" | "Rejected" | "Needs_Review" = "Routed";
  if (decision === "approve_grant") status = "Eligible";
  if (decision === "reject") status = "Rejected";
  if (decision === "request_info") status = "Needs_Review";

  const application = await prisma.application.update({
    where: { id },
    data: {
      status,
      ...(programmeId ? { targetProgrammeId: programmeId } : {}),
    },
    include: { routingDecisions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const latestRouting = application.routingDecisions[0];
  if (latestRouting) {
    await prisma.routingDecision.update({
      where: { id: latestRouting.id },
      data: {
        adminConfirmed: decision === "confirm_route" || decision === "approve_grant",
        adminNote: adminNote ?? null,
        ...(programmeId ? { recommendedProgrammeId: programmeId } : {}),
      },
    });
  }

  await prisma.auditEvent.create({
    data: {
      entityType: "application",
      entityId: id,
      eventType: `admin_${decision}`,
      actorType: "admin",
      metadata: JSON.stringify({ adminNote, programmeId }),
    },
  });

  return jsonOk({ success: true, application });
}
