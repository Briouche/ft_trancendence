-- AlterTable
ALTER TABLE "User" ADD COLUMN     "unopenedPacks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pityCounter" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "UserCard" (
    "userId" INTEGER NOT NULL,
    "cardId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserCard_pkey" PRIMARY KEY ("userId","cardId")
);

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
