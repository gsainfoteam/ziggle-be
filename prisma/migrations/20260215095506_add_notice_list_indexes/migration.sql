-- DropIndex
DROP INDEX "notice_deleted_at_idx";

-- CreateIndex
CREATE INDEX "notice_deleted_at_last_edited_at_idx" ON "notice"("deleted_at", "last_edited_at" DESC);

-- CreateIndex
CREATE INDEX "notice_deleted_at_current_deadline_idx" ON "notice"("deleted_at", "current_deadline");

-- CreateIndex
CREATE INDEX "notice_deleted_at_created_at_views_idx" ON "notice"("deleted_at", "created_at" DESC, "views" DESC);

-- CreateIndex
CREATE INDEX "reaction_notice_id_deleted_at_idx" ON "reaction"("notice_id", "deleted_at");
