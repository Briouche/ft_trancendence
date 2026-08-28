import Phaser from "phaser";

const DEFAULT_SIZE = 90;
const BUFFED_HEALTH_COLOR = "#03c844";
const MAX_HEALTH_COLOR = "#ffffff";
const HEALTH_COLOR = "#d71010";
const PORTRAIT_COLOR = 0x3a2b2b;
const STROKE_COLOR = 0xff5555;

export interface HeroData
{
    id: string;
    name: string;
    health: number;
    maxHealth?: number;
}

export class Hero extends Phaser.GameObjects.Container
{
    public heroData: HeroData;
    private portrait: Phaser.GameObjects.Rectangle;
    private nameText: Phaser.GameObjects.Text;
    private healthText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, heroData: HeroData, size: number = DEFAULT_SIZE)
    {
        super(scene, 0, 0);
        this.heroData = heroData;

        this.portrait = scene.add.rectangle(0, 0, size, size, PORTRAIT_COLOR).setStrokeStyle(3, STROKE_COLOR);
        this.nameText = scene.add.text(0, -size * 0.2, heroData.name,
            { fontSize: `${Math.round(size * 0.14)}px`, color: "#fff", stroke: "#000000", strokeThickness: 4  }).setOrigin(0.5, 1);
        this.healthText = scene.add.text(0, 0, `${heroData.health}`,
            { fontSize: `${Math.round(size * 0.3)}px`, color: MAX_HEALTH_COLOR, stroke: "#000000", strokeThickness: 4  }).setOrigin(0.5);

        this.add([this.portrait, this.nameText, this.healthText]);
        this.setSize(size, size);
        scene.add.existing(this);
    }

    resize(size: number): void
    {
        this.portrait.setSize(size, size);
        this.nameText.setPosition(0, -size * 0.5);
        this.nameText.setFontSize(`${Math.round(size * 0.14)}px`);
        this.healthText.setPosition(0, 0);
        this.healthText.setFontSize(`${Math.round(size * 0.3)}px`);
        this.setSize(size, size);
    }

    setHealth(health: number)
    {
        this.heroData.health = health;
        this.healthText.setText(`${health}`);
        if (health < 20)
            this.healthText.setColor(HEALTH_COLOR);
        else if (health > 20)
            this.healthText.setColor(BUFFED_HEALTH_COLOR);
        else
            this.healthText.setColor(MAX_HEALTH_COLOR);
    }
}
