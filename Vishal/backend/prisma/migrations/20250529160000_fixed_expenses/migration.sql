-- AlterTable
ALTER TABLE "TrackerSettings" ADD COLUMN "fixedExpenses" JSONB NOT NULL DEFAULT '[]';
