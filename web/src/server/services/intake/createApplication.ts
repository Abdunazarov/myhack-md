import { prisma } from "@/lib/db";
import type { ApplicationFormData } from "@/lib/validation/applicationSchema";
import { normalizeApplication } from "./normalizeApplication";

export async function createApplication(
  data: ApplicationFormData,
  options?: { pitchDeckFileName?: string; pitchDeckMimeType?: string; pitchDeckText?: string },
) {
  const normalized = normalizeApplication(data);
  const combinedPitchText = [normalized.pitchText, options?.pitchDeckText]
    .filter(Boolean)
    .join("\n\n")
    .trim();

  const grantProgramme = await prisma.programme.findUnique({
    where: { slug: "cradle-grant" },
  });
  if (!grantProgramme) throw new Error("Grant programme not seeded. Run: npm run db:seed");

  const project = await prisma.ecosystemProject.create({
    data: {
      name: normalized.companyName,
      state: "Lead",
      sector: normalized.sector,
      stage: normalized.stage,
      country: normalized.country,
      founderName: normalized.founderName,
      founderEmail: normalized.founderEmail,
      metricsHistory: JSON.stringify({
        mrr: normalized.mrr,
        cac: normalized.cac,
        runwayMonths: normalized.runwayMonths,
        activeUsers: normalized.activeUsers,
      }),
      passportSnapshot: JSON.stringify({ intake: normalized }),
    },
  });

  const application = await prisma.application.create({
    data: {
      ecosystemProjectId: project.id,
      targetProgrammeId: grantProgramme.id,
      status: "Submitted",
      rawApplication: JSON.stringify(data),
      normalizedApplication: JSON.stringify(normalized),
      pitchText: combinedPitchText || null,
      pitchDeckFileName: options?.pitchDeckFileName ?? null,
      pitchDeckMimeType: options?.pitchDeckMimeType ?? null,
      pitchDeckText: options?.pitchDeckText ?? null,
      financialMetrics: JSON.stringify({
        mrr: normalized.mrr,
        cac: normalized.cac,
        burnMonthly: normalized.burnMonthly,
        runwayMonths: normalized.runwayMonths,
        grossMarginPct: normalized.grossMarginPct,
        fundingAsk: normalized.fundingAsk,
      }),
    },
  });

  await prisma.auditEvent.create({
    data: {
      entityType: "application",
      entityId: application.id,
      eventType: "application_submitted",
      actorType: "founder",
      metadata: JSON.stringify({ companyName: normalized.companyName }),
    },
  });

  return { application, project, normalized };
}
