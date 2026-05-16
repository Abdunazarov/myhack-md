import type { PrismaClient, RoutingDecisionType } from "@prisma/client";
import type { AuditPayload } from "../src/server/services/intake/intakeTypes";

type ShowcaseSpec = {
  companyName: string;
  status: "Eligible" | "Routed" | "Needs_Review";
  decisionType: RoutingDecisionType;
  programmeSlug: string;
  explanation: string;
  audit: AuditPayload;
  metricsHistory?: Record<string, unknown>;
  projectState?: "Lead" | "In_Program" | "Graduated";
};

function buildShowcaseSpecs(
  programmeIds: Record<string, string>,
): ShowcaseSpec[] {
  return [
    {
      companyName: "PayFlow MY",
      status: "Eligible",
      decisionType: "Grant_Eligible",
      programmeSlug: "grant-track",
      explanation:
        "Strong revenue traction and incorporated status meet grant criteria. Recommended for grant committee review with priority scoring.",
      projectState: "In_Program",
      metricsHistory: {
        mrrHistory: [4200, 5800, 7200, 9100, 10500, 12000],
        labels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
      },
      audit: {
        readinessScore: 84,
        scoreBreakdown: {
          eligibilityFit: 92,
          tractionStrength: 88,
          financialHealth: 78,
          marketSectorFit: 82,
          dataCompleteness: 95,
          total: 84,
        },
        eligibilityResults: [],
        benchmarkDeltas: [
          {
            metricName: "mrr",
            value: 12000,
            median: 8000,
            p25: 3000,
            p75: 25000,
            deltaPct: 50,
            status: "above",
            message: "MRR is 50% above the 2025 Fintech Revenue cohort median.",
          },
          {
            metricName: "cac",
            value: 180,
            median: 120,
            p25: 80,
            p75: 200,
            deltaPct: 50,
            status: "within",
            message: "CAC is within the typical range for B2B fintech at this stage.",
          },
          {
            metricName: "runway_months",
            value: 5,
            median: 8,
            p25: 4,
            p75: 14,
            deltaPct: -37.5,
            status: "below",
            message: "Runway is below cohort median — grant funds would extend execution window.",
          },
          {
            metricName: "active_users",
            value: 340,
            median: 250,
            p25: 50,
            p75: 1200,
            deltaPct: 36,
            status: "within",
            message: "Active user base aligns with revenue-stage fintech benchmarks.",
          },
        ],
        strengths: [
          "RM12,000 MRR with 12 paying SME clients demonstrates repeatable B2B sales.",
          "Two enterprise pilots in progress signal upmarket expansion potential.",
          "Incorporated entity with 18 months operating history de-risks grant disbursement.",
          "22% month-on-month revenue growth outpaces the 2025 fintech cohort median.",
        ],
        riskFlags: [
          {
            severity: "medium",
            code: "runway_pressure",
            message:
              "5 months runway is below the 8-month cohort median. Recommend pairing grant with milestone-based tranches.",
            field: "runwayMonths",
          },
          {
            severity: "low",
            code: "enterprise_concentration",
            message:
              "Two enterprise pilots represent 40% of pipeline — diversification plan should be documented.",
          },
        ],
        missingInformation: [],
        aiSummary:
          "PayFlow MY is a strong grant candidate with verified B2B revenue, incorporated status, and sector-fit for program's fintech track. Primary watchpoint is runway length relative to burn.",
        founderReport:
          "PayFlow MY scores 84/100 on readiness. Your B2B payment reconciliation product shows clear commercial validation with RM12k MRR and active enterprise pilots. You meet core grant eligibility criteria. Before final submission, prepare a runway extension narrative and pilot diversification plan — these strengthen the committee review.",
        aiFallback: false,
        modelUsed: "seed-showcase",
      },
    },
    {
      companyName: "GreenRoute",
      status: "Routed",
      decisionType: "Auto_Routed",
      programmeSlug: "mystartup-pre-accelerator",
      explanation:
        "Early-stage cleantech profile with pilot validation but pre-revenue metrics. Auto-routed to MYStartup Pre-Accelerator for incorporation support and GTM experiments.",
      projectState: "In_Program",
      metricsHistory: {
        mrrHistory: [0, 0, 0, 0, 0, 0],
        pilotsHistory: [0, 0, 1, 1, 1, 1],
        labels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
      },
      audit: {
        readinessScore: 67,
        scoreBreakdown: {
          eligibilityFit: 55,
          tractionStrength: 62,
          financialHealth: 58,
          marketSectorFit: 85,
          dataCompleteness: 88,
          total: 67,
        },
        eligibilityResults: [],
        benchmarkDeltas: [
          {
            metricName: "pilots",
            value: 1,
            median: 1,
            p25: 0,
            p75: 3,
            deltaPct: 0,
            status: "within",
            message: "One fleet pilot matches early cleantech cohort norms.",
          },
          {
            metricName: "mrr",
            value: 0,
            median: 3000,
            p25: 0,
            p75: 8000,
            deltaPct: -100,
            status: "below",
            message: "Pre-revenue — expected at Idea stage; focus on pilot conversion metrics.",
          },
          {
            metricName: "runway_months",
            value: 8,
            median: 8,
            p25: 4,
            p75: 14,
            deltaPct: 0,
            status: "within",
            message: "8 months runway provides adequate time for pre-accelerator milestones.",
          },
        ],
        strengths: [
          "LOI from a Klang Valley fleet operator validates problem-solution fit.",
          "Prototype tested on 200+ deliveries with measurable fuel savings data.",
          "Cleantech sector alignment with Malaysia's logistics decarbonisation priorities.",
          "8 months runway gives sufficient time to complete incorporation and MVP milestones.",
        ],
        riskFlags: [
          {
            severity: "high",
            code: "not_incorporated",
            message:
              "Company is not yet incorporated — required before grant but acceptable for Pre-Accelerator entry.",
          },
          {
            severity: "medium",
            code: "pre_revenue",
            message:
              "No MRR yet. Pre-Accelerator track will focus on pilot-to-paid conversion and unit economics.",
          },
          {
            severity: "low",
            code: "single_pilot_dependency",
            message:
              "One active pilot — aim for a second LOI during the 12-week programme.",
          },
        ],
        missingInformation: [],
        aiSummary:
          "GreenRoute shows promising cleantech validation via fleet pilot but remains pre-revenue and unincorporated. Routed to MYStartup Pre-Accelerator rather than grant track.",
        founderReport:
          "GreenRoute scores 67/100. Your emissions-tracking solution has real pilot traction and strong market fit for Malaysian logistics fleets. Because you're pre-revenue and not yet incorporated, you've been routed to MYStartup Pre-Accelerator — the right path to incorporation, second pilot, and grant readiness in 6–9 months.",
        aiFallback: false,
        modelUsed: "seed-showcase",
      },
    },
    {
      companyName: "HealthSync",
      status: "Routed",
      decisionType: "Auto_Routed",
      programmeSlug: "mentor-readiness",
      explanation:
        "Solid clinic traction with tight runway. Routed to Mentor Readiness for structured GTM and financial coaching before grant resubmission.",
      projectState: "In_Program",
      metricsHistory: {
        mrrHistory: [1200, 1800, 2400, 3100, 3800, 4500],
        labels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
      },
      audit: {
        readinessScore: 76,
        scoreBreakdown: {
          eligibilityFit: 72,
          tractionStrength: 80,
          financialHealth: 65,
          marketSectorFit: 84,
          dataCompleteness: 92,
          total: 76,
        },
        eligibilityResults: [],
        benchmarkDeltas: [
          {
            metricName: "mrr",
            value: 4500,
            median: 8000,
            p25: 3000,
            p75: 25000,
            deltaPct: -44,
            status: "below",
            message: "MRR below healthtech Revenue median — typical for clinic SaaS at MVP→Revenue transition.",
          },
          {
            metricName: "pilots",
            value: 5,
            median: 1,
            p25: 0,
            p75: 3,
            deltaPct: 400,
            status: "above",
            message: "Five clinic pilots exceed cohort norms — strong validation signal.",
          },
          {
            metricName: "runway_months",
            value: 4,
            median: 8,
            p25: 4,
            p75: 14,
            deltaPct: -50,
            status: "below",
            message: "4-month runway is a priority risk — mentor track includes burn optimisation.",
          },
        ],
        strengths: [
          "5 clinic pilots with 2 converted to paid plans — 40% pilot-to-paid conversion.",
          "Automated follow-up workflow reduces clinic admin time by an estimated 6 hours/week.",
          "Healthtech sector fit with program's digital health priority vertical.",
        ],
        riskFlags: [
          {
            severity: "high",
            code: "low_runway",
            message:
              "4 months runway is below the 3-month grant minimum buffer. Mentor programme will prioritise cash preservation.",
            field: "runwayMonths",
          },
          {
            severity: "medium",
            code: "mrr_gap",
            message:
              "MRR of RM4,500 is below grant-readiness threshold — target RM8k+ before grant resubmission.",
            field: "mrr",
          },
        ],
        missingInformation: [],
        aiSummary:
          "HealthSync demonstrates strong clinic validation but needs runway extension and MRR growth before grant eligibility. Mentor Readiness recommended.",
        founderReport:
          "HealthSync scores 76/100. Your clinic follow-up automation has excellent pilot traction — 5 clinics and 2 paying customers. Runway and MRR are the main gaps before grant readiness. You've been matched to Mentor Readiness for burn optimisation and clinic expansion playbooks.",
        aiFallback: false,
        modelUsed: "seed-showcase",
      },
    },
    {
      companyName: "EcoStream Solutions",
      status: "Routed",
      decisionType: "Auto_Routed",
      programmeSlug: "vc-readiness",
      explanation:
        "High-growth SaaS metrics with strong unit economics. Routed to VC Readiness for investor narrative and data room preparation.",
      projectState: "In_Program",
      metricsHistory: {
        mrrHistory: [6200, 8400, 10200, 13100, 16200, 18500],
        labels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
      },
      audit: {
        readinessScore: 81,
        scoreBreakdown: {
          eligibilityFit: 85,
          tractionStrength: 86,
          financialHealth: 80,
          marketSectorFit: 78,
          dataCompleteness: 94,
          total: 81,
        },
        eligibilityResults: [],
        benchmarkDeltas: [
          {
            metricName: "mrr",
            value: 18500,
            median: 8000,
            p25: 3000,
            p75: 25000,
            deltaPct: 131,
            status: "above",
            message: "MRR is 131% above SaaS Revenue cohort median — top quartile performance.",
          },
          {
            metricName: "revenue_growth_pct",
            value: 28,
            median: 15,
            p25: 5,
            p75: 35,
            deltaPct: 87,
            status: "above",
            message: "28% growth rate exceeds median — strong momentum for investor conversations.",
          },
          {
            metricName: "gross_margin",
            value: 58,
            median: 55,
            p25: 40,
            p75: 70,
            deltaPct: 5,
            status: "within",
            message: "Gross margin is healthy for B2B SaaS at this stage.",
          },
        ],
        strengths: [
          "RM18,500 MRR with 28% MoM growth — top-quartile for SaaS Revenue stage.",
          "58% gross margin supports sustainable unit economics narrative.",
          "140 active users across 18 manufacturing clients in Penang and KL.",
          "Incorporated with 16 months operating history — investor-ready corporate structure.",
        ],
        riskFlags: [
          {
            severity: "low",
            code: "geographic_concentration",
            message:
              "80% of revenue from Penang clients — expansion to KL/JB recommended before Series A.",
          },
        ],
        missingInformation: [],
        aiSummary:
          "EcoStream Solutions shows top-quartile SaaS metrics with clear path to VC conversations. VC Readiness track recommended for data room and narrative polish.",
        founderReport:
          "EcoStream scores 81/100 — one of the strongest profiles in the current intake cohort. Your industrial water-monitoring SaaS has excellent MRR growth and margins. You've been routed to VC Readiness to prepare investor materials and sharpen your growth story for seed extension.",
        aiFallback: false,
        modelUsed: "seed-showcase",
      },
    },
  ];
}

