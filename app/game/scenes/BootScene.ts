import Phaser from "phaser";

export class BootScene extends Phaser.Scene
{
    constructor()
    {
        super("BootScene");
    }

    preload()
    {
        // Load real assets here later, e.g.:
        // this.load.image("card-back", "/assets/card-back.png");
    }

    create()
    {
        this.scene.start("GameScene");
    }
}
