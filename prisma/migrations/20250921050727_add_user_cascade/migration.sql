-- DropForeignKey
ALTER TABLE "fcm_token" DROP CONSTRAINT "fcm_token_user_uuid_fkey";

-- DropForeignKey
ALTER TABLE "notice" DROP CONSTRAINT "notice_author_id_fkey";

-- DropForeignKey
ALTER TABLE "reaction" DROP CONSTRAINT "reaction_user_uuid_fkey";

-- DropForeignKey
ALTER TABLE "user_record" DROP CONSTRAINT "user_record_user_uuid_fkey";

-- AddForeignKey
ALTER TABLE "user_record" ADD CONSTRAINT "user_record_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notice" ADD CONSTRAINT "notice_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaction" ADD CONSTRAINT "reaction_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fcm_token" ADD CONSTRAINT "fcm_token_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
