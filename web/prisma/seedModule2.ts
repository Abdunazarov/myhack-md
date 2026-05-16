import { LinkageOutcome, PrismaClient } from "@prisma/client";
import { buildSkillMatrixFromOutcomes } from "../src/server/services/mentor/buildSkillMatrix";

type MentorSeed = {
  name: string;
  email: string;
  title: string;
  userEmail?: string;
  capacity: number;
  outcomes: {
    startupName: string;
    sector: string;
    stage: string;
    problemTags: string[];
    outcome: LinkageOutcome;
    feedbackLog: string;
  }[];
};

const MENTORS: MentorSeed[] = [
  {
    name: "Dr. Sarah Chen",
    email: "sarah.chen@cradle.my",
    title: "Enterprise B2B & GTM Advisor",
    userEmail: "mentor@cradle.com",
    capacity: 6,
    outcomes: [
      {
        startupName: "FleetOps 2024",
        sector: "SaaS",
        stage: "Revenue",
        problemTags: ["B2B_Enterprise", "Go_To_Market"],
        outcome: "Success",
        feedbackLog:
          "Sarah helped close 2 enterprise pilots by restructuring the sales playbook. Startup achieved RM40k MRR within 4 months.",
      },
      {
        startupName: "RetailSync",
        sector: "SaaS",
        stage: "MVP",
        problemTags: ["B2B_Sales", "Pricing"],
        outcome: "Success",
        feedbackLog: "Pricing workshop and outbound cadence led to 8 paying retail chains.",
      },
      {
        startupName: "LogiChain",
        sector: "Cleantech",
        stage: "MVP",
        problemTags: ["B2B_Sales", "Operations"],
        outcome: "Pivot",
        feedbackLog: "Sales motion was weak; pivoted to logistics SaaS after GTM diagnosis.",
      },
      {
        startupName: "MedQueue",
        sector: "Healthtech",
        stage: "Revenue",
        problemTags: ["B2B_Enterprise", "Partnerships"],
        outcome: "Success",
        feedbackLog: "Closed hospital partnership via warm intro framework Sarah provided.",
      },
    ],
  },
  {
    name: "Ahmad Rizal",
    email: "ahmad.rizal@cradle.my",
    title: "Fintech & Compliance Mentor",
    capacity: 5,
    outcomes: [
      {
        startupName: "PayBridge 2024",
        sector: "Fintech",
        stage: "Revenue",
        problemTags: ["Fintech_Compliance", "B2B_Enterprise"],
        outcome: "Success",
        feedbackLog: "Navigated BNM sandbox pathway; secured payment facilitator partnership.",
      },
      {
        startupName: "WalletHub MY",
        sector: "Fintech",
        stage: "MVP",
        problemTags: ["Fintech_Compliance", "Product_MVP"],
        outcome: "Fail",
        feedbackLog: "Compliance timeline underestimated; product delayed 6 months.",
      },
      {
        startupName: "InsureTech Co",
        sector: "Fintech",
        stage: "Growth",
        problemTags: ["Fundraising", "Fintech_Compliance"],
        outcome: "Success",
        feedbackLog: "Prepared regulatory memo pack used in Series A data room.",
      },
    ],
  },
  {
    name: "Priya Nair",
    email: "priya.nair@cradle.my",
    title: "Growth Marketing & CAC Optimization",
    capacity: 7,
    outcomes: [
      {
        startupName: "BeautyStack",
        sector: "SaaS",
        stage: "MVP",
        problemTags: ["Marketing", "Go_To_Market"],
        outcome: "Success",
        feedbackLog: "Reduced CAC 35% via channel mix experiment and creative testing framework.",
      },
      {
        startupName: "EduSpark",
        sector: "Edtech",
        stage: "MVP",
        problemTags: ["Marketing", "Product_MVP"],
        outcome: "Success",
        feedbackLog: "Launched parent acquisition funnel; 3x trial signups in 8 weeks.",
      },
      {
        startupName: "FoodDash B2B",
        sector: "SaaS",
        stage: "Revenue",
        problemTags: ["Marketing", "Pricing"],
        outcome: "Fail",
        feedbackLog: "Paid ads scaled before PMF; burn increased without retention fix.",
      },
      {
        startupName: "GreenCart",
        sector: "Cleantech",
        stage: "Idea",
        problemTags: ["Marketing", "Go_To_Market"],
        outcome: "Pivot",
        feedbackLog: "Repivoted from B2C to B2B grocer partnerships after marketing audit.",
      },
    ],
  },
  {
    name: "James Ooi",
    email: "james.ooi@cradle.my",
    title: "Financial Modeling & Fundraising",
    capacity: 5,
    outcomes: [
      {
        startupName: "PropTech Metrics",
        sector: "SaaS",
        stage: "Revenue",
        problemTags: ["Financial_Modeling", "Fundraising"],
        outcome: "Success",
        feedbackLog: "Built investor-grade model; closed RM2M seed with clear unit economics story.",
      },
      {
        startupName: "AgriFin",
        sector: "Fintech",
        stage: "MVP",
        problemTags: ["Financial_Modeling", "Fundraising"],
        outcome: "Success",
        feedbackLog: "Runway extended from 4 to 9 months via burn optimization and grant stacking.",
      },
      {
        startupName: "CloudServe",
        sector: "SaaS",
        stage: "Growth",
        problemTags: ["Financial_Modeling", "Operations"],
        outcome: "Fail",
        feedbackLog: "Model showed unsustainable burn; startup wound down after honest scenario planning.",
      },
    ],
  },
  {
    name: "Mei Ling Tan",
    email: "mei.ling@cradle.my",
    title: "Product-Market Fit & MVP Coach",
    capacity: 6,
    outcomes: [
      {
        startupName: "HealthTrack",
        sector: "Healthtech",
        stage: "MVP",
        problemTags: ["Product_MVP", "Go_To_Market"],
        outcome: "Success",
        feedbackLog: "MVP scope cut 40%; first clinic pilot signed within 6 weeks.",
      },
      {
        startupName: "WorkFlow AI",
        sector: "SaaS",
        stage: "Idea",
        problemTags: ["Product_MVP", "Hiring"],
        outcome: "Success",
        feedbackLog: "Defined ICP and shipped v1 with fractional CTO hire playbook.",
      },
      {
        startupName: "TourBuddy",
        sector: "SaaS",
        stage: "MVP",
        problemTags: ["Product_MVP", "Marketing"],
        outcome: "Fail",
        feedbackLog: "Built features without user interviews; no traction after launch.",
      },
    ],
  },
];

