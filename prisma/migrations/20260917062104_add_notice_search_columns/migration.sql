
-- AlterTable
ALTER TABLE "notice" ADD COLUMN     "title_ko" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "title_en" TEXT,
ADD COLUMN     "preview_ko" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "preview_en" TEXT,
ADD COLUMN     "plain_body" TEXT,
ADD COLUMN     "langs" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "deadline" TIMESTAMP(3);

-- plain_body 는 htmlToText 가 필요해 백필로 채운다.
UPDATE "notice" n SET
  "title_ko" = coalesce(
    (SELECT c."title" FROM "crawl" c WHERE c."notice_id" = n."id" ORDER BY c."id" LIMIT 1),
    (SELECT c."title" FROM "content" c WHERE c."notice_id" = n."id" AND c."lang" = 'ko' LIMIT 1),
    ''
  ),
  "title_en" = CASE
    WHEN EXISTS (SELECT 1 FROM "crawl" c WHERE c."notice_id" = n."id") THEN NULL
    ELSE (SELECT c."title" FROM "content" c
          WHERE c."notice_id" = n."id" AND c."lang" = 'en' LIMIT 1)
  END,
  "langs" = coalesce(
    CASE WHEN EXISTS (SELECT 1 FROM "crawl" c WHERE c."notice_id" = n."id")
         THEN ARRAY['ko'] END,
    (SELECT array_agg(DISTINCT c."lang") FROM "content" c WHERE c."notice_id" = n."id"),
    ARRAY[]::TEXT[]
  ),
  "deadline" = CASE
    WHEN EXISTS (SELECT 1 FROM "crawl" c WHERE c."notice_id" = n."id") THEN NULL
    ELSE (SELECT c."deadline" FROM "content" c
          WHERE c."notice_id" = n."id" AND c."lang" = 'ko' LIMIT 1)
  END;

-- CreateIndex
CREATE INDEX "content_notice_id_idx" ON "content"("notice_id");

-- CreateIndex
CREATE INDEX "crawl_notice_id_idx" ON "crawl"("notice_id");

-- CreateIndex
CREATE INDEX "file_notice_id_idx" ON "file"("notice_id");
