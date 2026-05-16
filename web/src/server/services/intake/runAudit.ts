import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/json";
import type { NormalizedApplication } from "@/lib/validation/applicationSchema";
import { compareToBenchmarks, detectMissingInformation } from "../benchmarks/compareToBenchmarks";
import { evaluateAllProgrammes } from "../eligibility/evaluateProgrammeRules";
import { generatePitchAudit } from "../ai/generatePitchAudit";
import { computeReadinessScore } from "./computeReadinessScore";
import { selectBestProgramme } from "../routing/selectBestProgramme";
import type { AuditPayload } from "./intakeTypes";

export async function runApplicationAudit(applicationId: string): Promise<AuditPayload> {
  const application = await prisma.application.findUniqueOrThrow({
    where: { id: applicationId },
    include: { ecosystemProject: true },
  });

  await prisma.application.update({
    where: { id: applicationId },
    data: { status: "Auditing" },
  });

  const app = parseJson<NormalizedApplication>(application.normalizedApplication, {} as NormalizedApplication);
  const programmes = await prisma.programme.findMany({
    where: { active: true },
    include: { rules: true },
    orderBy: { priority: "desc" },
  });
  const benchmarks = await prisma.benchmarkProfile.findMany();

  const eligibilityResults = evaluateAllProgrammes(app, programmes);
  const benchmarkDeltas = compareToBenchmarks(app, benchmarks);
  const missingInformation = detectMissingInformation(app);
  const grantEligibility = eligibilityResults.find((e) => e.programmeSlug === "grant-track");
  const scoreBreakdown = computeReadinessScore(app, grantEligibility, benchmarkDeltas);

  const aiResult = await generatePitchAudit(app, benchmarkDeltas, missingInformation);
  const routing = selectBestProgramme(app, programmes, eligibilityResults, scoreBreakdown);

  const auditPayload: AuditPayload = {
    readinessScore: scoreBreakdown.total,
    scoreBreakdown,
    eligibilityResults,
    benchmarkDeltas,
    strengths: aiResult.strengths,
    riskFlags: aiResult.riskFlags,
    missingInformation,
    aiSummary: aiResult.aiSummary,
    founderReport: aiResult.founderReport,
    modelUsed: aiResult.modelUsed,
    aiFallback: aiResult.aiFallback,
  };

  const newStatus =
    routing.decisionType === "Grant_Eligible"
      ? "Eligible"
      : routing.decisionType === "Rejected"
        ? "Rejected"
        : routing.decisionType === "Needs_Review"
          ? "Needs_Review"
          : "Routed";

  await prisma.intakeAudit.create({
    data: {
      applicationId,
      readinessScore: auditPayload.readinessScore,
      aiSummary: auditPayload.aiSummary,
      founderReport: auditPayload.founderReport,
      strengths: JSON.stringify(auditPayload.strengths),
      riskFlags: JSON.stringify(auditPayload.riskFlags),
      missingInformation: JSON.stringify(auditPayload.missingInformation),
      benchmarkDeltas: JSON.stringify(auditPayload.benchmarkDeltas),
      eligibilityResult: JSON.stringify(auditPayload.eligibilityResults),
      scoreBreakdown: JSON.stringify(auditPayload.scoreBreakdown),
      modelUsed: auditPayload.modelUsed ?? null,
      aiFallback: auditPayload.aiFallback,
    },
  });

  const grantProgramme = programmes.find((p) => p.slug === "grant-track");
  await prisma.routingDecision.create({
    data: {
      applicationId,
      fromProgrammeId: grantProgramme?.id ?? null,
      recommendedProgrammeId: routing.recommendedProgrammeId,
      decisionType: routing.decisionType,
      reasonCodes: JSON.stringify(routing.reasonCodes),
      explanation: routing.explanation,
    },
  });

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: newStatus,
      targetProgrammeId: routing.recommendedProgrammeId,
    },
  });

  const programmeSlugsInProgram = [
    "mystartup-pre-accelerator",
    "mentor-readiness",
    "financial-model-repair",
    "vc-readiness",
  ];
  const moveToProgram =
    routing.decisionType === "Auto_Routed" ||
    routing.decisionType === "Grant_Eligible" ||
    routing.decisionType === "Needs_Review";

  await prisma.ecosystemProject.update({
    where: { id: application.ecosystemProjectId },
    data: {
      ...(moveToProgram && programmeSlugsInProgram.includes(routing.recommendedProgrammeSlug)
        ? { state: "In_Program" }
        : {}),
      passportSnapshot: JSON.stringify({
        lastAudit: auditPayload,
        routedTo: routing.recommendedProgrammeSlug,
        mentorMatchingEligible: [
          "mentor-readiness",
          "mystartup-pre-accelerator",
          "vc-readiness",
        ].includes(routing.recommendedProgrammeSlug),
      }),
    },
  });

  await prisma.auditEvent.create({
    data: {
      entityType: "application",
      entityId: applicationId,
      eventType: "audit_completed",
      actorType: "system",
      metadata: JSON.stringify({
        readinessScore: auditPayload.readinessScore,
        routing: routing.decisionType,
      }),
    },
  });

  return auditPayload;
}
