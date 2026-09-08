-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Keyword" AS ENUM ('RUEE', 'RALE_DAGONIE', 'CRI_DE_GUERRE', 'REGENERATION', 'AVENTURIER', 'TAUNT', 'SOIGNE', 'VOL_DE_VIE', 'SILENCE');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "fortyTwoId" INTEGER,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unopenedPacks" INTEGER NOT NULL DEFAULT 0,
    "pityCounter" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "cardBack" INTEGER NOT NULL DEFAULT 0,
    "unlockedCardBacks" INTEGER[] DEFAULT ARRAY[0]::INTEGER[],

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "assetKey" TEXT NOT NULL DEFAULT 'placeholder_card',
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT '',
    "rarity" TEXT NOT NULL,
    "cost" TEXT NOT NULL,
    "atk" TEXT NOT NULL,
    "def" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "legendId" TEXT NOT NULL DEFAULT '',
    "taunt" BOOLEAN,
    "rush" BOOLEAN,
    "cannotAttack" BOOLEAN,
    "archi" BOOLEAN,
    "spellpower" INTEGER,
    "battlecry" JSONB,
    "deathrattle" JSONB,
    "onAttack" JSONB,
    "onDamage" JSONB,
    "startOfTurnEffect" JSONB,
    "endOfTurnEffect" JSONB,
    "spellEffect" JSONB,
    "keywords" "Keyword"[] DEFAULT ARRAY[]::"Keyword"[],

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCard" (
    "userId" INTEGER NOT NULL,
    "cardId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserCard_pkey" PRIMARY KEY ("userId","cardId")
);

-- CreateTable
CREATE TABLE "Deck" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeckCard" (
    "deckId" INTEGER NOT NULL,
    "cardId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "DeckCard_pkey" PRIMARY KEY ("deckId","cardId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_fortyTwoId_key" ON "User"("fortyTwoId");

-- CreateIndex
CREATE INDEX "Deck_userId_idx" ON "Deck"("userId");

-- CreateIndex
CREATE INDEX "DeckCard_cardId_idx" ON "DeckCard"("cardId");

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckCard" ADD CONSTRAINT "DeckCard_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckCard" ADD CONSTRAINT "DeckCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
