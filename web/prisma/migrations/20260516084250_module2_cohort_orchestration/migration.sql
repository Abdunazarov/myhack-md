-- AlterTable
ALTER TABLE "Application" ADD COLUMN "financialModelSummary" TEXT;

-- CreateTable
CREATE TABLE "MentorNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "availabilityCapacity" INTEGER NOT NULL DEFAULT 5,
    "dynamicSkillMatrix" TEXT NOT NULL DEFAULT '{}',
    "outcomeSummary" TEXT NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MentorNode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistoricalOutcome" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mentorNodeId" TEXT NOT NULL,
    "startupName" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "problemTags" TEXT NOT NULL DEFAULT '[]',
    "outcome" TEXT NOT NULL,
    "feedbackLog" TEXT NOT NULL,
    "cohortYear" INTEGER NOT NULL DEFAULT 2024,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HistoricalOutcome_mentorNodeId_fkey" FOREIGN KEY ("mentorNodeId") REFERENCES "MentorNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LinkageEntity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ecosystemProjectId" TEXT NOT NULL,
    "mentorNodeId" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "problemTags" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "healthScore" REAL NOT NULL DEFAULT 100,
    "finalOutcome" TEXT,
    "matchScore" REAL,
    "matchExplanation" TEXT,
    "feedbackLogs" TEXT NOT NULL DEFAULT '[]',
    "lastActivityAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LinkageEntity_ecosystemProjectId_fkey" FOREIGN KEY ("ecosystemProjectId") REFERENCES "EcosystemProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LinkageEntity_mentorNodeId_fkey" FOREIGN KEY ("mentorNodeId") REFERENCES "MentorNode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoadblockRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ecosystemProjectId" TEXT NOT NULL,
    "roadblock" TEXT NOT NULL,
    "problemCategory" TEXT,
    "stage" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'matched',
    "matchedLinkageId" TEXT,
    "matchExplanation" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoadblockRequest_ecosystemProjectId_fkey" FOREIGN KEY ("ecosystemProjectId") REFERENCES "EcosystemProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MentorNode_userId_key" ON "MentorNode"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MentorNode_email_key" ON "MentorNode"("email");

-- CreateIndex
CREATE INDEX "HistoricalOutcome_mentorNodeId_idx" ON "HistoricalOutcome"("mentorNodeId");

-- CreateIndex
CREATE INDEX "LinkageEntity_ecosystemProjectId_idx" ON "LinkageEntity"("ecosystemProjectId");

-- CreateIndex
CREATE INDEX "LinkageEntity_mentorNodeId_idx" ON "LinkageEntity"("mentorNodeId");

-- CreateIndex
CREATE INDEX "LinkageEntity_status_idx" ON "LinkageEntity"("status");

-- CreateIndex
CREATE INDEX "RoadblockRequest_ecosystemProjectId_idx" ON "RoadblockRequest"("ecosystemProjectId");
