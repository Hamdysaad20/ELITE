-- AlterTable: Add Paymob payment fields to Order table
-- These fields may already exist, so we use IF NOT EXISTS pattern
DO $$ 
BEGIN
  -- Add paymobTransactionId column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Order' AND column_name = 'paymobTransactionId'
  ) THEN
    ALTER TABLE "Order" ADD COLUMN "paymobTransactionId" TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS "Order_paymobTransactionId_key" ON "Order"("paymobTransactionId");
  END IF;

  -- Add paymobPaymentKey column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Order' AND column_name = 'paymobPaymentKey'
  ) THEN
    ALTER TABLE "Order" ADD COLUMN "paymobPaymentKey" TEXT;
  END IF;

  -- Add paymentIntentId column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Order' AND column_name = 'paymentIntentId'
  ) THEN
    ALTER TABLE "Order" ADD COLUMN "paymentIntentId" TEXT;
  END IF;
END $$;
