import { UserRole } from "@prisma/client";
import { z } from "zod";
import { jsonError, jsonOk, OPTIONS } from "@/lib/api";
import { requireAuthWithRoles } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createRoadblockAndMatch } from "@/server/services/mentor/createLinkage";

export { OPTIONS };

const schema = z.object({
  ecosystemProjectId: z.string().min(1),
  roadblock: z.string().min(20),
  problemCategory: z.string().optional(),
  stage: z.string().optional(),
  sector: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAuthWithRoles(request, [UserRole.Founder, UserRole.Admin]);
  if (auth instanceof Response) return auth;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten());
  }

  const project = await prisma.ecosystemProject.findUnique({
    where: { id: parsed.data.ecosystemProjectId },
  });
  if (!project) return jsonError("Project not found", 404);

  if (
    auth.role === UserRole.Founder &&
    project.founderEmail.toLowerCase() !== auth.email.toLowerCase()
  ) {
    return jsonError("Forbidden", 403);
  }

  try {
    const result = await createRoadblockAndMatch({
      ...parsed.data,
      stage: parsed.data.stage ?? project.stage,
      sector: parsed.data.sector ?? project.sector,
      actorEmail: auth.email,
    });

    return jsonOk({
      linkage: result.linkage,
      request: result.request,
      match: {
        mentor: result.match.mentor,
        matchScore: result.match.matchScore,
        explanation: result.match.explanation,
        problemTags: result.match.problemTags,
        alternatives: result.match.alternatives,
      },
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Matching failed", 500);
  }
}
