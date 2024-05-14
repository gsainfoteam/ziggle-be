-- DropForeignKey
ALTER TABLE "fcm_token" DROP CONSTRAINT "fcm_token_user_uuid_fkey";

-- AlterTable
ALTER TABLE "fcm_token" ALTER COLUMN "user_uuid" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "fcm_token" ADD CONSTRAINT "fcm_token_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "user"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
