-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "odooPricelistId" INTEGER,
    "odooPricelistName" TEXT,
    "discountType" TEXT NOT NULL,
    "discountValue" DECIMAL(65,30) NOT NULL,
    "maxDiscount" DECIMAL(65,30),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "timeWindow" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealCategory" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Deal_slug_key" ON "Deal"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_odooPricelistId_key" ON "Deal"("odooPricelistId");

-- CreateIndex
CREATE INDEX "Deal_slug_idx" ON "Deal"("slug");

-- CreateIndex
CREATE INDEX "Deal_isActive_idx" ON "Deal"("isActive");

-- CreateIndex
CREATE INDEX "Deal_odooPricelistId_idx" ON "Deal"("odooPricelistId");

-- CreateIndex
CREATE INDEX "Deal_priority_idx" ON "Deal"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "DealCategory_dealId_categoryId_key" ON "DealCategory"("dealId", "categoryId");

-- CreateIndex
CREATE INDEX "DealCategory_dealId_idx" ON "DealCategory"("dealId");

-- CreateIndex
CREATE INDEX "DealCategory_categoryId_idx" ON "DealCategory"("categoryId");

-- AddForeignKey
ALTER TABLE "DealCategory" ADD CONSTRAINT "DealCategory_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealCategory" ADD CONSTRAINT "DealCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

