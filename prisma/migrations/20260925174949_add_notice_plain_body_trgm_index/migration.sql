CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateIndex
CREATE INDEX "notice_plain_body_idx" ON "notice" USING GIN ("plain_body" gin_trgm_ops);
