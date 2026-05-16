-- CreateTable
CREATE TABLE "EcosystemProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Lead',
    "sector" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "founderName" TEXT NOT NULL,
    "founderEmail" TEXT NOT NULL,
    "metricsHistory" TEXT NOT NULL DEFAULT '{}',
    "passportSnapshot" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Programme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "ProgrammeRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programmeId" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "expectedValue" TEXT NOT NULL,
    "failureReason" TEXT NOT NULL,
    "weight" REAL NOT NULL DEFAULT 1,
    CONSTRAINT "ProgrammeRule_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BenchmarkProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sector" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "p25" REAL NOT NULL,
    "median" REAL NOT NULL,
    "p75" REAL NOT NULL,
    "successfulCohortCount" INTEGER NOT NULL DEFAULT 0,
    "sourceCohortYear" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ecosystemProjectId" TEXT NOT NULL,
    "targetProgrammeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Submitted',
    "rawApplication" TEXT NOT NULL DEFAULT '{}',
    "normalizedApplication" TEXT NOT NULL DEFAULT '{}',
    "pitchText" TEXT,
    "financialMetrics" TEXT NOT NULL DEFAULT '{}',
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_ecosystemProjectId_fkey" FOREIGN KEY ("ecosystemProjectId") REFERENCES "EcosystemProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Application_targetProgrammeId_fkey" FOREIGN KEY ("targetProgrammeId") REFERENCES "Programme" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IntakeAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "readinessScore" REAL NOT NULL,
    "aiSummary" TEXT,
    "strengths" TEXT NOT NULL DEFAULT '[]',
    "riskFlags" TEXT NOT NULL DEFAULT '[]',
    "missingInformation" TEXT NOT NULL DEFAULT '[]',
    "benchmarkDeltas" TEXT NOT NULL DEFAULT '[]',
    "eligibilityResult" TEXT NOT NULL DEFAULT '{}',
    "scoreBreakdown" TEXT NOT NULL DEFAULT '{}',
    "modelUsed" TEXT,
    "aiFallback" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IntakeAudit_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoutingDecision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "fromProgrammeId" TEXT,
    "recommendedProgrammeId" TEXT NOT NULL,
    "decisionType" TEXT NOT NULL,
    "reasonCodes" TEXT NOT NULL DEFAULT '[]',
    "explanation" TEXT NOT NULL,
    "adminConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "adminNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoutingDecision_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoutingDecision_fromProgrammeId_fkey" FOREIGN KEY ("fromProgrammeId") REFERENCES "Programme" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RoutingDecision_recommendedProgrammeId_fkey" FOREIGN KEY ("recommendedProgrammeId") REFERENCES "Programme" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Programme_slug_key" ON "Programme"("slug");

-- CreateIndex
CREATE INDEX "ProgrammeRule_programmeId_idx" ON "ProgrammeRule"("programmeId");

-- CreateIndex
CREATE INDEX "BenchmarkProfile_sector_stage_metricName_idx" ON "BenchmarkProfile"("sector", "stage", "metricName");

-- CreateIndex
CREATE INDEX "IntakeAudit_applicationId_idx" ON "IntakeAudit"("applicationId");

-- CreateIndex
CREATE INDEX "RoutingDecision_applicationId_idx" ON "RoutingDecision"("applicationId");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");
