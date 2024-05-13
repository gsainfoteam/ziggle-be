-- CreateTable
CREATE TABLE "fcm_token" (
    "fcm_token_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_check_at" TIMESTAMP(3) NOT NULL,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "user_uuid" UUID NOT NULL,

    CONSTRAINT "fcm_token_pkey" PRIMARY KEY ("fcm_token_id")
);

-- CreateTable
CREATE TABLE "log" (
    "id" SERIAL NOT NULL,
    "content" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fcm_token_id" TEXT NOT NULL,

    CONSTRAINT "log_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "fcm_token" ADD CONSTRAINT "fcm_token_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "user"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log" ADD CONSTRAINT "log_fcm_token_id_fkey" FOREIGN KEY ("fcm_token_id") REFERENCES "fcm_token"("fcm_token_id") ON DELETE RESTRICT ON UPDATE CASCADE;
