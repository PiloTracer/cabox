/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('PAYMENT_PROOF', 'SUPPORT', 'RETURN_REQUEST', 'OTHER');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "promotionalCopy" JSONB,
ADD COLUMN     "promotionalMedia" JSONB,
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "OrderTicket" (
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

-- CreateTable
CREATE TABLE "StoreSettings" (
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

-- CreateIndex
CREATE INDEX "OrderTicket_orderId_idx" ON "OrderTicket"("orderId");

-- CreateIndex
CREATE INDEX "OrderTicket_orderNumber_idx" ON "OrderTicket"("orderNumber");

-- CreateIndex
CREATE INDEX "OrderTicket_status_idx" ON "OrderTicket"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- AddForeignKey
ALTER TABLE "OrderTicket" ADD CONSTRAINT "OrderTicket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
