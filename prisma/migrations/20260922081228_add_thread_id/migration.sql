-- AlterTable
ALTER TABLE "Article" ADD COLUMN "threadId" TEXT;

-- CreateIndex
CREATE INDEX "Article_threadId_idx" ON "Article"("threadId");
