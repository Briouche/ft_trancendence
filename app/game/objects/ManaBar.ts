import Phaser from "phaser";

export class Manabar
{
    private scene: Phaser.Scene;
    private mana: number = 0;
    private maxMana: number = 0;
    private graphic: Phaser.GameObjects.Rectangle;
    private text: Phaser.GameObjects.Text;
    private zone: Phaser.GameObjects.Zone;

    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number)
    {
        this.scene = scene;
        this.graphic = scene.add.rectangle(x, y, width, height, 0x0000ff, 0.5)
            .setStrokeStyle(2, 0xffffff);
        this.text = scene.add.text(x, y, "", {
            fontSize: "16px",
            color: "#fff",
            align: "center"
        }).setOrigin(0.5);
        this.zone = scene.add.zone(x, y, width, height);
    }

    setPosition(x: number, y: number): void
    {
        this.graphic.setPosition(x, y);
        this.text.setPosition(x, y);
        this.zone.setPosition(x, y);
    }

    resize(width: number, height: number): void
    {
        this.graphic.setSize(width, height);
        this.zone.setSize(width, height);
    }

    update(mana: number, maxMana: number): void
    {
        this.mana = mana;
        this.maxMana = maxMana;
        this.text.setText(`${mana}/${maxMana}`);
    }
}
