import Phaser from "phaser";

export class BootScene extends Phaser.Scene
{
    constructor()
    {
        super("BootScene");
    }

    preload()
    {
        // Load assets here :
        this.load.image("shield_taunt", "/gameAssets/shield_taunt.png");
        this.load.image("effect_lightning", "/gameAssets/lightning_bolt.png");
        this.load.image("wooden_table", "/gameAssets/wooden_table.png");
        this.load.image("cardBack", "gameAssets/cardBack.png");
    }

    create()
    {
        this.scene.start("GameScene");
    }
}
