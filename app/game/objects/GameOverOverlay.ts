import Phaser from "phaser";
import { EventManager } from "../EventManager";
import { GAME_FONT_FAMILY_KEY } from "./gameFontRegistry";

const OVERLAY_DEPTH = 3000;
const DIM_COLOR = 0x000000;
const DIM_ALPHA = 0.6;
const CLICK_DELAY_MS = 2000;
const DETAILS_OFFSET_Y = 90;
const HINT_OFFSET_Y = 160;

// Full-screen result banner; becomes clickable after a delay and then navigates home.
export class GameOverOverlay extends Phaser.GameObjects.Container
{
    private dim: Phaser.GameObjects.Rectangle;
    private message: Phaser.GameObjects.Text;
    private hint: Phaser.GameObjects.Text;
    private details: Phaser.GameObjects.Text;

    // fontSize is overridable because the default is sized for "YOU WIN!!", not for a sentence —
    // a fatal rejection reuses this overlay to explain why the match is gone.
    // details: an optional line under the result, e.g. the rewards earned ("+2 packs · Elo +16").
    constructor(scene: Phaser.Scene, text: string, color: string, options: { fontSize?: string; details?: string } = {})
    {
        super(scene, 0, 0);

        const { width, height } = scene.scale;
        const fontFamily = scene.game.registry.get(GAME_FONT_FAMILY_KEY) as string | undefined;

        this.dim = scene.add.rectangle(width / 2, height / 2, width, height, DIM_COLOR, DIM_ALPHA);
        this.message = scene.add.text(width / 2, height / 2, text,
            { fontFamily, fontSize: options.fontSize ?? "128px", color, fontStyle: "bold", stroke: "#000000", strokeThickness: 6 }).setOrigin(0.5);
        this.details = scene.add.text(width / 2, height / 2 + DETAILS_OFFSET_Y, options.details ?? "",
            { fontFamily, fontSize: "44px", color: "#f3d27a", stroke: "#000000", strokeThickness: 4 }).setOrigin(0.5);
        this.hint = scene.add.text(width / 2, height / 2 + HINT_OFFSET_Y, "Click anywhere to continue",
            { fontFamily, fontSize: "40px", color: "#ffffff", stroke: "#000000", strokeThickness: 3 }).setOrigin(0.5);

        this.add([this.dim, this.message, this.details, this.hint]);
        this.setDepth(OVERLAY_DEPTH);
        scene.add.existing(this);

        scene.time.delayedCall(CLICK_DELAY_MS, () =>
        {
            this.setInteractive(
                new Phaser.Geom.Rectangle(0, 0, width, height),
                Phaser.Geom.Rectangle.Contains
            );
            this.input!.cursor = "pointer";
            this.on("pointerup", () => EventManager.emit("phaser:navigateHome"));
        });

        scene.scale.on("resize", this.resize, this);
        scene.events.once(Phaser.Scenes.Events.DESTROY, () => scene.scale.off("resize", this.resize, this));
    }

    private resize(gameSize: Phaser.Structs.Size): void
    {
        const { width, height } = gameSize;
        this.dim.setPosition(width / 2, height / 2).setSize(width, height);
        this.message.setPosition(width / 2, height / 2);
        this.details.setPosition(width / 2, height / 2 + DETAILS_OFFSET_Y);
        this.hint.setPosition(width / 2, height / 2 + HINT_OFFSET_Y);
        if (this.input) this.input.hitArea.setTo(0, 0, width, height);
    }
}
