-- Starter kit: new accounts start with 5 unopened packs (existing accounts are unchanged).
ALTER TABLE "User" ALTER COLUMN "unopenedPacks" SET DEFAULT 5;
