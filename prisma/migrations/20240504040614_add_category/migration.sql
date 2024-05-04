-- CreateEnum
CREATE TYPE "Category" AS ENUM ('ACADEMIC', 'RECRUIT', 'EVENT', 'CLUB', 'ETC');

-- AlterTable
ALTER TABLE "notice" ADD COLUMN     "category" "Category" NOT NULL DEFAULT 'ETC';
