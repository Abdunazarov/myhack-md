import { prisma } from "@/lib/db";
import type { ApplicationFormData } from "@/lib/validation/applicationSchema";
import { normalizeApplication } from "./normalizeApplication";

export async function updateApplication(
  applicationId: string,
  data: Partial<ApplicationFormData> & Record<string, unknown>,
  options?: { pitchDeckFileName?: string; pitchDeckMimeType?: string; pitchDeckText?: string },
) {
  const existing = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { ecosystemProject: true },
  });
  if (!existing) throw new Error("Application not found");

  const currentNormalized = JSON.parse(existing.normalizedApplication) as ApplicationFormData & {
    submittedAt: string;
  };
  const merged = { ...currentNormalized, ...data };
  const normalized = normalizeApplication(merged as ApplicationFormData);

  const combinedPitchText = [normalized.pitchText, options?.pitchDeckText]
    .filter(Boolean)
    .join("\n\n")
    .trim();

  await prisma.ecosystemProject.update({
    where: { id: existing.ecosystemProjectId },
    data: {
      name: normalized.companyName,
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

  const application = await prisma.application.update({
    where: { id: applicationId },
    data: {
      rawApplication: JSON.stringify(merged),
      normalizedApplication: JSON.stringify(normalized),
      pitchText: combinedPitchText || null,
      pitchDeckFileName: options?.pitchDeckFileName ?? existing.pitchDeckFileName,
      pitchDeckMimeType: options?.pitchDeckMimeType ?? existing.pitchDeckMimeType,
      pitchDeckText: options?.pitchDeckText ?? existing.pitchDeckText,
      financialMetrics: JSON.stringify({
        mrr: normalized.mrr,
        cac: normalized.cac,
        burnMonthly: normalized.burnMonthly,
        runwayMonths: normalized.runwayMonths,
        grossMarginPct: normalized.grossMarginPct,
        fundingAsk: normalized.fundingAsk,
      }),
      status: "Submitted",
    },
  });

  await prisma.auditEvent.create({
    data: {
      entityType: "application",
      entityId: application.id,
      eventType: "application_updated",
      actorType: "founder",
      metadata: JSON.stringify({ fields: Object.keys(data) }),
    },
  });

  return { application, normalized };
}
