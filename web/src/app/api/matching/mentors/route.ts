import { jsonOk, OPTIONS } from "@/lib/api";
import { prisma } from "@/lib/db";
import { parseSkillMatrix } from "@/server/services/mentor/skillTags";

export { OPTIONS };

/** Public catalog of mentor skill matrices (2024 cohort intelligence). */
export async function GET() {
  const mentors = await prisma.mentorNode.findMany({
    where: { active: true },
    include: {
      _count: { select: { historicalOutcomes: true, linkages: true } },
    },
    orderBy: { name: "asc" },
  });

  return jsonOk({
    mentors: mentors.map((m) => ({
      id: m.id,
      name: m.name,
      title: m.title,
      availabilityCapacity: m.availabilityCapacity,
      activeLinkages: m._count.linkages,
      historicalOutcomes: m._count.historicalOutcomes,
      dynamicSkillMatrix: parseSkillMatrix(m.dynamicSkillMatrix),
      outcomeSummary: JSON.parse(m.outcomeSummary || "{}"),
    })),
  });
}
