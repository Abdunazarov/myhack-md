import { jsonError, jsonOk, OPTIONS } from "@/lib/api";
import { prisma } from "@/lib/db";

export { OPTIONS };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const programme = await prisma.programme.findUnique({
    where: { slug },
    include: { rules: true },
  });

  if (!programme) return jsonError("Programme not found", 404);

  return jsonOk({ programme });
}
