import { UserRole } from "@prisma/client";
import { z } from "zod";
import { jsonError, jsonOk, OPTIONS } from "@/lib/api";
import { requireAuthWithRoles } from "@/lib/auth";
import { appendLinkageFeedback } from "@/server/services/mentor/createLinkage";

export { OPTIONS };

const schema = z.object({
  note: z.string().min(5),
  sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthWithRoles(request, [
    UserRole.Mentor,
    UserRole.Founder,
    UserRole.Admin,
  ]);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten());
  }

  const actorType =
    auth.role === UserRole.Mentor
      ? "mentor"
      : auth.role === UserRole.Founder
        ? "founder"
        : "admin";

  const updated = await appendLinkageFeedback(id, {
    note: parsed.data.note,
    sentiment: parsed.data.sentiment,
    actorType,
  });

  return jsonOk({ linkage: updated });
}
