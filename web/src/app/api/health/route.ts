import { jsonOk, OPTIONS } from "@/lib/api";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";

export { OPTIONS };

export async function GET() {
  await prisma.$queryRaw`SELECT 1`;

  return jsonOk({
    status: "ok",
    service: "linkrouter-backend",
    module: "smart-intake-auto-routing",
    ai: {
      provider: "google-gemini",
      model: env.GEMINI_MODEL,
      configured: Boolean(env.GEMINI_API_KEY),
    },
    timestamp: new Date().toISOString(),
  });
}
