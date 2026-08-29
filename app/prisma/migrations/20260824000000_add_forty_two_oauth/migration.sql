-- AlterTable: link accounts to their 42 intra id ("Sign in with 42")
ALTER TABLE "User" ADD COLUMN     "fortyTwoId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "User_fortyTwoId_key" ON "User"("fortyTwoId");
