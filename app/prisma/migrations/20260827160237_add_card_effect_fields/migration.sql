-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "assetKey" TEXT NOT NULL DEFAULT 'placeholder_card',
ADD COLUMN     "battlecry" JSONB,
ADD COLUMN     "deathrattle" JSONB,
ADD COLUMN     "endOfTurnEffect" JSONB,
ADD COLUMN     "onAttack" JSONB,
ADD COLUMN     "onDamage" JSONB,
ADD COLUMN     "rush" BOOLEAN,
ADD COLUMN     "spellEffect" JSONB,
ADD COLUMN     "startOfTurnEffect" JSONB,
ADD COLUMN     "taunt" BOOLEAN;
