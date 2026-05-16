import type { ApplicationFormData, NormalizedApplication } from "@/lib/validation/applicationSchema";

export function normalizeApplication(data: ApplicationFormData): NormalizedApplication {
  return {
    ...data,
    companyName: data.companyName.trim(),
    founderName: data.founderName.trim(),
    founderEmail: data.founderEmail.trim().toLowerCase(),
    country: data.country.trim(),
    sector: data.sector.trim(),
    problem: data.problem.trim(),
    solution: data.solution.trim(),
    targetCustomers: data.targetCustomers.trim(),
    tractionSummary: data.tractionSummary.trim(),
    useOfFunds: data.useOfFunds.trim(),
    pitchText: data.pitchText?.trim() ?? "",
    submittedAt: new Date().toISOString(),
  };
}
