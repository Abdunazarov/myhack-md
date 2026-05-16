import { UserRole } from "@prisma/client";
import { jsonError, jsonOk, OPTIONS } from "@/lib/api";
import { requireAuthWithRoles } from "@/lib/auth";
import { prisma } from "@/lib/db";

export { OPTIONS };

export async function GET(request: Request) {
  const auth = await requireAuthWithRoles(request, [
    UserRole.Founder,
    UserRole.Admin,
    UserRole.Mentor,
  ]);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  if (!projectId) {
    return jsonError("projectId query parameter is required", 400);
  }

  const [requests, linkages] = await Promise.all([
    prisma.roadblockRequest.findMany({
      where: { ecosystemProjectId: projectId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.linkageEntity.findMany({
      where: { ecosystemProjectId: projectId },
      include: { mentor: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return jsonOk({ requests, linkages });
}
