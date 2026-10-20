-- RedefineTables
-- old VisitState was a singleton (id=1, no userId) — no sensible way to
-- carry that row forward automatically, so the app re-seeds a per-user row
-- after this migration instead of migrating it inline
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
DROP TABLE "VisitState";
CREATE TABLE "VisitState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "lastVisitedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VisitState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "VisitState_userId_key" ON "VisitState"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
