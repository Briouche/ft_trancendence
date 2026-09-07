import Phaser from "phaser";

export class Deck
{
    private scene: Phaser.Scene;
    private count: number = 0;
    public graphic: Phaser.GameObjects.Image;
    private text: Phaser.GameObjects.Text;
    private width: number;
    private height: number;

    constructor(scene: Phaser.Scene, x: number, y: number, width = 150, height = 90, cardBackKey = "cardBack_0")
    {
        this.scene = scene;
        this.width = width;
        this.height = height;

        this.graphic = scene.add.image(x, y, cardBackKey).setDisplaySize(width, height);

        this.text = scene.add.text(x, y - 30, "",
        {
            fontSize: "24px",
            color: "#fff",
            align: "center",
            stroke: "#000000",
            strokeThickness: 4 
        }).setOrigin(0.5).setVisible(false);

        this.setupInteractivity();
    }

    private setupInteractivity(): void
    {
        this.graphic.setInteractive({ useHandCursor: true });
        this.graphic.on("pointerover", () => this.text.setVisible(true));
        this.graphic.on("pointerout", () => this.text.setVisible(false));
    }

    setPosition(x: number, y: number, offset: number = 20): void
    {
        this.graphic.setPosition(x, y);
        this.text.setPosition(x, y - offset);
    }

    resize(width: number, height: number): void
    {
        this.width = width;
        this.height = height;
        this.graphic.setDisplaySize(width, height);
    }

    update(count: number): void
    {
        this.count = count;
        this.text.setText(`${count}`);
    }
}
