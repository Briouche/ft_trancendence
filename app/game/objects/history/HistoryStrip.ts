import Phaser from "phaser";
import { MatchHistory } from "./MatchHistory";
import { createHistoryIcon } from "./historyIcons";

const STRIP_X_RATIO = 0.09;
const BAND_TOP_RATIO = 0.26;
const BAND_BOTTOM_RATIO = 0.74;
const SLOT_SIZE_RATIO = 0.045;
const SLOT_GAP_RATIO = 0.01;
const CAP = 6;

/** Column of the latest history icons on the left edge (newest on top); click opens the overlay. */
export class HistoryStrip
{
    private scene: Phaser.Scene;
    private history: MatchHistory;
    private onOpen: () => void;

    private slots: (Phaser.GameObjects.Image | Phaser.GameObjects.Graphics)[] = [];
    private slotBackgrounds: Phaser.GameObjects.Rectangle[] = [];
    private hitZone: Phaser.GameObjects.Zone;

    private x = 0;
    private y = 0;
    private slotSize = 0;
    private gap = 0;

    constructor(scene: Phaser.Scene, history: MatchHistory, onOpen: () => void)
    {
        this.scene = scene;
        this.history = history;
        this.onOpen = onOpen;

        this.hitZone = scene.add.zone(0, 0, 0, 0).setOrigin(0, 0);
        this.hitZone.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(0, 0, 1, 1),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true,
        });
        this.hitZone.on("pointerup", () => this.onOpen());
    }

    layout(height: number = this.scene.scale.height): void
    {
        this.x = height * STRIP_X_RATIO;
        this.slotSize = height * SLOT_SIZE_RATIO;
        this.gap = height * SLOT_GAP_RATIO;

        const bandTop = height * BAND_TOP_RATIO;
        const bandBottom = height * BAND_BOTTOM_RATIO;
        const contentHeight = CAP * this.slotSize + (CAP - 1) * this.gap;
        this.y = bandTop + Math.max(0, (bandBottom - bandTop - contentHeight) / 2) + this.slotSize / 2;

        this.hitZone.setPosition(this.x - this.slotSize / 2, bandTop);
        this.hitZone.setSize(this.slotSize, contentHeight);
        this.hitZone.input?.hitArea.setTo(0, 0, this.slotSize, contentHeight);

        this.refresh();
    }

    refresh(): void
    {
        for (const slot of this.slots) slot.destroy();
        for (const bg of this.slotBackgrounds) bg.destroy();
        this.slots = [];
        this.slotBackgrounds = [];

        const latest = this.history.getLatest(CAP);

        for (let i = 0; i < latest.length; i++)
        {
            const entry = latest[latest.length - 1 - i];
            const slotY = this.y + i * (this.slotSize + this.gap);

            const bg = this.scene.add.rectangle(this.x, slotY, this.slotSize, this.slotSize, 0xa4c6e6, 0.12)
                .setStrokeStyle(1, 0x7fa2c7);
            this.slotBackgrounds.push(bg);

            const icon = createHistoryIcon(this.scene, entry.icon, this.x, slotY, this.slotSize * 0.8);
            this.slots.push(icon);
        }
    }
}
