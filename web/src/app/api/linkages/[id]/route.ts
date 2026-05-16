import { LinkageStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { jsonError, jsonOk, OPTIONS } from "@/lib/api";
import { requireAuthWithRoles } from "@/lib/auth";
import { prisma } from "@/lib/db";

export { OPTIONS };

const patchSchema = z.object({
  status: z.nativeEnum(LinkageStatus).optional(),
  finalOutcome: z.enum(["Success", "Fail", "Pivot"]).optional(),
  healthScore: z.number().min(0).max(100).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const linkage = await prisma.linkageEntity.findUnique({
    where: { id },
    include: { mentor: true, ecosystemProject: true },
  });
  if (!linkage) return jsonError("Linkage not found", 404);
  return jsonOk({ linkage });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthWithRoles(request, [UserRole.Admin, UserRole.Mentor]);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten());
  }

  const linkage = await prisma.linkageEntity.update({
    where: { id },
    data: {
      ...parsed.data,
      lastActivityAt: new Date(),
    },
    include: { mentor: true, ecosystemProject: true },
  });

  await prisma.auditEvent.create({
    data: {
      entityType: "linkage",
      entityId: id,
      eventType: "linkage_updated",
      actorType: auth.role.toLowerCase(),
      metadata: JSON.stringify(parsed.data),
    },
  });

  return jsonOk({ linkage });
}
