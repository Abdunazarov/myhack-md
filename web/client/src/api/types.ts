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
    metricsHistory?: string;
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

export type Programme = {
  id: string;
  slug: string;
  name: string;
  type: string;
  active: boolean;
  priority: number;
};

export type AdminDecisionType =
  | "approve_grant"
  | "confirm_route"
  | "reject"
  | "request_info";

export type AdminDecision = {
  decision: AdminDecisionType;
  programmeId?: string;
  adminNote?: string;
};

export type AdminIntakeDetailResponse = {
  application: ApplicationRecord;
  programmes: Programme[];
};

export type FounderProject = {
  id: string;
  name: string;
  state: string;
  sector: string;
  stage: string;
  latestApplication: ApplicationRecord | null;
  activeLinkages: Array<{
    id: string;
    status: string;
    mentor?: { name: string; expertise?: string };
  }>;
  mentorMatchingEligible: boolean;
};

export type FounderDashboard = {
  founder: { name: string; email: string };
  projects: FounderProject[];
  stats: {
    applications: number;
    activeMentorships: number;
  };
};

export type RoadblockRequest = {
  ecosystemProjectId: string;
  roadblock: string;
  problemCategory?: string;
  stage?: string;
  sector?: string;
};

export type MentorDashboard = {
  module?: string;
  status?: string;
  message?: string;
  mentor?: {
    id?: string;
    name: string;
    email?: string;
    title?: string;
    activeCount?: number;
    capacity?: number;
  };
  stats?: {
    assignedStartups?: number;
    requiresIntervention?: number;
    completedSessions?: number;
    historicalOutcomes?: number;
    capacity?: number;
    capacityUsed?: number;
  };
  analytics?: {
    cohortHealthTrend: number[];
    sectorBreakdown: Array<{ sector: string; count: number }>;
    outcomeBreakdown: { success: number; fail: number; pivot: number };
    topSkills: Array<{ tag: string; score: number }>;
    healthDistribution: Array<{ name: string; healthScore: number }>;
  };
  assignedStartups?: Array<{
    linkageId: string;
    projectId: string;
    name: string;
    sector: string;
    stage: string;
    healthScore: number | null;
    goal: string | null;
    lastActivityAt: string | null;
    healthHistory?: number[];
    matchScore?: number | null;
  }>;
  interventionQueue?: Array<{
    linkageId: string;
    startup: string;
    healthScore: number | null;
    goal: string | null;
  }>;
  recentHistoricalWins?: Array<{
    startupName: string;
    sector: string;
    problemTags: string[];
    feedbackLog: string;
  }>;
  trackRecord?: {
    headline: string;
    subheadline: string;
    bySector: Array<{
      sector: string;
      mentored: number;
      successCount: number;
      successRate: number;
      highlights: Array<{
        startupName: string;
        outcome: string;
        cohortYear: number;
        snippet: string;
      }>;
    }>;
    provenSkills: Array<{ tag: string; score: number; proof: string }>;
  };
  suggestedAssignments?: Array<{
    projectId: string;
    name: string;
    sector: string;
    stage: string;
    roadblock: string;
    matchScore: number;
    matchedCriteria: string[];
    explanation: string;
    similarPastWin: {
      startupName: string;
      sector: string;
      outcome: string;
      feedbackLog: string;
    } | null;
  }>;
};

export type RoadblockResponse = {
  linkage: { id: string; status: string };
  request: { id: string; roadblock: string };
  match: {
    mentor: { name: string; expertise?: string };
    matchScore: number;
    explanation: string;
    problemTags: string[];
    alternatives?: Array<{ name: string; matchScore: number }>;
  };
};
