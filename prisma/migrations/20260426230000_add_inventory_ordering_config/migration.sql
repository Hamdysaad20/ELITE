-- Add configurable fallback ordering fields for inventory shortages.
ALTER TABLE "InventoryItem"
ADD COLUMN "backupThreshold" DECIMAL(65,30) NOT NULL DEFAULT 1,
ADD COLUMN "preferredSupplier" TEXT;

CREATE TABLE "InventoryRuleChangeLog" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "changedById" TEXT NOT NULL,
  "field" TEXT NOT NULL,
  "oldValue" TEXT,
  "newValue" TEXT,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InventoryRuleChangeLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "InventoryRuleChangeLog"
ADD CONSTRAINT "InventoryRuleChangeLog_itemId_fkey"
FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InventoryRuleChangeLog"
ADD CONSTRAINT "InventoryRuleChangeLog_changedById_fkey"
FOREIGN KEY ("changedById") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "InventoryRuleChangeLog_itemId_createdAt_idx"
ON "InventoryRuleChangeLog"("itemId", "createdAt" DESC);

CREATE INDEX "InventoryRuleChangeLog_changedById_createdAt_idx"
ON "InventoryRuleChangeLog"("changedById", "createdAt" DESC);
