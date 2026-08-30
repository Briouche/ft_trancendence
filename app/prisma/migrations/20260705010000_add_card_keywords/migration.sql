-- CreateEnum
CREATE TYPE "Keyword" AS ENUM ('RUEE', 'RALE_DAGONIE', 'CRI_DE_GUERRE', 'REGENERATION', 'AVENTURIER', 'TAUNT', 'SOIGNE', 'VOL_DE_VIE', 'SILENCE');

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "keywords" "Keyword"[] NOT NULL DEFAULT ARRAY[]::"Keyword"[];
