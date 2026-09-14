import Phaser from "phaser";
import { GAME_FONT_FAMILY_KEY } from "./gameFontRegistry";

const OVERLAY_DEPTH = 4000; // above GameOverOverlay (3000) — a dropped connection outranks everything
const DIM_COLOR = 0x000000;
const DIM_ALPHA = 0.6;

// Shown while the game server connection is down (crashed/restarting) so the screen reads as
// "reconnecting" instead of indistinguishable from a genuine freeze — see GameScene's
// client:connectError / client:disconnected / client:connected handlers.
export class ReconnectingOverlay extends Phaser.GameObjects.Container
{
    private dim: Phaser.GameObjects.Rectangle;
    private message: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene)
    {
        super(scene, 0, 0);

        const { width, height } = scene.scale;
        const fontFamily = scene.game.registry.get(GAME_FONT_FAMILY_KEY) as string | undefined;

        this.dim = scene.add.rectangle(width / 2, height / 2, width, height, DIM_COLOR, DIM_ALPHA);
        this.message = scene.add.text(width / 2, height / 2, "Connexion perdue, reconnexion en cours...",
            { fontFamily, fontSize: "40px", color: "#ffffff", stroke: "#000000", strokeThickness: 4, align: "center" }).setOrigin(0.5);

        this.add([this.dim, this.message]);
        this.setDepth(OVERLAY_DEPTH);
        scene.add.existing(this);

        scene.scale.on("resize", this.resize, this);
        scene.events.once(Phaser.Scenes.Events.DESTROY, () => scene.scale.off("resize", this.resize, this));
    }

    private resize(gameSize: Phaser.Structs.Size): void
    {
        const { width, height } = gameSize;
        this.dim.setPosition(width / 2, height / 2).setSize(width, height);
        this.message.setPosition(width / 2, height / 2);
    }
}
