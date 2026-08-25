-- AlterTable: cosmetic card-back choice (index into the 20-design catalog, 0 = default)
ALTER TABLE "User" ADD COLUMN     "cardBack" INTEGER NOT NULL DEFAULT 0;
