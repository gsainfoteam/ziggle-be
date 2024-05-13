-- CreateTable
CREATE TABLE "fcm_token" (
    "fcmTokenId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheckAt" TIMESTAMP(3) NOT NULL,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "userUuid" UUID NOT NULL,

    CONSTRAINT "fcm_token_pkey" PRIMARY KEY ("fcmTokenId")
);

-- CreateTable
CREATE TABLE "log" (
    "id" SERIAL NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fcmTokenId" TEXT NOT NULL,

    CONSTRAINT "log_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "fcm_token" ADD CONSTRAINT "fcm_token_userUuid_fkey" FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log" ADD CONSTRAINT "log_fcmTokenId_fkey" FOREIGN KEY ("fcmTokenId") REFERENCES "fcm_token"("fcmTokenId") ON DELETE RESTRICT ON UPDATE CASCADE;
