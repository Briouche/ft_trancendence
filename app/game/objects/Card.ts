import Phaser from "phaser";
import { clientEffect } from "../shared/protocol";

const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 168;
const HOVER_RATIO = 0.25;

const BUFFED_STAT_COLOR = "#09d84e";
const MAX_STAT_COLOR = "#fbfbfb";
const STAT_COLOR = "#eb0a0a";

export interface CardData
{
    id: string;
    index?: number;
    name: string;
    cost: number;
    attack?: number;
    health?: number;
    maxHealth?: number;
    canAttack?: boolean;
    requiresTarget: boolean;
    effects: clientEffect;
}

export class Card extends Phaser.GameObjects.Container
{
    public cardData: CardData;
    public startingAttack: number = 0;
    public startingHealth: number = 0;

    public isDragging: boolean = false;
    public isHovering: boolean = false;
    private hasBeenPLaced = false;
    private waitingTween: Phaser.Tweens.Tween | null = null;
    private object: Phaser.GameObjects.Rectangle;

    private nameText: Phaser.GameObjects.Text;
    private costText: Phaser.GameObjects.Text;
    private attackText: Phaser.GameObjects.Text | null = null;
    private healthText: Phaser.GameObjects.Text | null = null;

    private tauntShield: Phaser.GameObjects.Image;
    private deathrattleSkull: Phaser.GameObjects.Graphics;
    private effectBolt: Phaser.GameObjects.Image;
    private attackGlow: Phaser.GameObjects.Graphics;

    public  canAttack: boolean = false;

    private baseX = 0;
    private baseY = 0;
    private baseRot = 0;
    private baseDepth = 0;
    private cardHeight: number;

    private onBoard: boolean = false;
    private myTurn: boolean = false;
    private ownSide: boolean = true;

    constructor(scene: Phaser.Scene, cardData: CardData, width: number = DEFAULT_WIDTH, height: number = DEFAULT_HEIGHT)
    {
        super(scene, 0, 0);
        this.cardData = cardData;
        this.cardHeight = height;
        this.object = scene.add.rectangle(0, 0, width, height, 0x2b2b3a).setStrokeStyle(2, 0xffffff);
        
        this.nameText = scene.add.text(0, -height * 0.42, cardData.name, { fontSize: `${Math.round(height * 0.08)}px`, color: "#fff", 
                                    wordWrap: { width: width * 0.85 } }).setOrigin(0.5, 0);
        this.costText = scene.add.text(-width * 0.42, -height * 0.44, `${cardData.cost}`, { fontSize: `${Math.round(height * 0.12)}px`,
                                    color: "#7fd7ff", stroke: "#000000", strokeThickness: 4  }).setOrigin(0.5);
        this.add([this.object, this.nameText, this.costText]);
        
        this.attackGlow = scene.add.graphics();
        this.deathrattleSkull = scene.add.graphics();
        this.tauntShield = scene.add.image(0, 0, "shield_taunt");
        this.effectBolt = scene.add.image(0, 0, "effect_lightning");
        this.add([this.attackGlow, this.tauntShield, this.deathrattleSkull, this.effectBolt]);
        this.refreshEffectVisibility();

        if (cardData.attack !== undefined && cardData.health !== undefined)
        {
            this.startingAttack = cardData.attack;
            this.startingHealth = cardData.health;
            this.attackText = scene.add.text(-width * 0.42, height * 0.42, `${cardData.attack}`,
                { fontSize: `${Math.round(height * 0.1)}px`, color: "#ffffff", stroke: "#000000", strokeThickness: 4  }).setOrigin(0, 1);
            this.healthText = scene.add.text(width * 0.42, height * 0.42, `${cardData.health}`,
                { fontSize: `${Math.round(height * 0.1)}px`, color: "#ffffff", stroke: "#000000", strokeThickness: 4  }).setOrigin(1, 1);
            this.add([this.attackText, this.healthText]);
        }

        this.setSize(width, height);
        this.resize(width, height);
        scene.add.existing(this);

        this.setInteractive({ draggable: true, useHandCursor: true });
    }

    getBasePosition(): { x: number; y: number; rotation: number }
    {
        return { x: this.baseX, y: this.baseY, rotation: this.baseRot };
    }

    private hasValidScene(): boolean
    {
        return !!this.scene && this.active;
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

        this.drawEffects(width, height);
    }

