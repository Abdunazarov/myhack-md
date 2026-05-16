import { UserRole } from "@prisma/client";
import { jsonError, jsonOk, OPTIONS } from "@/lib/api";
import { requireAuthWithRoles } from "@/lib/auth";
import { isDemoResetEnabled } from "@/lib/env";

export { OPTIONS };

export async function POST(request: Request) {
  const auth = await requireAuthWithRoles(request, [UserRole.Admin]);
  if (auth instanceof Response) return auth;
  if (!isDemoResetEnabled) {
    return jsonError("Demo reset is disabled in this environment", 403);
  }

  const { seedDatabase, prisma } = await import("../../../../../../prisma/seed");
  await seedDatabase();

  const [applications, programmes, benchmarks] = await Promise.all([
    prisma.application.count(),
    prisma.programme.count(),
    prisma.benchmarkProfile.count(),
  ]);

  return jsonOk({
    success: true,
    seeded: {
      applications,
      programmes,
      benchmarks,
    },
  });
}
