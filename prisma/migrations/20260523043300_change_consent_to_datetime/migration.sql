/*
  Warnings:

  - The `consent` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "user" ALTER COLUMN "consent" DROP NOT NULL;

ALTER TABLE "user"
ALTER COLUMN "consent" TYPE TIMESTAMP(3)
USING (CASE WHEN "consent" = true THEN "created_at" ELSE NULL END);
