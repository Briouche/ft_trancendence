import Phaser from "phaser";
import type { GameMode } from "@/game/GameConfig";
import type { Difficulty } from "@/game/shared/protocol";
import { ensureCardFontLoaded } from "@/game/objects/gameFonts";
import { GAME_FONT_FAMILY_KEY } from "@/game/objects/gameFontRegistry";
import { CARD_BACK_COUNT } from "@/lib/cardBacks";

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
        // Load assets here :
        this.load.image("placeholder_card", "/gameAssets/cards/placeholder_card.png");
        this.load.image("shield_taunt", "/gameAssets/shield_taunt.png");
        this.load.image("effect_lightning", "/gameAssets/lightning_bolt.png");
        this.load.image("history_attack", "/gameAssets/attackSword.webp");
        this.load.image("history_turnEnded", "/gameAssets/hourglass.webp");
        this.load.image("wooden_table", "/gameAssets/wooden_table.webp");
        this.load.image("banner", "/gameAssets/UI_NoteBook_Banner04a.png");
        this.load.image("emptyEnergy", "/gameAssets/UI_TravelBook_IconEnergy01g.png");
        this.load.image("fullEnergy", "/gameAssets/UI_TravelBook_IconEnergy02a.png");
        this.load.image("heroFrame", "/gameAssets/hero.png");
        this.load.image("opponentHeroFrame", "/gameAssets/opponentHero.png")
        this.load.image("frame_commune", "/textures/cards/frame-commune.png");
        this.load.image("frame_rare", "/textures/cards/frame-rare.png");
        this.load.image("frame_epique", "/textures/cards/frame-epique.png");
        this.load.image("frame_legendaire", "/textures/cards/frame-legendaire.png");


        for (let i = 0; i < CARD_BACK_COUNT; i++)
            this.load.image(`cardBack_${i}`, `/textures/cards/backs/${i}.png`);
    }


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