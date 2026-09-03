import Phaser from "phaser";
import { GAME_FONT_FAMILY_KEY } from "./gameFontRegistry";

const DEFAULT_SIZE = 90;
const BUFFED_HEALTH_COLOR = "#03c844";
const MAX_HEALTH_COLOR = "#ffffff";
const HEALTH_COLOR = "#760606";
const PORTRAIT_COLOR = 0x3a2b2b;
const STROKE_COLOR = 0xff5555;

const ZONE_WIDTH_RATIO = 1;
const ZONE_HEIGHT_RATIO = 0.8;
const ZONE_OFFSET_X_RATIO = 0;
const ZONE_OFFSET_Y_RATIO = -0.1;
const OPPONENT_ZONE_WIDTH_RATIO = 1;
const OPPONENT_ZONE_HEIGHT_RATIO = 0.8;
const OPPONENT_ZONE_OFFSET_X_RATIO = 0;
const OPPONENT_ZONE_OFFSET_Y_RATIO = 0.1;

const FRAME_SCALE = 2;
const FRAME_OFFSET_X_RATIO = 0.21;
const FRAME_OFFSET_Y_RATIO = 0.13;
const OPPONENT_FRAME_OFFSET_X_RATIO = -0.17;
const OPPONENT_FRAME_OFFSET_Y_RATIO = -0.12;

const HEALTH_TEXT_OFFSET_X_RATIO = -0.62;
const HEALTH_TEXT_OFFSET_Y_RATIO = 0.3;
const OPPONENT_HEALTH_TEXT_OFFSET_X_RATIO = 0.60;
const OPPONENT_HEALTH_TEXT_OFFSET_Y_RATIO = -0.3;
const HEALTH_TEXT_DEPTH = 10;

const COUNTER_COLOR = 0x2b2b3a;
const COUNTER_STROKE_COLOR = 0x55aaff;
const COUNTER_GLOW_COLOR = 0xffe066;
const COUNTER_GLOW_DURATION_MS = 550;
const COUNTER_GAP = 2;
const HOVER_DELAY_MS = 2000;
const TOOLTIP_PADDING = 6;

const COUNTER_INFO: Record<"freddy" | "archi" | "roiDesRats" | "gertrude", { divisor: number; description: string }> = {
    freddy: { divisor: 4, description: "Every 4 minions that die,\nfreddy summons a 1/1 skeleton." },
    archi: { divisor: 6, description: "Once you have played\nall 6 bocal memebrs,\nplay Archimede to win the game." },
    roiDesRats: { divisor: 3, description: "Every 3 end of turns,\nyour end-of-turn effects\ntrigger one extra time." },
    gertrude: { divisor: 4, description: "Every 4th spell you cast\ngoes back to your hand." },
};

export interface HeroData
{
    id: string;
    name: string;
    health: number;
    maxHealth?: number;
    archi?: number;
    freddy?: number;
    roiDesRats?: number;
    gertrude?: number;
    cardBack: number;
}

export class Hero extends Phaser.GameObjects.Container
{
    public heroData: HeroData;
    private portrait: Phaser.GameObjects.Rectangle;
    private frame: Phaser.GameObjects.Image;
    private nameText: Phaser.GameObjects.Text;
    private healthText: Phaser.GameObjects.Text;
    private size: number;
    private isOpponent: boolean;
    private fontFamily: string | undefined;

    private counterType?: "freddy" | "archi" | "roiDesRats" | "gertrude";
    private counterCircle?: Phaser.GameObjects.Arc;
    private counterText?: Phaser.GameObjects.Text;
    private tooltipBg?: Phaser.GameObjects.Rectangle;
    private tooltipText?: Phaser.GameObjects.Text;
    private hoverTimer?: Phaser.Time.TimerEvent;
    private counterRawValues: Partial<Record<"freddy" | "archi" | "roiDesRats" | "gertrude", number>> = {};
    private glowRings: Phaser.GameObjects.Arc[] = [];

