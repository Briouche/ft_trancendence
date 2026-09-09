import Phaser from "phaser";
import type { GameMode } from "@/game/GameConfig";
import type { Difficulty } from "@/game/shared/protocol";
import { ensureCardFontLoaded } from "@/game/objects/gameFonts";
import { GAME_FONT_FAMILY_KEY } from "@/game/objects/gameFontRegistry";
import { CARD_BACK_COUNT } from "@/lib/cardBacks";

// First scene to run (see GameConfig.ts's preBoot). Preloads static gameplay assets (per-card art
// is loaded lazily instead — see CardAssetLoader.ts), waits for the custom font to be usable, then
// hands off to GameScene with the match config received from the page that mounted Phaser.
export class BootScene extends Phaser.Scene
{
    private mode!: GameMode;
    private difficulty!: Difficulty;
    private deckId!: number;
    private cardBack!: number;

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
        // Kicked off (not awaited) here rather than in create(), so the font fetch runs
        // concurrently with the image loads below instead of only starting once they've all
        // finished — ensureCardFontLoaded() memoizes, so create()'s later await just picks up
        // this same in-flight promise.
        void ensureCardFontLoaded();

        // Load assets here :
        this.load.image("shield_taunt", "/gameAssets/shield_taunt.webp");
        this.load.image("effect_lightning", "/gameAssets/lightning_bolt.webp");
        this.load.image("history_attack", "/gameAssets/attackSword.webp");
        this.load.image("history_turnEnded", "/gameAssets/hourglass.webp");
        this.load.image("wooden_table", "/gameAssets/wooden_table.webp");
        this.load.image("banner", "/gameAssets/UI_NoteBook_Banner04a.webp");
        this.load.image("emptyEnergy", "/gameAssets/UI_TravelBook_IconEnergy01g.webp");
        this.load.image("fullEnergy", "/gameAssets/UI_TravelBook_IconEnergy02a.webp");
        this.load.image("heroFrame", "/gameAssets/hero.webp");
        this.load.image("opponentHeroFrame", "/gameAssets/opponentHero.webp")
        this.load.image("frame_commune", "/textures/cards/frame/frame-commune.webp");
        this.load.image("frame_rare", "/textures/cards/frame/frame-rare.webp");
        this.load.image("frame_epique", "/textures/cards/frame/frame-epique.webp");
        this.load.image("frame_legendaire", "/textures/cards/frame/frame-legendaire.webp");


        for (let i = 0; i < CARD_BACK_COUNT; i++)
            this.load.image(`cardBack_${i}`, `/textures/cards/backs/${i}.webp`);
    }


    // These are pixel-art assets: Phaser's default bilinear filtering would blur them when
    // scaled, so force nearest-neighbor filtering to keep edges crisp.
    private static readonly PIXELATED_TEXTURE_KEYS = [
        "banner", "emptyEnergy", "fullEnergy", "heroFrame", "opponentHeroFrame",
        ...Array.from({ length: CARD_BACK_COUNT }, (_, i) => `cardBack_${i}`),
    ];

    async create()
    {
        for (const key of BootScene.PIXELATED_TEXTURE_KEYS)
            this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);

        const fontFamily = await ensureCardFontLoaded();
        this.game.registry.set(GAME_FONT_FAMILY_KEY, fontFamily);
        this.scene.start("GameScene", { mode: this.mode, difficulty: this.difficulty, deckId: this.deckId, cardBack: this.cardBack });
    }
}