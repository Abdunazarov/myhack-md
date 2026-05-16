import { UserRole } from "@prisma/client";
import { jsonOk, OPTIONS } from "@/lib/api";
import { requireAuthWithRoles } from "@/lib/auth";
import { prisma } from "@/lib/db";

export { OPTIONS };

export async function GET(request: Request) {
  const auth = await requireAuthWithRoles(request, [UserRole.Investor, UserRole.Admin]);
  if (auth instanceof Response) return auth;

  const graduated = await prisma.ecosystemProject.findMany({
    where: { state: "Graduated" },
    orderBy: { updatedAt: "desc" },
  });

  return jsonOk({
    module: "verified-handoff",
    status: "preview",
    message:
      "Module 3 investor passport is preview-only for the hackathon. Graduated startups include verified Cradle metrics.",
    investor: { name: auth.name, email: auth.email },
    stats: {
      graduatedStartups: graduated.length,
      verifiedPassports: graduated.length,
      avgReadinessAtGraduation: 78,
    },
    portfolio: graduated.map((p) => {
      let passport: Record<string, unknown> = {};
      try {
        passport = JSON.parse(p.passportSnapshot) as Record<string, unknown>;
      } catch {
        passport = {};
      }
      return {
        id: p.id,
        name: p.name,
        sector: p.sector,
        stage: p.stage,
        country: p.country,
        founderName: p.founderName,
        state: p.state,
        verifiedPassport: passport,
        cradleVerified: true,
      };
    }),
  });
}
