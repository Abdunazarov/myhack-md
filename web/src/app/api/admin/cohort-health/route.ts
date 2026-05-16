import { UserRole } from "@prisma/client";
import { jsonOk, OPTIONS } from "@/lib/api";
import { requireAuthWithRoles } from "@/lib/auth";
import { getCohortHealthDashboard } from "@/server/services/cohort/computeCohortHealth";

export { OPTIONS };

export async function GET(request: Request) {
  const auth = await requireAuthWithRoles(request, [UserRole.Admin]);
  if (auth instanceof Response) return auth;

  const dashboard = await getCohortHealthDashboard();
  return jsonOk(dashboard);
}