export async function seedModule2(prisma: PrismaClient, payFlowProjectId?: string) {
  await prisma.roadblockRequest.deleteMany();
  await prisma.linkageEntity.deleteMany();
  await prisma.historicalOutcome.deleteMany();
  await prisma.mentorNode.deleteMany();

  const users = await prisma.user.findMany();
  const mentorUser = users.find((u) => u.email === "mentor@cradle.com");

  const createdMentors = [];
  for (const m of MENTORS) {
    const userId =
      m.userEmail != null ? users.find((u) => u.email === m.userEmail)?.id ?? null : null;

    const mentor = await prisma.mentorNode.create({
      data: {
        name: m.name,
        email: m.email,
        title: m.title,
        userId: userId ?? (m.userEmail === "mentor@cradle.com" ? mentorUser?.id : null),
        availabilityCapacity: m.capacity,
        dynamicSkillMatrix: "{}",
        outcomeSummary: "{}",
      },
    });

    for (const o of m.outcomes) {
      await prisma.historicalOutcome.create({
        data: {
          mentorNodeId: mentor.id,
          startupName: o.startupName,
          sector: o.sector,
          stage: o.stage,
          problemTags: JSON.stringify(o.problemTags),
          outcome: o.outcome,
          feedbackLog: o.feedbackLog,
          cohortYear: 2024,
        },
      });
    }

    const outcomes = await prisma.historicalOutcome.findMany({
      where: { mentorNodeId: mentor.id },
    });
    const { matrix, summary } = buildSkillMatrixFromOutcomes(outcomes);
    await prisma.mentorNode.update({
      where: { id: mentor.id },
      data: {
        dynamicSkillMatrix: JSON.stringify(matrix),
        outcomeSummary: JSON.stringify(summary),
      },
    });

    createdMentors.push(mentor);
  }

  if (payFlowProjectId) {
    const sarah = createdMentors.find((m) => m.email === "sarah.chen@cradle.my")!;
    await prisma.linkageEntity.create({
      data: {
        ecosystemProjectId: payFlowProjectId,
        mentorNodeId: sarah.id,
        goal: "Scale enterprise pilot conversions and reduce sales cycle length for B2B payment reconciliation.",
        problemTags: JSON.stringify(["B2B_Enterprise", "Go_To_Market"]),
        status: "Active",
        healthScore: 82,
        matchScore: 0.91,
        matchExplanation:
          "Matched Sarah Chen for B2B Enterprise and GTM. Strongest fit: B2B Enterprise (92% historical success). Historical proof: mentored FleetOps 2024 to successful outcome in 2024.",
        feedbackLogs: JSON.stringify([
          {
            note: "Intro call completed — pilot expansion plan drafted.",
            sentiment: "positive",
            at: new Date(Date.now() - 3 * 86400000).toISOString(),
            actorType: "mentor",
          },
        ]),
        lastActivityAt: new Date(Date.now() - 3 * 86400000),
      },
    });

    const atRisk = createdMentors.find((m) => m.email === "priya.nair@cradle.my")!;
    const greenRoute = await prisma.ecosystemProject.findFirst({
      where: { founderEmail: "founder@demo.com" },
    });
    if (greenRoute) {
      await prisma.linkageEntity.create({
        data: {
          ecosystemProjectId: greenRoute.id,
          mentorNodeId: atRisk.id,
          goal: "Validate GTM channel for fleet emissions tracking — low engagement on last two mentor syncs.",
          problemTags: JSON.stringify(["Marketing", "Go_To_Market"]),
          status: "Requires_Intervention",
          healthScore: 38,
          matchScore: 0.72,
          matchExplanation: "Matched Priya Nair for marketing-led GTM validation.",
          feedbackLogs: JSON.stringify([
            {
              note: "Missed second sync — founder cited product rebuild priorities.",
              sentiment: "negative",
              at: new Date(Date.now() - 16 * 86400000).toISOString(),
              actorType: "system",
            },
          ]),
          lastActivityAt: new Date(Date.now() - 16 * 86400000),
        },
      });
    }
  }

  return createdMentors;
}
