-- AlterTable
ALTER TABLE "notice"
ADD COLUMN "summary" TEXT,
ADD COLUMN "keywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
