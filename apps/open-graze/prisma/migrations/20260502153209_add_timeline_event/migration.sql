-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceKey" TEXT NOT NULL DEFAULT 'default',
    "lineHash" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "ts" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "TimelineEvent_lineHash_key" ON "TimelineEvent"("lineHash");

-- CreateIndex
CREATE INDEX "TimelineEvent_workspaceKey_ts_idx" ON "TimelineEvent"("workspaceKey", "ts");
