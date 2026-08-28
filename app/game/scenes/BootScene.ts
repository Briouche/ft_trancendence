import Phaser from "phaser";
import type { GameMode } from "@/game/GameConfig";
import type { Difficulty } from "@/game/shared/protocol";

export class BootScene extends Phaser.Scene
{
    private mode!: GameMode;
    private difficulty!: Difficulty;

    constructor()
    {
        super("BootScene");
    }

    init(data: { mode: GameMode; difficulty: Difficulty })
    {
        this.mode = data.mode;
        this.difficulty = data.difficulty;
    }

    preload() {
        // Load assets here :
        this.load.image("shield_taunt", "/gameAssets/shield_taunt.png");
        this.load.image("effect_lightning", "/gameAssets/lightning_bolt.png");
        this.load.image("wooden_table", "/gameAssets/wooden_table.png");
        this.load.image("cardBack", "/gameAssets/cardBack.png");
        this.load.image("banner", "/gameAssets/UI_NoteBook_Banner04a.png");
        this.load.image("emptyEnergy", "/gameAssets/UI_TravelBook_IconEnergy01g.png");
        this.load.image("fullEnergy", "/gameAssets/UI_TravelBook_IconEnergy02a.png");
        this.load.image("heroFrame", "/gameAssets/hero.png");
        this.load.image("opponentHeroFrame", "/gameAssets/opponentHero.png")
    }

    create()
    {
        this.scene.start("GameScene", { mode: this.mode, difficulty: this.difficulty });
    }
}