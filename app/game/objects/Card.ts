import Phaser from "phaser";

const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 168;
const HOVER_RATIO = 0.25;

export interface CardData
{
    id: string;
    index?: number;
    name: string;
    cost: number;
    attack?: number;
    health?: number;
    canAttack?: boolean;
    requiresTarget: boolean;
}

export class Card extends Phaser.GameObjects.Container
{
    public cardData: CardData;
    public isDragging: boolean = false;
    public isHovering: boolean = false;
    private waitingTween: Phaser.Tweens.Tween | null = null;
    private object: Phaser.GameObjects.Rectangle;

    private nameText: Phaser.GameObjects.Text;
    private costText: Phaser.GameObjects.Text;
    private attackText: Phaser.GameObjects.Text | null = null;
    private healthText: Phaser.GameObjects.Text | null = null;
    public canAttack: boolean = true;

    private baseX = 0;
    private baseY = 0;
    private baseRot = 0;
    private baseDepth = 0;
    private cardHeight: number;
    private cardWidth: number;

    constructor(scene: Phaser.Scene, cardData: CardData, width: number = DEFAULT_WIDTH, height: number = DEFAULT_HEIGHT)
    {
        super(scene, 0, 0);
        this.cardData = cardData;
        this.cardWidth = width;
        this.cardHeight = height;
        this.object = scene.add.rectangle(0, 0, width, height, 0x2b2b3a).setStrokeStyle(2, 0xffffff);

        this.nameText = scene.add.text(0, -height * 0.42, cardData.name, { fontSize: `${Math.round(height * 0.08)}px`, color: "#fff", wordWrap: { width: width * 0.85 } }).setOrigin(0.5, 0);
        this.costText = scene.add.text(-width * 0.42, -height * 0.44, `${cardData.cost}`, { fontSize: `${Math.round(height * 0.12)}px`, color: "#7fd7ff" }).setOrigin(0.5);
        this.add([this.object, this.nameText, this.costText]);

        if (cardData.attack !== undefined && cardData.health !== undefined)
        {
            this.attackText = scene.add.text(-width * 0.42, height * 0.42, `${cardData.attack}`,
                { fontSize: `${Math.round(height * 0.1)}px`, color: "#ffffff" }).setOrigin(0, 1);
            this.healthText = scene.add.text(width * 0.42, height * 0.42, `${cardData.health}`,
                { fontSize: `${Math.round(height * 0.1)}px`, color: "#ffffff" }).setOrigin(1, 1);
            this.add([this.attackText, this.healthText]);
        }

        this.setSize(width, height);
        this.resize(width, height);
        scene.add.existing(this);

        this.setInteractive({ draggable: true, useHandCursor: true });
        this.startHover();
    }

    private hasValidScene(): boolean
    {
        return !!this.scene && this.active;
    }

    startHover()
    {
        this.on("pointerover", () =>
            {
                if (this.isDragging || !this.hasValidScene())
                    return;
                this.isHovering = true;
                this.scene.tweens.add({ targets: this, x: this.baseX,
                    y: this.baseY - this.cardHeight * HOVER_RATIO,
                    rotation: 0, duration: 120, ease: "Sine.Out" });
                this.setDepth(1000);
            });
        this.on("pointerout", () =>
            {
                this.isHovering = false;
                if (this.isDragging || !this.hasValidScene())
                    return;
                this.returnToBase();
            });
    }

    returnToBase(duration = 150)
    {
        if (!this.hasValidScene())
            return;

        this.scene.tweens.add({
            targets: this, x: this.baseX, y: this.baseY,
            rotation: this.baseRot, duration, ease: "Back.Out" });
        this.setDepth(this.baseDepth);
    }

    resize(width: number, height: number): void
    {
        this.cardWidth = width;
        this.cardHeight = height;

        this.object.setSize(width, height);
        this.setSize(width, height);

        if (this.input && this.input.hitArea)
            this.input.hitArea.setTo(0, 0, width, height);

        this.nameText.setPosition(0, -height * 0.42);
        this.nameText.setFontSize(`${Math.round(height * 0.08)}px`);
        this.nameText.setWordWrapWidth(width * 0.85);

        this.costText.setPosition(-width * 0.42, -height * 0.44);
        this.costText.setFontSize(`${Math.round(height * 0.12)}px`);

        if (this.attackText && this.healthText)
        {
            this.attackText.setPosition(-width * 0.42, height * 0.42);
            this.attackText.setFontSize(`${Math.round(height * 0.1)}px`);
            this.healthText.setPosition(width * 0.42, height * 0.42);
            this.healthText.setFontSize(`${Math.round(height * 0.1)}px`);
        }
    }

    setTransform(x: number, y: number, rotation: number, depth: number)
    {
        this.baseDepth = depth;
        this.baseRot = rotation;
        this.baseX = x;
        this.baseY = y;
    }

    updateData(data: CardData): void
    {
        this.cardData = data;

        this.nameText.setText(data.name);
        this.costText.setText(`${data.cost}`);

        if (data.attack !== undefined && this.attackText)
            this.attackText.setText(`${data.attack}`);

        if (data.health !== undefined && this.healthText)
            this.healthText.setText(`${data.health}`);

        if (data.canAttack !== undefined)
            this.canAttack = data.canAttack;
    }

    setWaiting(active: boolean): void
    {
        if (!this.hasValidScene())
            return;

        if (active)
        {
            if (this.waitingTween)
                return;
            this.waitingTween = this.scene.tweens.add({
                targets: this,
                y: this.baseY - this.cardHeight * 0.08,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: "Sine.InOut" });
        }
        else
        {
            this.waitingTween?.stop();
            this.waitingTween = null;
            this.y = this.baseY;
        }
    }
}