    setTransform(x: number, y: number, rotation: number, depth: number)
    {
        this.baseDepth = depth;
        this.baseRot = rotation;
        this.baseX = x;
        this.baseY = y;

        if (!this.hasBeenPLaced)
        {
            this.hasBeenPLaced = true;
            this.x = x;
            this.y = y;
            this.rotation = rotation;
            this.setDepth(depth);
        }
    }

    updateData(data: CardData): void
    {
        this.cardData = data;

        this.nameText.setText(data.name);
        this.costText.setText(`${data.cost}`);

        if (data.attack && data.health)
            this.updateStats(data.health, data.attack);

        if (data.canAttack !== undefined)
            this.canAttack = data.canAttack;

        this.refreshEffectVisibility();
    }

    updateStats(health: number, attack: number)
    {
        if (this.attackText && this.healthText && this.cardData.maxHealth)
        {
            this.attackText.setText(`${attack}`);
            this.healthText.setText(`${health}`);
            if (attack > this.startingAttack)
                this.attackText.setColor(BUFFED_STAT_COLOR);
            else if (attack < this.startingAttack)
                this.attackText.setColor(STAT_COLOR);
            else
                this.attackText.setColor(MAX_STAT_COLOR);

            if (health > this.startingHealth)
                this.healthText.setColor(BUFFED_STAT_COLOR);
            else if (health < this.cardData.maxHealth)
                this.healthText.setColor(STAT_COLOR);
            else
                this.healthText.setColor(MAX_STAT_COLOR);
        }
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

    private drawEffects(width: number, height: number): void
    {
        const iconSize = height * 0.16;
        const iconY = height * 0.40;

        this.tauntShield.setPosition(0, iconY);
        this.tauntShield.setDisplaySize(iconSize, iconSize);

        this.effectBolt.setPosition(0, iconY);
        this.effectBolt.setDisplaySize(iconSize * 0.7, iconSize * 0.7);

        this.deathrattleSkull.clear();
        this.deathrattleSkull.setPosition(0, iconY);
        const s = iconSize * 0.8; // slightly smaller so it visibly sits "on" the shield
        this.deathrattleSkull.fillStyle(0xf5f5f0, 1);
        this.deathrattleSkull.lineStyle(1, 0x000000, 1);
        this.deathrattleSkull.fillCircle(0, -s * 0.05, s * 0.35);
        this.deathrattleSkull.strokeCircle(0, -s * 0.05, s * 0.35);
        this.deathrattleSkull.fillStyle(0x000000, 1);
        this.deathrattleSkull.fillCircle(-s * 0.13, -s * 0.05, s * 0.08);
        this.deathrattleSkull.fillCircle(s * 0.13, -s * 0.05, s * 0.08);
        this.deathrattleSkull.fillStyle(0xf5f5f0, 1);
        this.deathrattleSkull.fillRect(-s * 0.18, s * 0.15, s * 0.36, s * 0.18);

        this.attackGlow.clear();
        this.attackGlow.lineStyle(6, 0x00ff88, 0.25);
        this.attackGlow.strokeRoundedRect(-width / 2 - 4, -height / 2 - 4, width + 8, height + 8, 8);
        this.attackGlow.lineStyle(3, 0x00ff88, 0.9);
        this.attackGlow.strokeRoundedRect(-width / 2 - 2, -height / 2 - 2, width + 4, height + 4, 8);
    }

    setCardContext(onBoard: boolean, isMyTurn: boolean, isOwnSide: boolean): void
    {
        this.onBoard = onBoard;
        this.myTurn = isMyTurn;
        this.ownSide = isOwnSide;
        this.refreshEffectVisibility();
    }

    private refreshEffectVisibility(): void
    {
        this.tauntShield.setVisible(this.onBoard && !!this.cardData.effects.taunt);
        this.deathrattleSkull.setVisible(this.onBoard && !!this.cardData.effects.deathrattle);
        this.effectBolt.setVisible(this.onBoard && (!!this.cardData.effects.endOfTurn || !!this.cardData.effects.startOfTurn || !!this.cardData.effects.onAttack || !!this.cardData.effects.onDamage));
        this.attackGlow.setVisible(this.onBoard && this.ownSide && this.myTurn && !!this.cardData.canAttack);
    }

    getEffectBolt(): Phaser.GameObjects.Image
    {
        return this.effectBolt;
    }

    getDeathrattleSkull(): Phaser.GameObjects.Graphics
    {
        return this.deathrattleSkull;
    }
}
