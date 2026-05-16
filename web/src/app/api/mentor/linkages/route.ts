import { UserRole } from "@prisma/client";
import { jsonOk, OPTIONS } from "@/lib/api";
import { requireAuthWithRoles } from "@/lib/auth";
import { prisma } from "@/lib/db";

export { OPTIONS };

export async function GET(request: Request) {
  const auth = await requireAuthWithRoles(request, [UserRole.Mentor, UserRole.Admin]);
  if (auth instanceof Response) return auth;

  const mentorUser =
    auth.role === UserRole.Mentor
      ? await prisma.user.findUnique({ where: { email: auth.email }, include: { mentorNode: true } })
      : null;
  const mentor = mentorUser?.mentorNode ?? null;

  const linkages = await prisma.linkageEntity.findMany({
    where: mentor ? { mentorNodeId: mentor.id } : undefined,
    include: { ecosystemProject: true, mentor: true },
    orderBy: { updatedAt: "desc" },
  });

  return jsonOk({ linkages });
}
