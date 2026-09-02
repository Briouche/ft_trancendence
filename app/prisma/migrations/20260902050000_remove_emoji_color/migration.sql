-- emoji/color were only ever used by the old CSS card design (now replaced by the drawn rarity
-- frames, CardFace.tsx CARD_ART) and to prefix the card name in the game engine's card loader —
-- neither is used anywhere now.
ALTER TABLE "Card" DROP COLUMN "emoji";
ALTER TABLE "Card" DROP COLUMN "color";
