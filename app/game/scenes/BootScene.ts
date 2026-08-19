import Phaser from "phaser";
import type { GameMode } from "@/game/GameConfig";

export class BootScene extends Phaser.Scene
{
    private mode!: GameMode;

    constructor()
    {
        super("BootScene");
    }

    init(data: { mode: GameMode })
    {
        this.mode = data.mode;
    }

    preload()
    {
        // Load real assets here later, e.g.:
        // this.load.image("card-back", "/assets/card-back.png");
    }

    create()
    {
        this.scene.start("GameScene", { mode: this.mode });
    }
}