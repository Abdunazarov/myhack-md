import { jsonOk, OPTIONS } from "@/lib/api";
import { prisma } from "@/lib/db";

export { OPTIONS };

export async function GET() {
  const programmes = await prisma.programme.findMany({
    where: { active: true },
    orderBy: { priority: "desc" },
    include: { rules: true },
  });

  return jsonOk({ programmes });
}
