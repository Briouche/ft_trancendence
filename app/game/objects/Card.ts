import Phaser from "phaser";

const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 168;
const HOVER_RATIO = 0.25;

export interface CardData
{
    index: number;
    name: string;
    cost: number;
    attack?: number;
    health?: number;
}

export class Card extends Phaser.GameObjects.Container
{
    public cardData: CardData;
    public isDragging: boolean = false;
    public isHovering: boolean = false;
    public canAttack: boolean = true;
    private object: Phaser.GameObjects.Rectangle;

    private baseX = 0;
    private baseY = 0;
    private baseRot = 0;
    private baseDepth = 0;
    private cardHeight: number;

    constructor(scene: Phaser.Scene, cardData: CardData, width: number = DEFAULT_WIDTH, height: number = DEFAULT_HEIGHT)
    {
        super(scene, 0, 0);
        this.cardData = cardData;
        this.cardHeight = height;
        this.object = scene.add.rectangle(0, 0, width, height, 0x2b2b3a).setStrokeStyle(2, 0xffffff);

        const name = scene.add.text(0, -height * 0.42, cardData.name, { fontSize: `${Math.round(height * 0.08)}px`, color: "#fff", wordWrap: { width: width * 0.85 } }).setOrigin(0.5, 0);
        const cost = scene.add.text(-width * 0.42, -height * 0.44, `${cardData.cost}`, { fontSize: `${Math.round(height * 0.12)}px`, color: "#7fd7ff" }).setOrigin(0.5);
        this.add([this.object, name, cost]);

        if (cardData.attack !== undefined && cardData.health !== undefined) 
        {
            const attackText = scene.add.text(-width * 0.42, height * 0.42, `${cardData.attack}`,
                { fontSize: `${Math.round(height * 0.1)}px`, color: "#ffffff",}).setOrigin(0, 1);
            const healthText = scene.add.text(width * 0.42, height * 0.42, `${cardData.health}`,
                { fontSize: `${Math.round(height * 0.1)}px`, color: "#ffffff" }).setOrigin(1, 1);
            this.add([attackText, healthText]);
        }

        this.setSize(width, height);
        scene.add.existing(this);

        this.setInteractive({ draggable: true, useHandCursor: true });
        this.startHover();
    }

    startHover()
    {
        this.on("pointerover", () =>
            {
                if (this.isDragging)
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
                if (this.isDragging)
                    return;
                this.returnToBase();
            });
    }

    returnToBase(duration = 150)
    {
        this.scene.tweens.add({
            targets: this, x: this.baseX, y: this.baseY,
            rotation: this.baseRot, duration, ease: "Back.Out" });
        this.setDepth(this.baseDepth);
    }

    setTransform(x: number, y: number, rotation: number, depth: number)
    {
        this.baseDepth = depth;
        this.baseRot = rotation;
        this.baseX = x;
        this.baseY = y;
    }
}
