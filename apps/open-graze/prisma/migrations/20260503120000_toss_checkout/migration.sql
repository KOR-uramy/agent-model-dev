-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN "tossLastPaymentKey" TEXT;

-- CreateTable
CREATE TABLE "TossCheckoutOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "amountKrw" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TossCheckoutOrder_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TossCheckoutOrder_orderId_key" ON "TossCheckoutOrder"("orderId");
CREATE INDEX "TossCheckoutOrder_workspaceId_idx" ON "TossCheckoutOrder"("workspaceId");
