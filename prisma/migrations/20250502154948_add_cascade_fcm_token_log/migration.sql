-- DropForeignKey
ALTER TABLE "log" DROP CONSTRAINT "log_fcm_token_id_fkey";

-- AddForeignKey
ALTER TABLE "log" ADD CONSTRAINT "log_fcm_token_id_fkey" FOREIGN KEY ("fcm_token_id") REFERENCES "fcm_token"("fcm_token_id") ON DELETE CASCADE ON UPDATE CASCADE;
