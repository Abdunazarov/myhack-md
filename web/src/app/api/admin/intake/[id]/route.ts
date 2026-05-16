import { UserRole } from "@prisma/client";
import { jsonError, jsonOk, OPTIONS } from "@/lib/api";
import { requireAuthWithRoles } from "@/lib/auth";
import { prisma } from "@/lib/db";

export { OPTIONS };

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthWithRoles(request, [UserRole.Admin]);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      ecosystemProject: true,
      targetProgramme: true,
      intakeAudits: { orderBy: { createdAt: "desc" } },
      routingDecisions: {
        orderBy: { createdAt: "desc" },
        include: { recommendedProgramme: true },
      },
    },
  });

  if (!application) {
    return jsonError("Application not found", 404);
  }

  const programmes = await prisma.programme.findMany({
    where: { active: true },
    orderBy: { priority: "desc" },
  });

  return jsonOk({ application, programmes });
}
