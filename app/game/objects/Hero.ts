import Phaser from "phaser";

const DEFAULT_SIZE = 90;
const MAX_HEALTH_COLOR = "#000000";
const HEALTH_COLOR = "#760b0b";
const PORTRAIT_COLOR = 0x3a2b2b;
const STROKE_COLOR = 0xff5555;

export interface HeroData
{
    name: string;
    health: number;
    maxHealth?: number;
}

export class Hero extends Phaser.GameObjects.Container
{
    public heroData: HeroData;
    private healthText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, heroData: HeroData, size: number = DEFAULT_SIZE)
    {
        super(scene, 0, 0);
        this.heroData = heroData;

        const portrait = scene.add.rectangle(0, 0, size, size, PORTRAIT_COLOR).setStrokeStyle(3, STROKE_COLOR);
        const nameText = scene.add.text(0, -size * 0.6, heroData.name,
            { fontSize: `${Math.round(size * 0.14)}px`, color: "#fff" }).setOrigin(0.5, 1);
        this.healthText = scene.add.text(0, 0, `${heroData.health}`,
            { fontSize: `${Math.round(size * 0.3)}px`, color: MAX_HEALTH_COLOR }).setOrigin(0.5);

        this.add([portrait, nameText, this.healthText]);
        this.setSize(size, size);
        scene.add.existing(this);
    }

    setHealth(health: number)
    {
        this.heroData.health = health;
        this.healthText.setText(`${health}`);
        if (this.heroData.maxHealth && health < this.heroData.maxHealth)
            this.healthText.setColor(HEALTH_COLOR);
    }
}
