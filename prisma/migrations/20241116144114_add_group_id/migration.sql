/*
  Warnings:

  - The primary key for the `group` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `group_name` on the `notice` table. All the data in the column will be lost.
  - Added the required column `uuid` to the `group` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "notice" DROP CONSTRAINT "notice_group_name_fkey";

-- AlterTable
ALTER TABLE "group" DROP CONSTRAINT "group_pkey",
ADD COLUMN     "uuid" UUID NOT NULL,
ADD CONSTRAINT "group_pkey" PRIMARY KEY ("uuid");

-- AlterTable
ALTER TABLE "notice" DROP COLUMN "group_name",
ADD COLUMN     "group_id" UUID;

-- AddForeignKey
ALTER TABLE "notice" ADD CONSTRAINT "notice_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
