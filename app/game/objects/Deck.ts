import Phaser from "phaser";

/** Deck pile: a card back that shows the remaining card count on hover. */
export class Deck
{
    public graphic: Phaser.GameObjects.Image;
    private text: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number, width = 150, height = 90, cardBackKey = "cardBack_0")
    {
        this.graphic = scene.add.image(x, y, cardBackKey).setDisplaySize(width, height);

        this.text = scene.add.text(x, y - 30, "",
        {
            fontSize: "24px",
            color: "#fff",
            align: "center",
            stroke: "#000000",
            strokeThickness: 4
        }).setOrigin(0.5).setVisible(false);

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
        this.graphic.setDisplaySize(width, height);
    }

    update(count: number): void
    {
        this.text.setText(`${count}`);
    }
}
