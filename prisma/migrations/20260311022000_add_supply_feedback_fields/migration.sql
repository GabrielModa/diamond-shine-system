-- AlterTable
ALTER TABLE "SupplyRequest" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'NORMAL';
ALTER TABLE "SupplyRequest" ADD COLUMN "notes" TEXT;
ALTER TABLE "SupplyRequest" ADD COLUMN "emailSentAt" DATETIME;

-- Add enum extension for SupplyStatus represented as TEXT in SQLite.
-- Existing rows keep their current values.

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN "averageScore" REAL NOT NULL DEFAULT 0;
ALTER TABLE "Feedback" ADD COLUMN "categoryLabel" TEXT NOT NULL DEFAULT 'Good';
