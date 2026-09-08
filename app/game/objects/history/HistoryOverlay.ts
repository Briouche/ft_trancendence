import Phaser from "phaser";
import { GAME_FONT_FAMILY_KEY } from "../gameFontRegistry";
import { MatchHistory } from "./MatchHistory";
import { createHistoryIcon } from "./historyIcons";

const OVERLAY_DEPTH = 2500; // above turnBanner (2000)/EndTurn (500), below GameOverOverlay (3000)
const DIM_COLOR = 0x000000;
const DIM_ALPHA = 0.75;
const PANEL_WIDTH_RATIO = 0.5;
const PANEL_HEIGHT_RATIO = 0.7;
const HEADLINE_ROW_HEIGHT_RATIO = 0.065;
const DETAIL_ROW_HEIGHT_RATIO = 0.045;
const ICON_SIZE_RATIO = 0.045;
const SCROLL_SPEED = 0.5;

// Full readable match log, opened by clicking the HistoryStrip. Mirrors GameOverOverlay's
// container/dim/resize/depth pattern, but renders a scrollable list of grouped entries instead of
// a single centered message — hand-built scrolling since no UI plugin exists in this codebase.
export class HistoryOverlay extends Phaser.GameObjects.Container
{
    private dim: Phaser.GameObjects.Rectangle;
    private panelBg: Phaser.GameObjects.Rectangle;
    private titleText: Phaser.GameObjects.Text;
    private closeText: Phaser.GameObjects.Text;
    private listContainer: Phaser.GameObjects.Container;
    private maskShape: Phaser.GameObjects.Graphics;

    private history: MatchHistory;
    private fontFamily: string | undefined;

    private panelX = 0;
    private panelY = 0;
    private panelWidth = 0;
    private panelHeight = 0;
    private scrollY = 0;
    private maxScroll = 0;

    constructor(scene: Phaser.Scene, history: MatchHistory)
    {
        super(scene, 0, 0);
        this.history = history;
        this.fontFamily = scene.game.registry.get(GAME_FONT_FAMILY_KEY) as string | undefined;

        const { width, height } = scene.scale;

        this.dim = scene.add.rectangle(width / 2, height / 2, width, height, DIM_COLOR, DIM_ALPHA);
        this.dim.setInteractive();
        this.dim.on("pointerup", () => this.hide());

        this.panelBg = scene.add.rectangle(0, 0, 0, 0, 0x1a1a1a, 0.95).setStrokeStyle(2, 0xffe680);

        this.titleText = scene.add.text(0, 0, "MATCH HISTORY", { fontFamily: this.fontFamily, fontSize: "30px", color: "#ffe680", fontStyle: "bold" }).setOrigin(0.5, 0);
        this.closeText = scene.add.text(0, 0, "✕", { fontFamily: this.fontFamily, fontSize: "30px", color: "#ffffff" }).setOrigin(1, 0);
        this.closeText.setInteractive({ useHandCursor: true });
        this.closeText.on("pointerup", () => this.hide());

        this.listContainer = scene.add.container(0, 0);
        this.maskShape = scene.add.graphics().setVisible(false);
        this.listContainer.setMask(this.maskShape.createGeometryMask());

        this.add([this.dim, this.panelBg, this.titleText, this.closeText, this.listContainer]);
        this.setDepth(OVERLAY_DEPTH);
        scene.add.existing(this);

        this.layoutFrame();
        this.setVisible(false);

        scene.scale.on("resize", this.onResize, this);
        scene.input.on("wheel", this.onWheel, this);
        scene.events.once(Phaser.Scenes.Events.DESTROY, () =>
        {
            scene.scale.off("resize", this.onResize, this);
            scene.input.off("wheel", this.onWheel, this);
        });
    }

    show(): void
    {
        this.scrollY = 0; // always open scrolled to the newest entry, at the top
        this.rebuildRows();
        this.setVisible(true);
    }

    hide(): void
    {
        this.setVisible(false);
    }

    private onResize(gameSize: Phaser.Structs.Size): void
    {
        this.layoutFrame(gameSize.width, gameSize.height);
        if (this.visible)
            this.rebuildRows();
    }

    private onWheel(pointer: Phaser.Input.Pointer, _objects: unknown, _dx: number, dy: number): void
    {
        if (!this.visible)
            return;
        this.applyScroll(dy * SCROLL_SPEED);
    }

    private layoutFrame(width: number = this.scene.scale.width, height: number = this.scene.scale.height): void
    {
        this.panelWidth = width * PANEL_WIDTH_RATIO;
        this.panelHeight = height * PANEL_HEIGHT_RATIO;
        this.panelX = width / 2 - this.panelWidth / 2;
        this.panelY = height / 2 - this.panelHeight / 2;

        this.dim.setPosition(width / 2, height / 2).setSize(width, height);
        if (this.dim.input) this.dim.input.hitArea.setTo(0, 0, width, height);

        this.panelBg.setPosition(width / 2, height / 2).setSize(this.panelWidth, this.panelHeight);
        this.titleText.setPosition(width / 2, this.panelY + height * 0.02);
        this.closeText.setPosition(this.panelX + this.panelWidth - height * 0.02, this.panelY + height * 0.02);

        this.maskShape.clear();
        this.maskShape.fillStyle(0xffffff, 1);
        this.maskShape.fillRect(this.panelX, this.panelY + height * 0.08, this.panelWidth, this.panelHeight - height * 0.1);

        this.listContainer.setPosition(this.panelX + this.panelWidth * 0.04, this.panelY + height * 0.08 - this.scrollY);
    }

    private rebuildRows(): void
    {
        this.listContainer.removeAll(true);

        const { height } = this.scene.scale;
        const headlineRowHeight = height * HEADLINE_ROW_HEIGHT_RATIO;
        const detailRowHeight = height * DETAIL_ROW_HEIGHT_RATIO;
        const iconSize = height * ICON_SIZE_RATIO;
        const rowWidth = this.panelWidth * 0.92;

        const newestFirst = [...this.history.getAll()].reverse();

        let cursorY = 0;
        for (const entry of newestFirst)
        {
            const icon = createHistoryIcon(this.scene, entry.icon, iconSize / 2, cursorY + headlineRowHeight / 2, iconSize);
            const headline = this.scene.add.text(iconSize * 1.4, cursorY + headlineRowHeight / 2, entry.headline,
                { fontFamily: this.fontFamily, fontSize: "26px", color: "#ffffff", wordWrap: { width: rowWidth - iconSize * 1.4 } }).setOrigin(0, 0.5);
            this.listContainer.add([icon, headline]);
            cursorY += headlineRowHeight;

            for (const detail of entry.details)
            {
                const detailText = this.scene.add.text(iconSize * 1.4 + 24, cursorY + detailRowHeight / 2, `– ${detail}`,
                    { fontFamily: this.fontFamily, fontSize: "19px", color: "#b0b0b0", wordWrap: { width: rowWidth - iconSize * 1.4 - 24 } }).setOrigin(0, 0.5);
                this.listContainer.add(detailText);
                cursorY += detailRowHeight;
            }
        }

        const visibleHeight = this.panelHeight - height * 0.1;
        this.maxScroll = Math.max(0, cursorY - visibleHeight);
        this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScroll);
        this.listContainer.setPosition(this.panelX + this.panelWidth * 0.04, this.panelY + height * 0.08 - this.scrollY);
    }

    private applyScroll(delta: number): void
    {
        this.scrollY = Phaser.Math.Clamp(this.scrollY + delta, 0, this.maxScroll);
        this.listContainer.y = this.panelY + this.scene.scale.height * 0.08 - this.scrollY;
    }
}
