-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT '',
    "rarity" TEXT NOT NULL,
    "cost" TEXT NOT NULL,
    "costNum" INTEGER NOT NULL DEFAULT 0,
    "atk" TEXT NOT NULL,
    "def" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "emoji" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT '',
    "legendId" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);
