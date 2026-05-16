export type ApplicationStatus =
  | "Submitted"
  | "Auditing"
  | "Audited"
  | "Eligible"
  | "Rejected"
  | "Routed"
  | "Needs_Review";

export type ApplicationFormData = {
  founderName: string;
  founderEmail: string;
  companyName: string;
  country: string;
  sector: string;
  stage: "Idea" | "MVP" | "Revenue" | "Growth";
  incorporated: boolean;
  companyAgeMonths: number;
  problem: string;
  solution: string;
  targetCustomers: string;
  tractionSummary: string;
  mrr: number;
  activeUsers: number;
  pilots: number;
  revenueGrowthPct: number;
  cac: number;
  burnMonthly: number;
  runwayMonths: number;
  grossMarginPct: number;
  fundingAsk: number;
  useOfFunds: string;
  pitchText?: string;
};

export type ScoreBreakdown = {
  eligibilityFit: number;
  tractionStrength: number;
  financialHealth: number;
  marketSectorFit: number;
  dataCompleteness: number;
  total: number;
};

export type BenchmarkDelta = {
  metricName: string;
  value: number;
  median: number;
  deltaPct: number;
  status: "below" | "within" | "above";
  message: string;
};

export type RiskFlag = {
  severity: "high" | "medium" | "low";
  code: string;
  message: string;
};

export type AuditPayload = {
  readinessScore: number;
  scoreBreakdown: ScoreBreakdown;
  benchmarkDeltas: BenchmarkDelta[];
  strengths: string[];
  riskFlags: RiskFlag[];
  aiSummary: string;
  founderReport: string;
  aiFallback: boolean;
};

export type ProgrammeRef = {
  id: string;
  slug: string;
  name: string;
};

export type ApplicationRecord = {
  id: string;
  status: ApplicationStatus;
  submittedAt: string;
  ecosystemProject: {
    name: string;
    sector: string;
    founderName: string;
    founderEmail: string;
  };
  targetProgramme?: ProgrammeRef;
  intakeAudits?: Array<{
    readinessScore: number;
    aiSummary: string | null;
    founderReport: string | null;
    strengths: string;
    riskFlags: string;
    benchmarkDeltas: string;
    scoreBreakdown: string;
  }>;
  routingDecisions?: Array<{
    decisionType: string;
    explanation: string;
    recommendedProgramme?: ProgrammeRef;
  }>;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "Admin" | "Founder" | "Mentor" | "Investor";
};

export type DemoUser = {
  role: string;
  email: string;
  password: string;
  name: string;
  landingPath: string;
};

export type AdminDashboard = {
  totals: {
    applications: number;
    ecosystemProjects: number;
    averageReadinessScore: number;
  };
  applicationsByStatus: Array<{ status: ApplicationStatus; count: number }>;
  latestApplications: ApplicationRecord[];
};

export type CreateApplicationResponse = {
  applicationId: string;
  audit: AuditPayload;
  application: ApplicationRecord;
};

export type ApplicationDetailResponse = {
  application: ApplicationRecord;
  audit: AuditPayload | null;
  routing: ApplicationRecord["routingDecisions"] extends Array<infer T> ? T : null;
};
