-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "codFee" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CheckoutConfig" (
    "id" TEXT NOT NULL DEFAULT 'checkout',
    "enabledPaymentMethods" JSONB NOT NULL,
    "deliveryFee" DECIMAL(65,30) NOT NULL DEFAULT 15,
    "codFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutConfig_pkey" PRIMARY KEY ("id")
);