    constructor(scene: Phaser.Scene, heroData: HeroData, size: number = DEFAULT_SIZE, isOpponent: boolean = false)
    {
        super(scene, 0, 0);
        this.heroData = heroData;
        this.size = size;
        this.isOpponent = isOpponent;
        this.fontFamily = scene.game.registry.get(GAME_FONT_FAMILY_KEY) as string | undefined;

        this.portrait = scene.add.rectangle(0, 0, size, size, PORTRAIT_COLOR).setStrokeStyle(3, STROKE_COLOR);
        this.nameText = scene.add.text(0, -size * 0.2, heroData.name,
            { fontFamily: this.fontFamily, fontSize: `${Math.round(size * 0.14)}px`, color: "#fff", stroke: "#000000", strokeThickness: 4  }).setOrigin(0.5, 1);
        this.healthText = scene.add.text(0, 0, `${heroData.health}`,
            { fontFamily: this.fontFamily, fontSize: `${Math.round(size * 0.34)}px`, color: MAX_HEALTH_COLOR, stroke: "#000000", strokeThickness: 4  }).setDepth(HEALTH_TEXT_DEPTH);

        const frameOffset = this.getFrameOffset(size);
        this.frame = scene.add.image(frameOffset.x, frameOffset.y, isOpponent ? "opponentHeroFrame" : "heroFrame");
        this.frame.setDisplaySize(size * FRAME_SCALE, size * FRAME_SCALE);
        this.positionHealthText(size);

        this.add([this.portrait, this.nameText, this.healthText, this.frame]);
        this.sort("depth");
        const zoneLayout = this.getZoneLayout(size);
        this.setSize(zoneLayout.width, zoneLayout.height);
        scene.add.existing(this);

        this.updateCounter();
    }

    resize(size: number): void
    {
        this.size = size;
        this.portrait.setSize(size, size);
        this.nameText.setPosition(0, -size * 0.5);
        this.nameText.setFontSize(`${Math.round(size * 0.14)}px`);
        this.healthText.setFontSize(`${Math.round(size * 0.34)}px`);
        const frameOffset = this.getFrameOffset(size);
        this.frame.setPosition(frameOffset.x, frameOffset.y);
        this.frame.setDisplaySize(size * FRAME_SCALE, size * FRAME_SCALE);
        this.positionHealthText(size);
        const zoneLayout = this.getZoneLayout(size);
        this.setSize(zoneLayout.width, zoneLayout.height);

        if (this.counterCircle && this.counterText)
            this.positionCounter(this.counterCircle, this.counterText);
    }

    private getZoneLayout(size: number): { width: number; height: number; offsetX: number; offsetY: number }
    {
        const [widthRatio, heightRatio, offsetXRatio, offsetYRatio] = this.isOpponent
            ? [OPPONENT_ZONE_WIDTH_RATIO, OPPONENT_ZONE_HEIGHT_RATIO, OPPONENT_ZONE_OFFSET_X_RATIO, OPPONENT_ZONE_OFFSET_Y_RATIO]
            : [ZONE_WIDTH_RATIO, ZONE_HEIGHT_RATIO, ZONE_OFFSET_X_RATIO, ZONE_OFFSET_Y_RATIO];
        return { width: size * widthRatio, height: size * heightRatio, offsetX: size * offsetXRatio, offsetY: size * offsetYRatio };
    }

    getZoneOffset(): { x: number; y: number }
    {
        const zoneLayout = this.getZoneLayout(this.size);
        return { x: zoneLayout.offsetX, y: zoneLayout.offsetY };
    }

    private getFrameOffset(size: number): { x: number; y: number }
    {
        const [ratioX, ratioY] = this.isOpponent
            ? [OPPONENT_FRAME_OFFSET_X_RATIO, OPPONENT_FRAME_OFFSET_Y_RATIO]
            : [FRAME_OFFSET_X_RATIO, FRAME_OFFSET_Y_RATIO];
        return { x: ratioX * size, y: ratioY * size };
    }

    private positionHealthText(size: number): void
    {
        const frameOffset = this.getFrameOffset(size);
        const halfFrame = (size * FRAME_SCALE) / 2;
        const [offsetXRatio, offsetYRatio] = this.isOpponent
            ? [OPPONENT_HEALTH_TEXT_OFFSET_X_RATIO, OPPONENT_HEALTH_TEXT_OFFSET_Y_RATIO]
            : [HEALTH_TEXT_OFFSET_X_RATIO, HEALTH_TEXT_OFFSET_Y_RATIO];
        const offsetX = offsetXRatio * size;
        const offsetY = offsetYRatio * size;

        this.healthText.setOrigin(0.5);
        if (this.isOpponent)
            this.healthText.setPosition(frameOffset.x - halfFrame + offsetX, frameOffset.y + halfFrame + offsetY);
        else
            this.healthText.setPosition(frameOffset.x + halfFrame + offsetX, frameOffset.y - halfFrame + offsetY);
    }

    setHeroData(heroData: HeroData)
    {
        this.checkCounterTrigger("freddy", heroData.freddy);
        this.checkCounterTrigger("archi", heroData.archi);
        this.checkCounterTrigger("roiDesRats", heroData.roiDesRats);
        this.checkCounterTrigger("gertrude", heroData.gertrude);

        this.heroData.archi = heroData.archi;
        if (heroData.freddy !== undefined)
            this.heroData.freddy = heroData.freddy % 4;
        if (heroData.roiDesRats !== undefined)
            this.heroData.roiDesRats = heroData.roiDesRats % 3;
        if (heroData.gertrude !== undefined)
            this.heroData.gertrude = heroData.gertrude % 4;
        this.setHealth(heroData.health);
        this.updateCounter();
    }

