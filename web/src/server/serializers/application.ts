import { parseJson } from "@/lib/json";
import type {
  AuditPayload,
  BenchmarkDelta,
  ProgrammeEligibilityResult,
  RiskFlag,
  ScoreBreakdown,
} from "@/server/services/intake/intakeTypes";

type IntakeAuditRow = {
  readinessScore: number;
  scoreBreakdown: string;
  eligibilityResult: string;
  benchmarkDeltas: string;
  strengths: string;
  riskFlags: string;
  missingInformation: string;
  aiSummary: string | null;
  founderReport: string | null;
  modelUsed: string | null;
  aiFallback: boolean;
  createdAt: Date;
};

export function serializeAudit(audit: IntakeAuditRow | undefined): AuditPayload | null {
  if (!audit) return null;

  return {
    readinessScore: audit.readinessScore,
    scoreBreakdown: parseJson<ScoreBreakdown>(audit.scoreBreakdown, {
      eligibilityFit: 0,
      tractionStrength: 0,
      financialHealth: 0,
      marketSectorFit: 0,
      dataCompleteness: 0,
      total: audit.readinessScore,
    }),
    eligibilityResults: parseJson<ProgrammeEligibilityResult[]>(audit.eligibilityResult, []),
    benchmarkDeltas: parseJson<BenchmarkDelta[]>(audit.benchmarkDeltas, []),
    strengths: parseJson<string[]>(audit.strengths, []),
    riskFlags: parseJson<RiskFlag[]>(audit.riskFlags, []),
    missingInformation: parseJson<string[]>(audit.missingInformation, []),
    aiSummary: audit.aiSummary ?? "",
    founderReport: audit.founderReport ?? "",
    modelUsed: audit.modelUsed ?? undefined,
    aiFallback: audit.aiFallback,
  };
}
