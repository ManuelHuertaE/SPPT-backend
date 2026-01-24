-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "description" TEXT;