    private checkCounterTrigger(type: "freddy" | "archi" | "roiDesRats" | "gertrude", newValue: number | undefined): void
    {
        if (newValue === undefined)
            return;

        const oldValue = this.counterRawValues[type];
        this.counterRawValues[type] = newValue;
        if (oldValue === undefined)
            return;

        const divisor = COUNTER_INFO[type].divisor;
        if (Math.floor(newValue / divisor) > Math.floor(oldValue / divisor))
            this.playCounterGlow();
    }

    private playCounterGlow(): void
    {
        if (!this.counterCircle)
            return;

        this.scene.tweens.add({
            targets: this.counterCircle,
            scale: { from: 1, to: 1.2 },
            duration: 180,
            yoyo: true,
            ease: "Sine.easeOut"
        });

        const radius = this.counterCircle.radius;
        const ring = this.scene.add.circle(this.counterCircle.x, this.counterCircle.y, radius, COUNTER_GLOW_COLOR, 0.5)
            .setStrokeStyle(2, COUNTER_GLOW_COLOR);
        this.add(ring);
        this.sort("depth");
        this.glowRings.push(ring);

        this.scene.tweens.add({
            targets: ring,
            scale: { from: 1, to: 1.9 },
            alpha: { from: 0.55, to: 0 },
            duration: COUNTER_GLOW_DURATION_MS,
            ease: "Cubic.easeOut",
            onComplete: () =>
            {
                ring.destroy();
                this.glowRings = this.glowRings.filter(r => r !== ring);
            }
        });
    }

    private updateCounter(): void
    {
        if (!this.counterType)
        {
            if (this.heroData.freddy !== undefined)
                this.createCounter("freddy");
            else if (this.heroData.archi !== undefined)
                this.createCounter("archi");
            else if (this.heroData.roiDesRats !== undefined)
                this.createCounter("roiDesRats");
            else if (this.heroData.gertrude !== undefined)
                this.createCounter("gertrude");
            return;
        }

        const value = this.heroData[this.counterType];
        if (value !== undefined && this.counterText)
            this.counterText.setText(`${value}/${COUNTER_INFO[this.counterType].divisor}`);
    }

    private createCounter(type: "freddy" | "archi" | "roiDesRats" | "gertrude"): void
    {
        this.counterType = type;
        const value = this.heroData[type];
        const radius = this.size * 0.18;

        this.counterCircle = this.scene.add.circle(0, 0, radius, COUNTER_COLOR).setStrokeStyle(2, COUNTER_STROKE_COLOR);
        this.counterText = this.scene.add.text(0, 0, `${value}/${COUNTER_INFO[type].divisor}`,
            { fontFamily: this.fontFamily, fontSize: `${Math.round(radius * 0.9)}px`, color: "#fff", stroke: "#000000", strokeThickness: 3 }).setOrigin(0.5);

        this.add([this.counterCircle, this.counterText]);
        this.sort("depth");
        this.positionCounter(this.counterCircle, this.counterText);
        this.setupCounterHover(this.counterCircle, COUNTER_INFO[type].description);
    }

    private positionCounter(circle: Phaser.GameObjects.Arc, text: Phaser.GameObjects.Text): void
    {
        const x = this.size / 3 + circle.radius + COUNTER_GAP;
        let y = this.size / 3 + circle.radius;
        if (this.isOpponent)
            y = -y;
        circle.setPosition(x, y);
        text.setPosition(x, y);
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
            { fontFamily: this.fontFamily, fontSize: "12px", color: "#fff" }).setOrigin(0, 0);
        const width = this.tooltipText.width + TOOLTIP_PADDING * 2;
        const height = this.tooltipText.height + TOOLTIP_PADDING * 2;
        const x = circle.x + circle.radius;
        const y = circle.y - height / 2 + COUNTER_GAP;

        this.tooltipBg = this.scene.add.rectangle(x, y, width, height, 0x000000, 0.85)
            .setStrokeStyle(1, COUNTER_STROKE_COLOR).setOrigin(0, 0);
        this.tooltipText.setPosition(x + TOOLTIP_PADDING, y + TOOLTIP_PADDING);

        this.add([this.tooltipBg, this.tooltipText]);
        this.sort("depth");
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
        for (const ring of this.glowRings)
            ring.destroy();
        this.glowRings = [];
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
