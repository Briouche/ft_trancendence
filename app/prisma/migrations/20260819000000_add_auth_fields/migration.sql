-- AlterTable: add username + tokenVersion, make password optional (OAuth-ready), drop unused name
ALTER TABLE "User" ADD COLUMN     "username" TEXT,
ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- Backfill username for any pre-existing rows before enforcing NOT NULL/UNIQUE
UPDATE "User" SET "username" = 'user_' || "id" WHERE "username" IS NULL;

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "User" DROP COLUMN "name";

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
