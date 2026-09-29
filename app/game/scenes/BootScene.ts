import Phaser from "phaser";
import type { GameMode } from "@/game/GameConfig";
import type { Difficulty } from "@/game/shared/protocol";
import { ensureCardFontLoaded } from "@/game/objects/gameFonts";
import { GAME_FONT_FAMILY_KEY } from "@/game/objects/gameFontRegistry";
import { CARD_BACK_COUNT } from "@/lib/cardBacks";
import { BOOT_IMAGE_ASSETS } from "./bootAssets";

// Preloads the static assets (card art loads lazily, see CardAssetLoader), waits for the
// font, then starts GameScene with the match params.
export class BootScene extends Phaser.Scene
{
    private mode!: GameMode;
    private difficulty!: Difficulty;
    private deckId!: number;
    private cardBack!: number;

    // Pixel-art textures rendered with nearest-neighbor filtering.
    private static readonly PIXELATED_TEXTURE_KEYS = [
        "banner", "emptyEnergy", "fullEnergy", "heroFrame", "opponentHeroFrame",
        ...Array.from({ length: CARD_BACK_COUNT }, (_, i) => `cardBack_${i}`),
    ];

    constructor()
    {
        super("BootScene");
    }

    init(data: { mode: GameMode; difficulty: Difficulty; deckId: number; cardBack: number })
    {
        this.mode = data.mode;
        this.difficulty = data.difficulty;
        this.deckId = data.deckId;
        this.cardBack = data.cardBack;
    }

    preload() {
        void ensureCardFontLoaded();

        // Load assets here :
        for (const { key, path } of BOOT_IMAGE_ASSETS)
            this.load.image(key, path);
    }

    async create()
    {
        for (const key of BootScene.PIXELATED_TEXTURE_KEYS)
            this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);

        const fontFamily = await ensureCardFontLoaded();
        this.game.registry.set(GAME_FONT_FAMILY_KEY, fontFamily);
        this.scene.start("GameScene", { mode: this.mode, difficulty: this.difficulty, deckId: this.deckId, cardBack: this.cardBack });
    }
}
