import type { PrismaClient } from "@prisma/client";

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000);
}

function healthLogs(scores: number[], notes: string[]) {
  return JSON.stringify(
    scores.map((score, i) => ({
      type: "health",
      score,
      note: notes[i] ?? `Sync ${i + 1}`,
      sentiment: score >= 70 ? "positive" : score >= 50 ? "neutral" : "negative",
      at: daysAgo((scores.length - i) * 14).toISOString(),
      actorType: "mentor",
    })),
  );
}

/** Rich cohort for demo mentor (mentor@demo.com → Dr. Sarah Chen). */
export async function seedMentorShowcase(prisma: PrismaClient) {
  const sarah = await prisma.mentorNode.findFirst({
    where: { email: "sarah.chen@cradle.my" },
  });
  if (!sarah) return;

  const projects = await prisma.ecosystemProject.findMany({
    where: {
      name: {
        in: [
          "PayFlow MY",
          "HealthSync",
          "EcoStream Solutions",
          "GreenRoute",
          "NovaAnalytics",
          "FarmLink",
        ],
      },
    },
  });
  const byName = Object.fromEntries(projects.map((p) => [p.name, p]));

  await prisma.linkageEntity.deleteMany({ where: { mentorNodeId: sarah.id } });

  const linkages = [
    {
      project: byName["PayFlow MY"],
      goal: "Scale enterprise pilot conversions and reduce sales cycle length for B2B payment reconciliation.",
      tags: ["B2B_Enterprise", "Go_To_Market"],
      status: "Active" as const,
      healthScore: 82,
      matchScore: 0.91,
      healthHistory: [68, 72, 76, 79, 81, 82],
      healthNotes: [
        "Kickoff — mapped enterprise pilot stakeholders",
        "Pilot expansion workshop with procurement lead",
        "Sales playbook v2 deployed to 3 AEs",
        "First enterprise LOI signed",
        "Pilot conversion playbook adopted",
        "On track for Q2 expansion",
      ],
      explanation:
        "Top match for B2B fintech GTM. Historical success rate 92% on enterprise sales motions.",
    },
    {
      project: byName["EcoStream Solutions"],
      goal: "Prepare seed-extension narrative and KL expansion playbook for industrial IoT monitoring.",
      tags: ["B2B_Enterprise", "Fundraising"],
      status: "Active" as const,
      healthScore: 88,
      matchScore: 0.87,
      healthHistory: [74, 78, 82, 85, 87, 88],
      healthNotes: [
        "VC readiness kickoff",
        "Data room structure review",
        "Investor narrative workshop",
        "KL expansion GTM plan drafted",
        "Mock partner meeting — strong feedback",
        "Term sheet prep underway",
      ],
      explanation: "Strong SaaS metrics; mentor focus on investor readiness and regional expansion.",
    },
    {
      project: byName["HealthSync"],
      goal: "Extend runway via burn optimisation and convert 2 remaining clinic pilots to paid.",
      tags: ["B2B_Sales", "Financial_Modeling"],
      status: "Active" as const,
      healthScore: 71,
      matchScore: 0.84,
      healthHistory: [58, 62, 65, 68, 70, 71],
      healthNotes: [
        "Financial model review — runway extended 2 months",
        "Clinic pilot conversion strategy",
        "Pricing workshop for clinic tier",
        "Second clinic converted to paid",
        "Johor expansion planning",
        "Burn rate stabilised",
      ],
      explanation: "Healthtech GTM with financial coaching — matched for clinic B2B sales experience.",
    },
    {
      project: byName["GreenRoute"],
      goal: "Re-engage founder on GTM experiments — missed last two syncs; validate fleet pilot conversion path.",
      tags: ["Marketing", "Go_To_Market"],
      status: "Requires_Intervention" as const,
      healthScore: 38,
      matchScore: 0.72,
      healthHistory: [52, 48, 45, 42, 40, 38],
      healthNotes: [
        "Initial GTM channel brainstorm",
        "Founder missed sync — rescheduled",
        "Second missed sync — escalation",
        "Product rebuild cited as blocker",
        "Intervention plan drafted",
        "Awaiting founder recommitment",
      ],
      explanation: "Engagement drop flagged; intervention required before cohort review.",
    },
    {
      project: byName["NovaAnalytics"],
      goal: "Completed — graduated with 3x MRR growth and Singapore pilot launch.",
      tags: ["B2B_Enterprise", "Fundraising"],
      status: "Completed" as const,
      healthScore: 92,
      matchScore: 0.89,
      healthHistory: [70, 78, 85, 88, 90, 92],
      healthNotes: ["Graduated cohort 2024", "Final review — success"],
      explanation: "Successful graduation — enterprise analytics playbook.",
      finalOutcome: "Success" as const,
    },
    {
      project: byName["FarmLink"],
      goal: "Completed — agribusiness contracts and margin improvement.",
      tags: ["B2B_Sales", "Operations"],
      status: "Completed" as const,
      healthScore: 86,
      matchScore: 0.85,
      healthHistory: [65, 72, 78, 82, 84, 86],
      healthNotes: ["Graduated cohort 2024", "Final review — success"],
      explanation: "Successful cleantech agri GTM mentorship.",
      finalOutcome: "Success" as const,
    },
  ];

  for (const l of linkages) {
    if (!l.project) continue;
    await prisma.linkageEntity.create({
      data: {
        ecosystemProjectId: l.project.id,
        mentorNodeId: sarah.id,
        goal: l.goal,
        problemTags: JSON.stringify(l.tags),
        status: l.status,
        healthScore: l.healthScore,
        matchScore: l.matchScore,
        matchExplanation: l.explanation,
        finalOutcome: "finalOutcome" in l ? l.finalOutcome : undefined,
        feedbackLogs: healthLogs(l.healthHistory, l.healthNotes),
        lastActivityAt: daysAgo(l.status === "Requires_Intervention" ? 16 : 3),
      },
    });
  }

  await prisma.roadblockRequest.createMany({
    data: [
      {
        ecosystemProjectId: byName["GreenRoute"]?.id ?? "",
        roadblock:
          "Fleet pilot stalled after product rebuild — need help prioritising GTM experiments vs engineering roadmap for next 6 weeks.",
        problemCategory: "Go_To_Market",
        stage: "Idea",
        sector: "Cleantech",
        status: "matched",
      },
      {
        ecosystemProjectId: byName["HealthSync"]?.id ?? "",
        roadblock:
          "Clinic pilots converting slowly — need pricing and expansion playbook before runway ends in 4 months.",
        problemCategory: "B2B_Sales",
        stage: "MVP",
        sector: "Healthtech",
        status: "matched",
      },
    ].filter((r) => r.ecosystemProjectId),
  });
}
