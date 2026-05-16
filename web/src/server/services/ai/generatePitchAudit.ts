import type { NormalizedApplication } from "@/lib/validation/applicationSchema";
import { env } from "@/lib/env";
import type { BenchmarkDelta, RiskFlag } from "../intake/intakeTypes";
import { getGeminiModel } from "./geminiClient";

export type AiAuditResult = {
  strengths: string[];
  riskFlags: RiskFlag[];
  aiSummary: string;
  founderReport: string;
  modelUsed?: string;
  aiFallback: boolean;
};

function fallbackAudit(
  app: NormalizedApplication,
  benchmarkDeltas: BenchmarkDelta[],
  missingInformation: string[],
): AiAuditResult {
  const strengths: string[] = [];
  if (app.mrr > 0) strengths.push(`MRR of RM${app.mrr.toLocaleString()} shows commercial validation.`);
  if (app.pilots >= 1) strengths.push(`${app.pilots} pilot(s) indicate customer validation.`);
  if (app.runwayMonths >= 6) strengths.push(`${app.runwayMonths} months of runway gives the team execution time.`);

  const riskFlags: RiskFlag[] = [];
  if (app.runwayMonths < 3) {
    riskFlags.push({
      severity: "high",
      code: "low_runway",
      message: `Runway of ${app.runwayMonths} months is below the recommended minimum.`,
      field: "runwayMonths",
    });
  }
  for (const d of benchmarkDeltas.filter((b) => b.status === "above" && b.metricName === "cac")) {
    riskFlags.push({
      severity: "medium",
      code: "high_cac",
      message: d.message,
      field: "cac",
    });
  }
  if (missingInformation.length > 0) {
    riskFlags.push({
      severity: "low",
      code: "missing_data",
      message: `Missing information: ${missingInformation.join(", ")}`,
    });
  }

  return {
    strengths,
    riskFlags,
    aiSummary:
      "Rule-based audit (Gemini unavailable). Eligibility and benchmark comparison were completed deterministically.",
    founderReport: `${app.companyName} has been analyzed. Readiness is based on deterministic eligibility rules and 2025 cohort benchmarks. ${
      riskFlags.length ? "Review the flagged risks before resubmission." : "No critical risks were detected."
    }`,
    aiFallback: true,
  };
}

export async function generatePitchAudit(
  app: NormalizedApplication,
  benchmarkDeltas: BenchmarkDelta[],
  missingInformation: string[],
): Promise<AiAuditResult> {
  const model = getGeminiModel();
  if (!model) return fallbackAudit(app, benchmarkDeltas, missingInformation);

  const prompt = `You are an accelerator intake analyst for Malaysia's startup ecosystem.
Analyze this startup application. Use ONLY the provided data and benchmark deltas. Do not invent numbers.

Startup JSON:
${JSON.stringify(app, null, 2)}

Benchmark deltas:
${JSON.stringify(benchmarkDeltas, null, 2)}

Missing information:
${JSON.stringify(missingInformation)}

Return ONLY valid JSON with this exact structure:
{
  "strengths": ["string"],
  "riskFlags": [{"severity":"high|medium|low","code":"string","message":"string","field":"optional"}],
  "aiSummary": "2-3 sentences for admin in English",
  "founderReport": "3-4 sentences friendly report for the founder in English"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]) as AiAuditResult;
    return {
      ...parsed,
      modelUsed: env.GEMINI_MODEL,
      aiFallback: false,
    };
  } catch {
    return fallbackAudit(app, benchmarkDeltas, missingInformation);
  }
}
