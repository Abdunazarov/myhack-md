import { UserRole } from "@prisma/client";
import { jsonOk, OPTIONS } from "@/lib/api";
import { requireAuthWithRoles } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseSkillMatrix } from "@/server/services/mentor/skillTags";

export { OPTIONS };

export async function GET(request: Request) {
  const auth = await requireAuthWithRoles(request, [UserRole.Admin]);
  if (auth instanceof Response) return auth;

  const mentors = await prisma.mentorNode.findMany({
    include: {
      historicalOutcomes: true,
      linkages: { where: { status: "Active" } },
    },
    orderBy: { name: "asc" },
  });

  return jsonOk({
    mentors: mentors.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      title: m.title,
      activeLinkages: m.linkages.length,
      capacity: m.availabilityCapacity,
      dynamicSkillMatrix: parseSkillMatrix(m.dynamicSkillMatrix),
      outcomeSummary: JSON.parse(m.outcomeSummary || "{}"),
      historicalOutcomes: m.historicalOutcomes.length,
    })),
  });
}
