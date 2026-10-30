-- Briefs become per (day, language, visible categories). The old rows are
-- only a cache of the current day's shared brief, so they're dropped and
-- regenerated on demand instead of being migrated.
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailyBrief" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
DROP TABLE "DailyBrief";
ALTER TABLE "new_DailyBrief" RENAME TO "DailyBrief";
CREATE UNIQUE INDEX "DailyBrief_key_key" ON "DailyBrief"("key");
CREATE INDEX "DailyBrief_date_idx" ON "DailyBrief"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
