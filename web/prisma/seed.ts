import bcrypt from "bcryptjs";
import { PrismaClient, ProgrammeType, ProjectState, RuleType, UserRole } from "@prisma/client";

export const prisma = new PrismaClient();

const DEMO_PASSWORD = "demo123";

async function seedUsers() {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = [
    { email: "admin@cradle.com", name: "Cradle Admin", role: UserRole.Admin },
    { email: "founder@demo.com", name: "Demo Founder", role: UserRole.Founder },
    { email: "mentor@cradle.com", name: "Demo Mentor", role: UserRole.Mentor },
    { email: "investor@cradle.com", name: "Demo Investor", role: UserRole.Investor },
  ];
  for (const u of users) {
    await prisma.user.create({
      data: { ...u, passwordHash: hash },
    });
  }
}

async function createSeededApplication(
  normalized: Record<string, unknown>,
  grantId: string,
  options?: { projectState?: ProjectState },
) {
  const n = normalized as {
    founderName: string;
    founderEmail: string;
    companyName: string;
    country: string;
    sector: string;
    stage: string;
    pitchText?: string;
    mrr: number;
    cac: number;
    runwayMonths: number;
    activeUsers: number;
    burnMonthly?: number;
    grossMarginPct?: number;
    fundingAsk?: number;
  };

  const project = await prisma.ecosystemProject.create({
    data: {
      name: n.companyName,
      state: options?.projectState ?? "Lead",
      sector: n.sector,
      stage: n.stage,
      country: n.country,
      founderName: n.founderName,
      founderEmail: n.founderEmail,
      metricsHistory: JSON.stringify({ mrr: n.mrr, cac: n.cac, runwayMonths: n.runwayMonths }),
      passportSnapshot: JSON.stringify({ intake: normalized }),
    },
  });

  const app = await prisma.application.create({
    data: {
      ecosystemProjectId: project.id,
      targetProgrammeId: grantId,
      status: "Submitted",
      rawApplication: JSON.stringify(normalized),
      normalizedApplication: JSON.stringify(normalized),
      pitchText: n.pitchText ?? null,
      financialMetrics: JSON.stringify({
        mrr: n.mrr,
        cac: n.cac,
        runwayMonths: n.runwayMonths,
        burnMonthly: n.burnMonthly,
        grossMarginPct: n.grossMarginPct,
        fundingAsk: n.fundingAsk,
      }),
    },
  });

  return { project, app };
}

