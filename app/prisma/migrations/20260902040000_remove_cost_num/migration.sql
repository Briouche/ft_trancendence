-- costNum was never written by the seed script and always stayed at its default (0), even for
-- cards with a non-zero cost — dead/unreliable field, confirmed unused anywhere at runtime.
ALTER TABLE "Card" DROP COLUMN "costNum";
