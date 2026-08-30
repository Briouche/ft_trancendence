-- AlterTable: track win count on the account (0 for everyone until a live game mode exists)
ALTER TABLE "User" ADD COLUMN     "wins" INTEGER NOT NULL DEFAULT 0;
