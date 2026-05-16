import { UserRole } from "@prisma/client";
import { jsonOk, OPTIONS } from "@/lib/api";
import { requireAuthWithRoles } from "@/lib/auth";
import { prisma } from "@/lib/db";

export { OPTIONS };

export async function GET(request: Request) {
  const auth = await requireAuthWithRoles(request, [UserRole.Admin]);
  if (auth instanceof Response) return auth;
  const applications = await prisma.application.findMany({
    orderBy: { submittedAt: "desc" },
    include: {
      ecosystemProject: true,
      targetProgramme: true,
      intakeAudits: { orderBy: { createdAt: "desc" }, take: 1 },
      routingDecisions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return jsonOk({ applications });
}
