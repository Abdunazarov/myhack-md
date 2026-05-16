import type { ApplicationFormData } from "@/lib/validation/applicationSchema";

export type ScoreBreakdown = {
  eligibilityFit: number;
  tractionStrength: number;
  financialHealth: number;
  marketSectorFit: number;
  dataCompleteness: number;
  total: number;
};

export type EligibilityRuleResult = {
  ruleKey: string;
  passed: boolean;
  ruleType: "Hard" | "Soft";
  message: string;
  weight: number;
};

export type ProgrammeEligibilityResult = {
  programmeId: string;
  programmeSlug: string;
  programmeName: string;
  hardPass: boolean;
  softScore: number;
  rules: EligibilityRuleResult[];
};

export type BenchmarkDelta = {
  metricName: string;
  value: number;
  median: number;
  p25: number;
  p75: number;
  deltaPct: number;
  status: "below" | "within" | "above";
  message: string;
};

export type RiskFlag = {
  severity: "high" | "medium" | "low";
  code: string;
  message: string;
  field?: string;
};

export type AuditPayload = {
  readinessScore: number;
  scoreBreakdown: ScoreBreakdown;
  eligibilityResults: ProgrammeEligibilityResult[];
  benchmarkDeltas: BenchmarkDelta[];
  strengths: string[];
  riskFlags: RiskFlag[];
  missingInformation: string[];
  aiSummary: string;
  founderReport: string;
  modelUsed?: string;
  aiFallback: boolean;
};

export type RoutingResult = {
  decisionType: "Grant_Eligible" | "Auto_Routed" | "Needs_Review" | "Rejected";
  recommendedProgrammeId: string;
  recommendedProgrammeSlug: string;
  recommendedProgrammeName: string;
  reasonCodes: string[];
  explanation: string;
};

export type ApplicationInput = ApplicationFormData;
