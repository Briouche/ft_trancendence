import Phaser from "phaser";
import { GAME_FONT_FAMILY_KEY } from "./gameFontRegistry";

const MAX_ENERGY = 7;
const ICON_SIZE_RATIO = 0.7;
const ICON_SPACING_RATIO = 1.1;
const BANNER_PADDING_RATIO = 0.6;
const TEXT_GAP_RATIO = 0.4;

const BANNER_LEFT_WIDTH = 7;
const BANNER_RIGHT_WIDTH = 4;
const BANNER_TOP_HEIGHT = 4;
const BANNER_BOTTOM_HEIGHT = 4;

/** Mana pips on a banner, with a "mana/maxMana" label to its left. */
export class Manabar
{
    private scene: Phaser.Scene;
    private mana: number = 0;
    private maxMana: number = 0;

    private banner: Phaser.GameObjects.NineSlice;
    private icons: Phaser.GameObjects.Image[] = [];
    private text: Phaser.GameObjects.Text;
    private zone: Phaser.GameObjects.Zone;

    private x: number;
    private y: number;
    private width: number;
    private height: number;

    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number)
    {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.banner = scene.add.nineslice(
            x, y,
            "banner",
            undefined,
            width, height,
            BANNER_LEFT_WIDTH, BANNER_RIGHT_WIDTH, BANNER_TOP_HEIGHT, BANNER_BOTTOM_HEIGHT
        );

        const fontFamily = scene.game.registry.get(GAME_FONT_FAMILY_KEY) as string | undefined;
        this.text = scene.add.text(x, y, "", {
            fontFamily,
            fontSize: "20px",
            color: "#fff",
            align: "center",
            stroke: "#000000",
            strokeThickness: 4
        }).setOrigin(0.5);

        this.zone = scene.add.zone(x, y, width, height);

        this.layout();
    }

    setPosition(x: number, y: number): void
    {
        this.x = x;
        this.y = y;

        this.banner.setPosition(x, y);
        this.zone.setPosition(x, y);

        this.layout();
    }

    resize(width: number, height: number): void
    {
        this.width = width;
        this.height = height;

        this.layout();
    }

    update(mana: number, maxMana: number): void
    {
        this.mana = mana;
        this.maxMana = Math.min(maxMana, MAX_ENERGY);

        this.text.setText(`${this.mana}/${this.maxMana}`);

        this.syncIconCount();

        for (let i = 0; i < this.icons.length; i++)
            this.icons[i].setTexture(i < this.mana ? "fullEnergy" : "emptyEnergy");

        this.layout();
    }

    private syncIconCount(): void
    {
        while (this.icons.length < this.maxMana)
            this.icons.push(this.scene.add.image(this.x, this.y, "emptyEnergy"));

        while (this.icons.length > this.maxMana)
            this.icons.pop()?.destroy();
    }

    // The banner widens beyond `width` when the pip row needs more room.
    private layout(): void
    {
        const count = this.icons.length;
        const iconSize = this.height * ICON_SIZE_RATIO;
        const spacing = iconSize * ICON_SPACING_RATIO;
        const pipsWidth = count > 0 ? (count - 1) * spacing + iconSize + iconSize * BANNER_PADDING_RATIO : 0;
        const effectiveWidth = Math.max(this.width, pipsWidth);

        this.banner.setSize(effectiveWidth, this.height);
        this.zone.setSize(effectiveWidth, this.height);

        const totalWidth = (count - 1) * spacing;
        const startX = this.x - totalWidth / 2;
        for (let i = 0; i < count; i++)
        {
            const icon = this.icons[i];
            icon.setDisplaySize(iconSize, iconSize);
            icon.setPosition(startX + i * spacing, this.y);
        }

        this.text.setPosition(this.x - effectiveWidth / 2 - this.height * TEXT_GAP_RATIO - this.text.width / 2, this.y);
    }
}
