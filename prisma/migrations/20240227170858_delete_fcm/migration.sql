/*
  Warnings:

  - You are about to drop the `fcmtoken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `fcmtoken` DROP FOREIGN KEY `FcmToken_user_uuid_fkey`;

-- DropTable
DROP TABLE `fcmtoken`;
