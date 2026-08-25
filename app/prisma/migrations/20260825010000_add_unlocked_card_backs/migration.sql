-- AlterTable: track which cosmetic card backs each user has unlocked (index 0 is free for everyone)
ALTER TABLE "User" ADD COLUMN     "unlockedCardBacks" INTEGER[] NOT NULL DEFAULT ARRAY[0]::INTEGER[];
