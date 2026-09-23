-- CreateTable
CREATE TABLE "DailyBrief" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceType" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "externalId" TEXT,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "score" INTEGER,
    "commentsCount" INTEGER,
    "publishedAt" DATETIME,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT,
    "priority" INTEGER,
    "worthReading" BOOLEAN,
    "summary" TEXT,
    "classifiedAt" DATETIME,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" DATETIME,
    "duplicateOfId" TEXT,
    CONSTRAINT "Article_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "Article" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Article" ("category", "classifiedAt", "commentsCount", "content", "duplicateOfId", "externalId", "fetchedAt", "id", "priority", "publishedAt", "read", "readAt", "saved", "score", "sourceName", "sourceType", "summary", "title", "url", "worthReading") SELECT "category", "classifiedAt", "commentsCount", "content", "duplicateOfId", "externalId", "fetchedAt", "id", "priority", "publishedAt", "read", "readAt", "saved", "score", "sourceName", "sourceType", "summary", "title", "url", "worthReading" FROM "Article";
DROP TABLE "Article";
ALTER TABLE "new_Article" RENAME TO "Article";
CREATE UNIQUE INDEX "Article_url_key" ON "Article"("url");
CREATE INDEX "Article_sourceType_idx" ON "Article"("sourceType");
CREATE INDEX "Article_category_idx" ON "Article"("category");
CREATE INDEX "Article_priority_idx" ON "Article"("priority");
CREATE INDEX "Article_publishedAt_idx" ON "Article"("publishedAt");
CREATE INDEX "Article_readAt_idx" ON "Article"("readAt");
CREATE INDEX "Article_duplicateOfId_idx" ON "Article"("duplicateOfId");
CREATE INDEX "Article_dismissed_idx" ON "Article"("dismissed");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "DailyBrief_date_key" ON "DailyBrief"("date");
