import Phaser from "phaser";
import type { GameMode } from "@/game/GameConfig";
import type { Difficulty } from "@/game/shared/protocol";

export class BootScene extends Phaser.Scene
{
    private mode!: GameMode;
    private difficulty!: Difficulty;
    private deckId!: number;

    constructor()
    {
        super("BootScene");
    }

    init(data: { mode: GameMode; difficulty: Difficulty; deckId: number })
    {
        this.mode = data.mode;
        this.difficulty = data.difficulty;
        this.deckId = data.deckId;
    }

    preload() {
        // Load assets here :
        this.load.image("placeholder_card", "/gameAssets/cards/placeholder_card.png");
        this.load.image("shield_taunt", "/gameAssets/shield_taunt.png");
        this.load.image("effect_lightning", "/gameAssets/lightning_bolt.png");
        this.load.image("wooden_table", "/gameAssets/wooden_table.png");
        this.load.image("cardBack", "/gameAssets/cardBack.png");
        this.load.image("banner", "/gameAssets/UI_NoteBook_Banner04a.png");
        this.load.image("emptyEnergy", "/gameAssets/UI_TravelBook_IconEnergy01g.png");
        this.load.image("fullEnergy", "/gameAssets/UI_TravelBook_IconEnergy02a.png");
        this.load.image("heroFrame", "/gameAssets/hero.png");
        this.load.image("opponentHeroFrame", "/gameAssets/opponentHero.png")
        this.load.image("frame_commune", "/textures/cards/frame-commune.png");
        this.load.image("frame_rare", "/textures/cards/frame-rare.png");
        this.load.image("frame_epique", "/textures/cards/frame-epique.png");
        this.load.image("frame_legendaire", "/textures/cards/frame-legendaire.png");
    }

    create()
    {
        this.scene.start("GameScene", { mode: this.mode, difficulty: this.difficulty, deckId: this.deckId });
    }
}