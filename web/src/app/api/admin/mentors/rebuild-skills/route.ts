import { UserRole } from "@prisma/client";
import { jsonOk, OPTIONS } from "@/lib/api";
import { requireAuthWithRoles } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rebuildAllMentorSkillMatrices } from "@/server/services/mentor/buildSkillMatrix";

export { OPTIONS };

/** Recomputes all mentor dynamic skill matrices from 2024 historical outcomes. */
export async function POST(request: Request) {
  const auth = await requireAuthWithRoles(request, [UserRole.Admin]);
  if (auth instanceof Response) return auth;

  const mentors = await prisma.mentorNode.findMany({
    include: { historicalOutcomes: true },
  });

  const updates = rebuildAllMentorSkillMatrices(mentors);
  for (const u of updates) {
    await prisma.mentorNode.update({
      where: { id: u.mentorId },
      data: {
        dynamicSkillMatrix: u.dynamicSkillMatrix,
        outcomeSummary: u.outcomeSummary,
      },
    });
  }

  return jsonOk({ rebuilt: updates.length, mentors: updates });
}
