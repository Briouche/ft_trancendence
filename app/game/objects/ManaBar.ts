import Phaser from "phaser";

const MAX_ENERGY = 7;           // Hearthstone-style mana cap
const ICON_SIZE_RATIO = 0.7;    // icon size relative to banner height
const ICON_SPACING_RATIO = 1.1; // spacing between icon centers, relative to icon size

const BANNER_LEFT_WIDTH = 7;
const BANNER_RIGHT_WIDTH = 4;
const BANNER_TOP_HEIGHT = 4;
const BANNER_BOTTOM_HEIGHT = 4;

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

        this.text = scene.add.text(x, y, "", {
            fontSize: "16px",
            color: "#fff",
            align: "center",
            stroke: "#000000",
            strokeThickness: 4
        }).setOrigin(0.5);

        this.zone = scene.add.zone(x, y, width, height);

        this.layoutIcons();
    }

    setPosition(x: number, y: number): void
    {
        this.x = x;
        this.y = y;

        this.banner.setPosition(x, y);
        this.text.setPosition(x - 170, y);
        this.zone.setPosition(x, y);

        this.layoutIcons();
    }

    resize(width: number, height: number): void
    {
        this.width = width;
        this.height = height;

        this.banner.setSize(width, height);
        this.zone.setSize(width, height);

        this.layoutIcons();
    }

    update(mana: number, maxMana: number): void
    {
        this.mana = mana;
        this.maxMana = Math.min(maxMana, MAX_ENERGY);

        this.text.setText(`${this.mana}/${this.maxMana}`);

        this.syncIconCount();
        this.layoutIcons();

        for (let i = 0; i < this.icons.length; i++)
            this.icons[i].setTexture(i < this.mana ? "fullEnergy" : "emptyEnergy");
    }

    private syncIconCount(): void
    {
        while (this.icons.length < this.maxMana)
            this.icons.push(this.scene.add.image(this.x, this.y, "emptyEnergy"));

        while (this.icons.length > this.maxMana)
            this.icons.pop()?.destroy();
    }

    private layoutIcons(): void
    {
        const count = this.icons.length;
        if (count === 0)
            return;

        const iconSize = this.height * ICON_SIZE_RATIO;
        const spacing = iconSize * ICON_SPACING_RATIO;
        const totalWidth = (count - 1) * spacing;
        const startX = this.x - totalWidth / 2;

        for (let i = 0; i < count; i++)
        {
            const icon = this.icons[i];
            icon.setDisplaySize(iconSize, iconSize);
            icon.setPosition(startX + i * spacing, this.y);
        }
    }
}
