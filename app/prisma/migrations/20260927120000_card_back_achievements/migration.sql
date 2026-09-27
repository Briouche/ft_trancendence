-- DropForeignKey
ALTER TABLE "UserAchievement" DROP CONSTRAINT "UserAchievement_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "packsOpened";

-- DropTable
DROP TABLE "UserAchievement";

