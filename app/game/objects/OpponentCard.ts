import Phaser from "phaser";

export class OpponentCard extends Phaser.GameObjects.Container
{
    private back: Phaser.GameObjects.Image;

    constructor(scene: Phaser.Scene, width: number, height: number)
    {
        super(scene, 0, 0);

        this.back = scene.add.image(0, 0, "cardBack");
        this.back.setOrigin(0.5, 0.5);
        this.add(this.back);

        this.resize(width, height);
        scene.add.existing(this);
    }

    resize(width: number, height: number): void
    {
        this.back.setDisplaySize(width, height);
        this.setSize(width, height);
    }
}