export async function applyShowcaseAudits(prisma: PrismaClient) {
  const programmes = await prisma.programme.findMany();
  const programmeIds = Object.fromEntries(programmes.map((p) => [p.slug, p.id]));

  for (const spec of buildShowcaseSpecs(programmeIds)) {
    const application = await prisma.application.findFirst({
      where: { ecosystemProject: { name: spec.companyName } },
      include: { ecosystemProject: true },
    });
    if (!application) continue;

    const programmeId = programmeIds[spec.programmeSlug];
    if (!programmeId) continue;

    await prisma.intakeAudit.deleteMany({ where: { applicationId: application.id } });
    await prisma.routingDecision.deleteMany({ where: { applicationId: application.id } });

    const grantId = programmeIds["grant-track"];

    await prisma.intakeAudit.create({
      data: {
        applicationId: application.id,
        readinessScore: spec.audit.readinessScore,
        aiSummary: spec.audit.aiSummary,
        founderReport: spec.audit.founderReport,
        strengths: JSON.stringify(spec.audit.strengths),
        riskFlags: JSON.stringify(spec.audit.riskFlags),
        missingInformation: JSON.stringify(spec.audit.missingInformation),
        benchmarkDeltas: JSON.stringify(spec.audit.benchmarkDeltas),
        eligibilityResult: JSON.stringify(spec.audit.eligibilityResults),
        scoreBreakdown: JSON.stringify(spec.audit.scoreBreakdown),
        modelUsed: spec.audit.modelUsed ?? "seed-showcase",
        aiFallback: spec.audit.aiFallback,
      },
    });

    await prisma.routingDecision.create({
      data: {
        applicationId: application.id,
        fromProgrammeId: grantId ?? null,
        recommendedProgrammeId: programmeId,
        decisionType: spec.decisionType,
        reasonCodes: JSON.stringify(["showcase_seed"]),
        explanation: spec.explanation,
        adminConfirmed: false,
      },
    });

    await prisma.application.update({
      where: { id: application.id },
      data: {
        status: spec.status,
        targetProgrammeId: programmeId,
      },
    });

    await prisma.ecosystemProject.update({
      where: { id: application.ecosystemProjectId },
      data: {
        ...(spec.projectState ? { state: spec.projectState } : {}),
        ...(spec.metricsHistory
          ? { metricsHistory: JSON.stringify(spec.metricsHistory) }
          : {}),
        passportSnapshot: JSON.stringify({
          lastAuditScore: spec.audit.readinessScore,
          routedTo: spec.programmeSlug,
          mentorMatchingEligible: true,
          highlights: spec.audit.strengths.slice(0, 2),
        }),
      },
    });
  }
}
