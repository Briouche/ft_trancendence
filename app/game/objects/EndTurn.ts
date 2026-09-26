import Phaser from "phaser";
import { EventManager } from "../EventManager";
import { GAME_FONT_FAMILY_KEY } from "./gameFontRegistry";

const BUTTON_COLOR = 0x2b4a2b;
const BUTTON_HOVER_COLOR = 0x3a663a;
const BUTTON_STROKE = 0x66cc66;
const LABEL_COLOR = "#ffffff";

/** "End Turn" button. */
export class EndTurn extends Phaser.GameObjects.Container
{
    private background: Phaser.GameObjects.Rectangle;
    private label: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, width: number, height: number)
    {
        super(scene, 0, 0);

        const fontFamily = scene.game.registry.get(GAME_FONT_FAMILY_KEY) as string | undefined;
        this.background = scene.add.rectangle(0, 0, width, height, BUTTON_COLOR).setStrokeStyle(2, BUTTON_STROKE);
        this.label = scene.add.text(0, 0, "End Turn",
            { fontFamily, fontSize: `${Math.round(height * 0.4)}px`, color: LABEL_COLOR }).setOrigin(0.5);

        this.add([this.background, this.label]);
        this.setSize(width, height);
        scene.add.existing(this);

        this.setInteractive({ useHandCursor: true });
        this.on("pointerover", () => this.background.setFillStyle(BUTTON_HOVER_COLOR));
        this.on("pointerout", () => this.background.setFillStyle(BUTTON_COLOR));
        this.on("pointerup", () => EventManager.emit("client:endTurn"));
    }

    resize(width: number, height: number)
    {
        this.background.setSize(width, height);
        this.label.setFontSize(Math.round(height * 0.4));
        this.setSize(width, height);
        this.setDepth(500);

        if (this.input)
            this.input.hitArea.setTo(0, 0, width, height);
    }
}
