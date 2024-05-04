-- CreateTable
CREATE TABLE "user_record" (
    "views" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_uuid" UUID NOT NULL,
    "notice_id" INTEGER NOT NULL,

    CONSTRAINT "user_record_pkey" PRIMARY KEY ("user_uuid","notice_id")
);

-- AddForeignKey
ALTER TABLE "user_record" ADD CONSTRAINT "user_record_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "user"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_record" ADD CONSTRAINT "user_record_notice_id_fkey" FOREIGN KEY ("notice_id") REFERENCES "notice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
