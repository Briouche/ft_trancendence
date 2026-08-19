import Phaser from "phaser";

const BACK_COLOR = 0x2b2340;
const BACK_STROKE = 0x7f5fff;
const GLYPH_COLOR = "#7f5fff";

export class OpponentCard extends Phaser.GameObjects.Container
{
    private back: Phaser.GameObjects.Rectangle;
    private inset: Phaser.GameObjects.Rectangle;
    private glyph: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, width: number, height: number)
    {
        super(scene, 0, 0);

        //add card back asset to replace this
        this.back = scene.add.rectangle(0, 0, width, height, BACK_COLOR).setStrokeStyle(2, BACK_STROKE);
        this.inset = scene.add.rectangle(0, 0, width * 0.75, height * 0.75).setStrokeStyle(1, BACK_STROKE, 0.6);
        this.glyph = scene.add.text(0, 0, "?", { fontSize: `${Math.round(height * 0.28)}px`, color: GLYPH_COLOR }).setOrigin(0.5);

        this.add([this.back, this.inset, this.glyph]);
        this.resize(width, height);
        scene.add.existing(this);
    }

    resize(width: number, height: number): void
    {
        this.back.setSize(width, height);
        this.inset.setSize(width * 0.75, height * 0.75);
        this.glyph.setFontSize(`${Math.round(height * 0.28)}px`);
        this.setSize(width, height);
    }
}
