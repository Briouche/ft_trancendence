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

    preload() { /* unchanged */ }

    create()
    {
        this.scene.start("GameScene", { mode: this.mode, difficulty: this.difficulty });
    }
}