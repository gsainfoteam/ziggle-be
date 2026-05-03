/*
  Warnings:

  - You are about to drop the column `views` on the `user_record` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "_NoticeToTag" ADD CONSTRAINT "_NoticeToTag_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_NoticeToTag_AB_unique";

-- AlterTable
ALTER TABLE "_Reminder" ADD CONSTRAINT "_Reminder_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_Reminder_AB_unique";

-- AlterTable
ALTER TABLE "user_record" ADD COLUMN     "bookmarked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_viewed" BOOLEAN NOT NULL DEFAULT false;

UPDATE "user_record" SET "is_viewed" = true WHERE "views" > 0;

ALTER TABLE "user_record" DROP COLUMN "views";

