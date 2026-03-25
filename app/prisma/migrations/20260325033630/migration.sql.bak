/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum (idempotent)
DO $$ BEGIN
  CREATE TYPE "TicketType" AS ENUM ('PAYMENT_PROOF', 'SUPPORT', 'RETURN_REQUEST', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum (idempotent)
DO $$ BEGIN
  CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable (idempotent)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "promotionalCopy" JSONB;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "promotionalMedia" JSONB;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "stock" INTEGER NOT NULL DEFAULT 0;

-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "OrderTicket" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "type" "TicketType" NOT NULL DEFAULT 'PAYMENT_PROOF',
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "message" TEXT,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "StoreSettings" (
    "key" TEXT NOT NULL DEFAULT 'default',
    "storeName" TEXT NOT NULL DEFAULT 'Cabox',
    "storeTagline" TEXT NOT NULL DEFAULT 'Moda Curada de Costa Rica',
    "supportPhone" TEXT NOT NULL DEFAULT '',
    "paymentMethods" JSONB NOT NULL DEFAULT '{}',
    "logoUrl" TEXT NOT NULL DEFAULT '/logo.png',
    "heroImageUrl" TEXT NOT NULL DEFAULT '',
    "footerText" TEXT NOT NULL DEFAULT 'Moda curada con amor · Costa Rica',
    "themeColor" TEXT NOT NULL DEFAULT '#8B5E3C',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "OrderTicket_orderId_idx" ON "OrderTicket"("orderId");
CREATE INDEX IF NOT EXISTS "OrderTicket_orderNumber_idx" ON "OrderTicket"("orderNumber");
CREATE INDEX IF NOT EXISTS "OrderTicket_status_idx" ON "OrderTicket"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_phone_key" ON "Customer"("phone");

-- AddForeignKey (idempotent)
DO $$ BEGIN
  ALTER TABLE "OrderTicket" ADD CONSTRAINT "OrderTicket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
