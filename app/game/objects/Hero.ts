import Phaser from "phaser";

const DEFAULT_SIZE = 90;
const BUFFED_HEALTH_COLOR = "#03c844";
const MAX_HEALTH_COLOR = "#ffffff";
const HEALTH_COLOR = "#d71010";
const PORTRAIT_COLOR = 0x3a2b2b;
const STROKE_COLOR = 0xff5555;

const COUNTER_COLOR = 0x2b2b3a;
const COUNTER_STROKE_COLOR = 0x55aaff;
const COUNTER_GAP = 6;
const HOVER_DELAY_MS = 2000;
const TOOLTIP_PADDING = 6;

const COUNTER_INFO: Record<"freddy" | "archi", { divisor: number; description: string }> = {
    freddy: { divisor: 4, description: "Every 4 minions that die,\nfreddy summons a 1/1 skeleton." },
    archi: { divisor: 6, description: "Once you have played all 6 bocal cards,\nplay Archimede to win the game." },
};

export interface HeroData
{
    id: string;
    name: string;
    health: number;
    maxHealth?: number;
    archi?: number;
    freddy?: number;
}

export class Hero extends Phaser.GameObjects.Container
{
    public heroData: HeroData;
    private portrait: Phaser.GameObjects.Rectangle;
    private nameText: Phaser.GameObjects.Text;
    private healthText: Phaser.GameObjects.Text;
    private size: number;

    private counterType?: "freddy" | "archi";
    private counterCircle?: Phaser.GameObjects.Arc;
    private counterText?: Phaser.GameObjects.Text;
    private tooltipBg?: Phaser.GameObjects.Rectangle;
    private tooltipText?: Phaser.GameObjects.Text;
    private hoverTimer?: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene, heroData: HeroData, size: number = DEFAULT_SIZE)
    {
        super(scene, 0, 0);
        this.heroData = heroData;
        this.size = size;

        this.portrait = scene.add.rectangle(0, 0, size, size, PORTRAIT_COLOR).setStrokeStyle(3, STROKE_COLOR);
        this.nameText = scene.add.text(0, -size * 0.2, heroData.name,
            { fontSize: `${Math.round(size * 0.14)}px`, color: "#fff", stroke: "#000000", strokeThickness: 4  }).setOrigin(0.5, 1);
        this.healthText = scene.add.text(0, 0, `${heroData.health}`,
            { fontSize: `${Math.round(size * 0.3)}px`, color: MAX_HEALTH_COLOR, stroke: "#000000", strokeThickness: 4  }).setOrigin(0.5);

        this.add([this.portrait, this.nameText, this.healthText]);
        this.setSize(size, size);
        scene.add.existing(this);

        this.updateCounter();
    }

    resize(size: number): void
    {
        this.size = size;
        this.portrait.setSize(size, size);
        this.nameText.setPosition(0, -size * 0.5);
        this.nameText.setFontSize(`${Math.round(size * 0.14)}px`);
        this.healthText.setPosition(0, 0);
        this.healthText.setFontSize(`${Math.round(size * 0.3)}px`);
        this.setSize(size, size);

        if (this.counterCircle && this.counterText)
            this.positionCounter(this.counterCircle, this.counterText);
    }

    setHeroData(heroData: HeroData)
    {
        this.heroData.archi = heroData.archi;
        if (heroData.freddy !== undefined)
            this.heroData.freddy = heroData.freddy % 4;
        this.setHealth(heroData.health);
        this.updateCounter();
    }

    private updateCounter(): void
    {
        if (!this.counterType)
        {
            if (this.heroData.freddy !== undefined)
                this.createCounter("freddy");
            else if (this.heroData.archi !== undefined)
                this.createCounter("archi");
            return;
        }

        const value = this.heroData[this.counterType];
        if (value !== undefined && this.counterText)
            this.counterText.setText(`${value}/${COUNTER_INFO[this.counterType].divisor}`);
    }

    private createCounter(type: "freddy" | "archi"): void
    {
        this.counterType = type;
        const value = this.heroData[type];
        const radius = this.size * 0.18;

        this.counterCircle = this.scene.add.circle(0, 0, radius, COUNTER_COLOR).setStrokeStyle(2, COUNTER_STROKE_COLOR);
        this.counterText = this.scene.add.text(0, 0, `${value}/${COUNTER_INFO[type].divisor}`,
            { fontSize: `${Math.round(radius * 0.9)}px`, color: "#fff", stroke: "#000000", strokeThickness: 3 }).setOrigin(0.5);

        this.add([this.counterCircle, this.counterText]);
        this.positionCounter(this.counterCircle, this.counterText);
        this.setupCounterHover(this.counterCircle, COUNTER_INFO[type].description);
    }

    private positionCounter(circle: Phaser.GameObjects.Arc, text: Phaser.GameObjects.Text): void
    {
        const x = this.size / 2 + circle.radius + COUNTER_GAP;
        circle.setPosition(x, 0);
        text.setPosition(x, 0);
    }

    private setupCounterHover(circle: Phaser.GameObjects.Arc, description: string): void
    {
        const hitArea = new Phaser.Geom.Circle(circle.radius, circle.radius, circle.radius);
        circle.setInteractive({ hitArea, hitAreaCallback: Phaser.Geom.Circle.Contains, useHandCursor: true });

        circle.on("pointerover", () =>
        {
            this.hoverTimer = this.scene.time.delayedCall(HOVER_DELAY_MS, () => this.showTooltip(circle, description));
        });
        circle.on("pointerout", () => this.hideTooltip());
    }

    private showTooltip(circle: Phaser.GameObjects.Arc, description: string): void
    {
        this.hideTooltip();

        this.tooltipText = this.scene.add.text(0, 0, description,
            { fontSize: "12px", color: "#fff" }).setOrigin(0, 0);
        const width = this.tooltipText.width + TOOLTIP_PADDING * 2;
        const height = this.tooltipText.height + TOOLTIP_PADDING * 2;
        const x = circle.x + circle.radius;
        const y = circle.y - height / 2 + COUNTER_GAP;

        this.tooltipBg = this.scene.add.rectangle(x, y, width, height, 0x000000, 0.85)
            .setStrokeStyle(1, COUNTER_STROKE_COLOR).setOrigin(0, 0);
        this.tooltipText.setPosition(x + TOOLTIP_PADDING, y + TOOLTIP_PADDING);

        this.add([this.tooltipBg, this.tooltipText]);
    }

    private hideTooltip(): void
    {
        this.hoverTimer?.remove();
        this.hoverTimer = undefined;
        this.tooltipBg?.destroy();
        this.tooltipText?.destroy();
        this.tooltipBg = undefined;
        this.tooltipText = undefined;
    }

    destroy(fromScene?: boolean): void
    {
        this.hoverTimer?.remove();
        super.destroy(fromScene);
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
