import Phaser from "phaser";

export class Deck
{
    private scene: Phaser.Scene;
    private count: number = 0;
    public graphic: Phaser.GameObjects.Rectangle;
    private text: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number, width = 90, height = 60)
    {
        this.scene = scene;
        this.graphic = scene.add.rectangle(x, y, width, height, 0x8B4513, 0.7).setStrokeStyle(2, 0x000000);
        this.text = scene.add.text(x, y - 30, "",
        {
            fontSize: "24px",
            color: "#fff",
            align: "center"
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
        this.graphic.setSize(width, height);
    }

    update(count: number): void
    {
        this.count = count;
        this.text.setText(`${count}`);
    }
}
