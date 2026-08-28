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
        this.load.image("banner", "gameAssets/UI_NoteBook_Banner04a.png");
        this.load.image("emptyEnergy", "gameAssets/UI_TravelBook_IconEnergy01g.png");
        this.load.image("fullEnergy", "gameAssets/UI_TravelBook_IconEnergy02a.png");
        //this.load.image("boardFrame", "/gameAssets/UI_TabletBook_Cover01a.png")
    }

    create()
    {
        this.scene.start("GameScene");
    }
}
