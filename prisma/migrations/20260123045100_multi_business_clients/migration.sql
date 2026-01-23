/*
  Warnings:

  - You are about to drop the column `businessId` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `currentPoints` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `PointMovement` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `Redemption` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `Transaction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `password` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientBusinessId` to the `PointMovement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientBusinessId` to the `Redemption` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_businessId_fkey";

-- DropForeignKey
ALTER TABLE "PointMovement" DROP CONSTRAINT "PointMovement_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Redemption" DROP CONSTRAINT "Redemption_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_clientId_fkey";

-- DropIndex
DROP INDEX "Client_businessId_active_idx";

-- DropIndex
DROP INDEX "Client_businessId_phone_key";

-- DropIndex
DROP INDEX "PointMovement_businessId_clientId_idx";

-- DropIndex
DROP INDEX "PointMovement_clientId_createdAt_idx";

-- DropIndex
DROP INDEX "Redemption_clientId_status_idx";

-- DropIndex
DROP INDEX "Transaction_clientId_createdAt_idx";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "businessId",
DROP COLUMN "currentPoints",
ADD COLUMN     "password" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PointMovement" DROP COLUMN "clientId",
ADD COLUMN     "clientBusinessId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Redemption" DROP COLUMN "clientId",
ADD COLUMN     "clientBusinessId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "clientId",
ADD COLUMN     "clientBusinessId" UUID;

-- CreateTable
CREATE TABLE "ClientBusiness" (
    "id" UUID NOT NULL,
    "currentPoints" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" UUID NOT NULL,
    "businessId" UUID NOT NULL,

    CONSTRAINT "ClientBusiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientRefreshToken" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "clientId" UUID NOT NULL,

    CONSTRAINT "ClientRefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientBusiness_businessId_active_idx" ON "ClientBusiness"("businessId", "active");

-- CreateIndex
CREATE INDEX "ClientBusiness_clientId_active_idx" ON "ClientBusiness"("clientId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "ClientBusiness_clientId_businessId_key" ON "ClientBusiness"("clientId", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientRefreshToken_token_key" ON "ClientRefreshToken"("token");

-- CreateIndex
CREATE INDEX "ClientRefreshToken_clientId_idx" ON "ClientRefreshToken"("clientId");

-- CreateIndex
CREATE INDEX "ClientRefreshToken_token_idx" ON "ClientRefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Client_phone_key" ON "Client"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE INDEX "PointMovement_businessId_clientBusinessId_idx" ON "PointMovement"("businessId", "clientBusinessId");

-- CreateIndex
CREATE INDEX "PointMovement_clientBusinessId_createdAt_idx" ON "PointMovement"("clientBusinessId", "createdAt");

-- CreateIndex
CREATE INDEX "Redemption_clientBusinessId_status_idx" ON "Redemption"("clientBusinessId", "status");

-- CreateIndex
CREATE INDEX "Transaction_clientBusinessId_createdAt_idx" ON "Transaction"("clientBusinessId", "createdAt");

-- AddForeignKey
ALTER TABLE "ClientBusiness" ADD CONSTRAINT "ClientBusiness_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientBusiness" ADD CONSTRAINT "ClientBusiness_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_clientBusinessId_fkey" FOREIGN KEY ("clientBusinessId") REFERENCES "ClientBusiness"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointMovement" ADD CONSTRAINT "PointMovement_clientBusinessId_fkey" FOREIGN KEY ("clientBusinessId") REFERENCES "ClientBusiness"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_clientBusinessId_fkey" FOREIGN KEY ("clientBusinessId") REFERENCES "ClientBusiness"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientRefreshToken" ADD CONSTRAINT "ClientRefreshToken_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
