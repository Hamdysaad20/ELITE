-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "odooSyncAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "odooSyncLastError" TEXT,
ADD COLUMN     "odooSyncLastAttemptAt" TIMESTAMP(3),
ADD COLUMN     "odooSyncNotifiedAt" TIMESTAMP(3);

