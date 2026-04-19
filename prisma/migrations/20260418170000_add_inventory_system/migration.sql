-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "subsection" TEXT,
    "unit" TEXT NOT NULL,
    "unitAr" TEXT NOT NULL,
    "countMethod" TEXT NOT NULL DEFAULT 'direct',
    "packSize" INTEGER NOT NULL DEFAULT 1,
    "isDailyBarCounted" BOOLEAN NOT NULL DEFAULT true,
    "isStorageCounted" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "minimumStock" DECIMAL(65,30) NOT NULL DEFAULT 5,
    "alertLevel" DECIMAL(65,30) NOT NULL DEFAULT 10,
    "maximumStock" DECIMAL(65,30) NOT NULL DEFAULT 50,
    "lastPurchasePrice" DECIMAL(65,30),
    "avgCost" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftSession" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "shiftSuggested" TEXT NOT NULL,
    "shiftConfirmed" TEXT NOT NULL,
    "baristaId" TEXT NOT NULL,
    "openingCountId" TEXT,
    "closingCountId" TEXT,
    "consumptionConfidence" TEXT NOT NULL DEFAULT 'unreliable',
    "status" TEXT NOT NULL DEFAULT 'open',
    "handoverNotes" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryCount" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "shiftSuggested" TEXT NOT NULL,
    "shiftConfirmed" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "countType" TEXT NOT NULL DEFAULT 'regular',
    "countedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "shortageNotes" TEXT,
    "wasteNotes" TEXT,
    "hasVarianceAlert" BOOLEAN NOT NULL DEFAULT false,
    "varianceNotes" TEXT,
    "correctionOfId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryCount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryCountEntry" (
    "id" TEXT NOT NULL,
    "countId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "packsCount" INTEGER NOT NULL DEFAULT 0,
    "looseSingles" INTEGER NOT NULL DEFAULT 0,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalQuantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryCountEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "note" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransfer" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "shiftSessionId" TEXT,
    "itemId" TEXT NOT NULL,
    "packsCount" INTEGER NOT NULL DEFAULT 0,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalUnits" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "unitUsed" TEXT NOT NULL,
    "fromLocation" TEXT NOT NULL DEFAULT 'storage',
    "toLocation" TEXT NOT NULL DEFAULT 'bar',
    "note" TEXT,
    "transferredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "supplierName" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "notes" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "receiptStatus" TEXT NOT NULL DEFAULT 'pending',
    "receivedAt" TIMESTAMP(3),
    "receivedById" TEXT,
    "totalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "destination" TEXT NOT NULL DEFAULT 'storage',
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseEntry" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "totalPrice" DECIMAL(65,30) NOT NULL,
    "receivedQty" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WasteEntry" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "shiftSessionId" TEXT,
    "location" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "category" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WasteEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "phone" TEXT,
    "pin" TEXT,
    "defaultShift" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryItem_section_sortOrder_idx" ON "InventoryItem"("section", "sortOrder");
CREATE INDEX "InventoryItem_isActive_isDailyBarCounted_idx" ON "InventoryItem"("isActive", "isDailyBarCounted");
CREATE INDEX "InventoryItem_isActive_isStorageCounted_idx" ON "InventoryItem"("isActive", "isStorageCounted");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftSession_openingCountId_key" ON "ShiftSession"("openingCountId");
CREATE UNIQUE INDEX "ShiftSession_closingCountId_key" ON "ShiftSession"("closingCountId");
CREATE UNIQUE INDEX "ShiftSession_date_shiftConfirmed_key" ON "ShiftSession"("date", "shiftConfirmed");
CREATE INDEX "ShiftSession_baristaId_idx" ON "ShiftSession"("baristaId");
CREATE INDEX "ShiftSession_date_idx" ON "ShiftSession"("date");
CREATE INDEX "ShiftSession_status_idx" ON "ShiftSession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryCount_date_shiftConfirmed_location_countedById_coun_key" ON "InventoryCount"("date", "shiftConfirmed", "location", "countedById", "countType");
CREATE INDEX "InventoryCount_date_location_idx" ON "InventoryCount"("date", "location");
CREATE INDEX "InventoryCount_countedById_idx" ON "InventoryCount"("countedById");
CREATE INDEX "InventoryCount_status_idx" ON "InventoryCount"("status");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryCountEntry_countId_itemId_key" ON "InventoryCountEntry"("countId", "itemId");
CREATE INDEX "InventoryCountEntry_countId_idx" ON "InventoryCountEntry"("countId");
CREATE INDEX "InventoryCountEntry_itemId_idx" ON "InventoryCountEntry"("itemId");

-- CreateIndex
CREATE INDEX "StockMovement_itemId_location_createdAt_idx" ON "StockMovement"("itemId", "location", "createdAt");
CREATE INDEX "StockMovement_referenceType_referenceId_idx" ON "StockMovement"("referenceType", "referenceId");
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

-- CreateIndex
CREATE INDEX "StockTransfer_date_idx" ON "StockTransfer"("date");
CREATE INDEX "StockTransfer_itemId_idx" ON "StockTransfer"("itemId");
CREATE INDEX "StockTransfer_shiftSessionId_idx" ON "StockTransfer"("shiftSessionId");

-- CreateIndex
CREATE INDEX "Purchase_date_idx" ON "Purchase"("date");
CREATE INDEX "Purchase_receiptStatus_idx" ON "Purchase"("receiptStatus");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseEntry_purchaseId_itemId_key" ON "PurchaseEntry"("purchaseId", "itemId");
CREATE INDEX "PurchaseEntry_purchaseId_idx" ON "PurchaseEntry"("purchaseId");
CREATE INDEX "PurchaseEntry_itemId_idx" ON "PurchaseEntry"("itemId");

-- CreateIndex
CREATE INDEX "WasteEntry_date_idx" ON "WasteEntry"("date");
CREATE INDEX "WasteEntry_itemId_idx" ON "WasteEntry"("itemId");
CREATE INDEX "WasteEntry_location_idx" ON "WasteEntry"("location");
CREATE INDEX "WasteEntry_category_idx" ON "WasteEntry"("category");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_userId_key" ON "StaffProfile"("userId");

-- CreateIndex
CREATE INDEX "Recipe_productId_idx" ON "Recipe"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeIngredient_recipeId_itemId_key" ON "RecipeIngredient"("recipeId", "itemId");
CREATE INDEX "RecipeIngredient_recipeId_idx" ON "RecipeIngredient"("recipeId");
CREATE INDEX "RecipeIngredient_itemId_idx" ON "RecipeIngredient"("itemId");

-- AddForeignKey
ALTER TABLE "ShiftSession" ADD CONSTRAINT "ShiftSession_baristaId_fkey" FOREIGN KEY ("baristaId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShiftSession" ADD CONSTRAINT "ShiftSession_openingCountId_fkey" FOREIGN KEY ("openingCountId") REFERENCES "InventoryCount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShiftSession" ADD CONSTRAINT "ShiftSession_closingCountId_fkey" FOREIGN KEY ("closingCountId") REFERENCES "InventoryCount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InventoryCount" ADD CONSTRAINT "InventoryCount_countedById_fkey" FOREIGN KEY ("countedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryCount" ADD CONSTRAINT "InventoryCount_correctionOfId_fkey" FOREIGN KEY ("correctionOfId") REFERENCES "InventoryCount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InventoryCountEntry" ADD CONSTRAINT "InventoryCountEntry_countId_fkey" FOREIGN KEY ("countId") REFERENCES "InventoryCount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryCountEntry" ADD CONSTRAINT "InventoryCountEntry_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_transferredById_fkey" FOREIGN KEY ("transferredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PurchaseEntry" ADD CONSTRAINT "PurchaseEntry_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseEntry" ADD CONSTRAINT "PurchaseEntry_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WasteEntry" ADD CONSTRAINT "WasteEntry_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WasteEntry" ADD CONSTRAINT "WasteEntry_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
