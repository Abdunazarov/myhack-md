-- AlterTable
ALTER TABLE "Application" ADD COLUMN "pitchDeckFileName" TEXT;
ALTER TABLE "Application" ADD COLUMN "pitchDeckMimeType" TEXT;
ALTER TABLE "Application" ADD COLUMN "pitchDeckText" TEXT;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
