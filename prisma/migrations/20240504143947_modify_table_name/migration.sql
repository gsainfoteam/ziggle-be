/*
  Warnings:

  - You are about to drop the `Group` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "notice" DROP CONSTRAINT "notice_group_name_fkey";

-- DropTable
DROP TABLE "Group";

-- CreateTable
CREATE TABLE "group" (
    "name" TEXT NOT NULL,

    CONSTRAINT "group_pkey" PRIMARY KEY ("name")
);

-- AddForeignKey
ALTER TABLE "notice" ADD CONSTRAINT "notice_group_name_fkey" FOREIGN KEY ("group_name") REFERENCES "group"("name") ON DELETE SET NULL ON UPDATE CASCADE;
