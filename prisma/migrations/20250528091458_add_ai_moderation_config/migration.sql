-- CreateTable
CREATE TABLE "AIModerationConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "autoMarkThreshold" REAL NOT NULL DEFAULT 0.92,
    "notifyAdminThreshold" REAL NOT NULL DEFAULT 0.85,
    "enableAutoDeduction" BOOLEAN NOT NULL DEFAULT true,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT
);