export async function seedDatabase() {
  await prisma.auditEvent.deleteMany();
  await prisma.routingDecision.deleteMany();
  await prisma.intakeAudit.deleteMany();
  await prisma.application.deleteMany();
  await prisma.ecosystemProject.deleteMany();
  await prisma.user.deleteMany();
  await prisma.programmeRule.deleteMany();
  await prisma.programme.deleteMany();
  await prisma.benchmarkProfile.deleteMany();

  const programmes = await Promise.all([
    prisma.programme.create({
      data: {
        slug: "cradle-grant",
        name: "Cradle Grant Track",
        type: ProgrammeType.Grant,
        description: "Grant track for incorporated Malaysia startups at MVP stage or later.",
        priority: 100,
      },
    }),
    prisma.programme.create({
      data: {
        slug: "mystartup-pre-accelerator",
        name: "MYStartup Pre-Accelerator",
        type: ProgrammeType.Pre_Accelerator,
        description: "Early-stage programme for product validation and go-to-market readiness.",
        priority: 80,
      },
    }),
    prisma.programme.create({
      data: {
        slug: "mentor-readiness",
        name: "Mentor Readiness Track",
        type: ProgrammeType.Mentorship,
        description: "Readiness track for structured mentorship and cohort participation.",
        priority: 70,
      },
    }),
    prisma.programme.create({
      data: {
        slug: "financial-model-repair",
        name: "Financial Model Repair Track",
        type: ProgrammeType.Sandbox,
        description: "Financial model improvement before grant resubmission.",
        priority: 60,
      },
    }),
    prisma.programme.create({
      data: {
        slug: "vc-readiness",
        name: "VC Readiness Track",
        type: ProgrammeType.VC_Readiness,
        description: "Preparation track for investor readiness and VC handoff.",
        priority: 50,
      },
    }),
  ]);

  const grant = programmes.find((p) => p.slug === "cradle-grant")!;
  const preAccel = programmes.find((p) => p.slug === "mystartup-pre-accelerator")!;

  const grantRules = [
    { ruleKey: "country", ruleType: RuleType.Hard, operator: "eq", expectedValue: '"Malaysia"', failureReason: "The grant is only available to Malaysia-based startups.", weight: 1 },
    { ruleKey: "incorporated", ruleType: RuleType.Hard, operator: "eq", expectedValue: "true", failureReason: "The company must be incorporated.", weight: 1 },
    { ruleKey: "stage_in", ruleType: RuleType.Hard, operator: "in", expectedValue: '["MVP","Revenue","Growth"]', failureReason: "Idea-stage startups are not grant-ready.", weight: 1 },
    { ruleKey: "funding_ask_max", ruleType: RuleType.Hard, operator: "lte", expectedValue: "500000", failureReason: "Funding ask exceeds the RM500,000 grant limit.", weight: 1 },
    { ruleKey: "runway_min", ruleType: RuleType.Hard, operator: "gte", expectedValue: "3", failureReason: "Runway is below the 3-month minimum.", weight: 1 },
    { ruleKey: "sector_not_excluded", ruleType: RuleType.Hard, operator: "not_in", expectedValue: '["Gambling","Adult"]', failureReason: "The sector is excluded from the programme.", weight: 1 },
    { ruleKey: "mrr_min", ruleType: RuleType.Soft, operator: "gte", expectedValue: "5000", failureReason: "MRR is below the recommended grant-readiness threshold.", weight: 2 },
  ];

  for (const r of grantRules) {
    await prisma.programmeRule.create({ data: { programmeId: grant.id, ...r } });
  }

  await prisma.programmeRule.createMany({
    data: [
      { programmeId: preAccel.id, ruleKey: "country", ruleType: RuleType.Hard, operator: "eq", expectedValue: '"Malaysia"', failureReason: "This programme is scoped to Malaysia-based startups.", weight: 1 },
      { programmeId: preAccel.id, ruleKey: "stage_not", ruleType: RuleType.Soft, operator: "not_in", expectedValue: '["Growth"]', failureReason: "Growth-stage startups are usually better suited for VC Readiness.", weight: 1 },
    ],
  });

  const sectors = ["SaaS", "Fintech", "Healthtech"];
  const stages = ["MVP", "Revenue", "Growth"];
  const metrics = [
    { name: "cac", p25: 80, median: 120, p75: 200 },
    { name: "mrr", p25: 3000, median: 8000, p75: 25000 },
    { name: "runway_months", p25: 4, median: 8, p75: 14 },
    { name: "active_users", p25: 50, median: 250, p75: 1200 },
    { name: "pilots", p25: 0, median: 1, p75: 3 },
    { name: "revenue_growth_pct", p25: 5, median: 15, p75: 35 },
  ];

  for (const sector of sectors) {
    for (const stage of stages) {
      for (const m of metrics) {
        await prisma.benchmarkProfile.create({
          data: {
            sector,
            stage,
            metricName: m.name,
            p25: m.p25,
            median: m.median,
            p75: m.p75,
            successfulCohortCount: 24,
            sourceCohortYear: 2024,
          },
        });
      }
    }
  }

  await seedUsers();

  const payFlowNormalized = {
    founderName: "Aisha Rahman",
    founderEmail: "aisha@payflow.my",
    companyName: "PayFlow MY",
    country: "Malaysia",
    sector: "Fintech",
    stage: "Revenue",
    incorporated: true,
    companyAgeMonths: 18,
    problem: "SMEs in Malaysia struggle with fragmented payment reconciliation across banks.",
    solution: "Unified B2B payment orchestration with automated reconciliation.",
    targetCustomers: "SME retailers and F&B chains with 5-50 outlets.",
    tractionSummary: "12 paying SME clients, 2 enterprise pilots in progress.",
    mrr: 12000,
    activeUsers: 340,
    pilots: 2,
    revenueGrowthPct: 22,
    cac: 180,
    burnMonthly: 45000,
    runwayMonths: 5,
    grossMarginPct: 62,
    fundingAsk: 350000,
    useOfFunds: "Expand sales team and complete enterprise pilot integrations.",
    pitchText: "PayFlow automates B2B payment reconciliation for Malaysian SMEs.",
    submittedAt: new Date().toISOString(),
  };

  const { app: payFlowApp, project: payFlowProject } = await createSeededApplication(
    payFlowNormalized,
    grant.id,
    { projectState: "In_Program" },
  );

  const founderDemoNormalized = {
    founderName: "Demo Founder",
    founderEmail: "founder@demo.com",
    companyName: "GreenRoute",
    country: "Malaysia",
    sector: "Cleantech",
    stage: "Idea",
    incorporated: false,
    companyAgeMonths: 4,
    problem: "Urban logistics fleets lack affordable tools to measure and reduce carbon emissions per delivery.",
    solution: "Lightweight route optimization with emissions tracking for last-mile fleets.",
    targetCustomers: "Regional courier and grocery delivery fleets in Klang Valley.",
    tractionSummary: "LOI from one fleet operator; prototype tested on 200 deliveries.",
    mrr: 0,
    activeUsers: 0,
    pilots: 1,
    revenueGrowthPct: 0,
    cac: 0,
    burnMonthly: 8000,
    runwayMonths: 8,
    grossMarginPct: 0,
    fundingAsk: 150000,
    useOfFunds: "Build MVP and run paid pilot with two fleet partners.",
    pitchText: "GreenRoute helps Malaysian fleets cut emissions while saving fuel costs.",
    submittedAt: new Date().toISOString(),
  };

  const { app: greenRouteApp } = await createSeededApplication(founderDemoNormalized, grant.id);

  const healthSyncNormalized = {
    founderName: "Dr. Lim Wei",
    founderEmail: "wei@healthsync.my",
    companyName: "HealthSync",
    country: "Malaysia",
    sector: "Healthtech",
    stage: "MVP",
    incorporated: true,
    companyAgeMonths: 14,
    problem: "Clinics lose patients due to fragmented follow-up after discharge.",
    solution: "Automated patient follow-up workflows integrated with clinic EMR exports.",
    targetCustomers: "Private clinics and specialist practices in Peninsular Malaysia.",
    tractionSummary: "5 clinic pilots, 2 converted to paid plans.",
    mrr: 4500,
    activeUsers: 120,
    pilots: 5,
    revenueGrowthPct: 12,
    cac: 95,
    burnMonthly: 18000,
    runwayMonths: 4,
    grossMarginPct: 55,
    fundingAsk: 200000,
    useOfFunds: "Hire clinical success lead and expand to Johor clinics.",
    pitchText: "HealthSync automates post-discharge follow-up for Malaysian clinics.",
    submittedAt: new Date().toISOString(),
  };

  const { app: healthSyncApp } = await createSeededApplication(healthSyncNormalized, grant.id);

  await prisma.ecosystemProject.createMany({
    data: [
      {
        name: "NovaAnalytics",
        state: "Graduated",
        sector: "SaaS",
        stage: "Growth",
        country: "Malaysia",
        founderName: "Raj Kumar",
        founderEmail: "raj@novaanalytics.my",
        metricsHistory: JSON.stringify({ mrr: 45000, cac: 110, runwayMonths: 14 }),
        passportSnapshot: JSON.stringify({
          cradleVerified: true,
          graduatedAt: "2025-11-01",
          programmesCompleted: ["Cradle Grant Track", "Mentor Readiness Track"],
          readinessAtGraduation: 82,
          highlights: ["3x MRR growth during programme", "Expanded to Singapore pilot"],
          investorSummary: "B2B analytics platform for retail chains with strong unit economics.",
        }),
      },
      {
        name: "FarmLink",
        state: "Graduated",
        sector: "Cleantech",
        stage: "Revenue",
        country: "Malaysia",
        founderName: "Siti Aminah",
        founderEmail: "siti@farmlink.my",
        metricsHistory: JSON.stringify({ mrr: 22000, cac: 75, runwayMonths: 10 }),
        passportSnapshot: JSON.stringify({
          cradleVerified: true,
          graduatedAt: "2025-09-15",
          programmesCompleted: ["MYStartup Pre-Accelerator", "VC Readiness Track"],
          readinessAtGraduation: 74,
          highlights: ["Secured 2 agribusiness enterprise contracts", "Improved gross margin to 58%"],
          investorSummary: "Agri supply-chain traceability with verified sustainability metrics.",
        }),
      },
    ],
  });

  const { runApplicationAudit } = await import("../src/server/services/intake/runAudit");
  await runApplicationAudit(payFlowApp.id);
  await runApplicationAudit(greenRouteApp.id);
  await runApplicationAudit(healthSyncApp.id);

  console.log(
    "Seed complete: users (4 demo roles), programmes, benchmarks, 3 audited applications, 2 graduated startups for investor demo",
  );
  console.log(`PayFlow MY project id (In_Program): ${payFlowProject.id}`);
}

if (process.argv[1]?.endsWith("seed.ts")) {
  seedDatabase()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e);
      prisma.$disconnect();
      process.exit(1);
    });
}
