-- Cleanup: OAuthAccount/Friendship/Message and the 2FA/avatar/status fields on User were an
-- alternate schema explored on a different branch (kept as a commented reference in
-- prisma/fullschema.prisma) and were never adopted — 42 OAuth links via User.fortyTwoId
-- instead. Drops the tables/columns/enums this merge's schema.prisma no longer declares,
-- including `updatedAt` (NOT NULL, no default), which was rejecting every new User insert.

-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_requesterId_fkey";
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_addresseeId_fkey";
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";
ALTER TABLE "Message" DROP CONSTRAINT "Message_recipientId_fkey";
ALTER TABLE "OAuthAccount" DROP CONSTRAINT "OAuthAccount_userId_fkey";

-- DropTable
DROP TABLE "Friendship";
DROP TABLE "Message";
DROP TABLE "OAuthAccount";

-- AlterTable
ALTER TABLE "User"
  DROP COLUMN "avatar",
  DROP COLUMN "emailVerified",
  DROP COLUMN "status",
  DROP COLUMN "twoFactorBackupCodeHashes",
  DROP COLUMN "twoFactorEnabled",
  DROP COLUMN "twoFactorSecret",
  DROP COLUMN "updatedAt";

-- DropEnum
DROP TYPE "UserStatus";
DROP TYPE "FriendshipStatus";
