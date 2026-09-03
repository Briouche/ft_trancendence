import Phaser from "phaser";
import { clientEffect } from "../../shared/protocol";
import { ensureCardArt, resolveCardFrameKey, resolveInitialCardArt } from "./CardAssetLoader";
import { boxCenterOffset, layoutBoxImage, layoutBoxText, maximizeTextToBox, maximizeWrappedTextToBox } from "./cardTextLayout";
import { GAME_FONT_FAMILY_KEY } from "./../gameFontRegistry";
import {
    CARD_ART_BOX, CARD_ATTACK_BOX, CARD_COST_BOX, CARD_COST_BOX_SPELL, CARD_DESC_BOX, CARD_DESC_BOX_SPELL,
    CARD_HEALTH_BOX, CARD_NAME_BOX, CARD_NAME_BOX_SPELL, isSpellRarity,
} from "@/lib/cardLayout";

const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 168;

const BUFFED_STAT_COLOR = "#09d84e";
const MAX_STAT_COLOR = "#fbfbfb";
const STAT_COLOR = "#eb0a0a";

// Plafond de la police de la description, relatif à la hauteur de sa case — sans lui, un texte
// très court (ex: un seul mot) grandirait jusqu'à remplir toute la hauteur de la case sur une
// seule ligne géante.
const DESC_MAX_FONT_RATIO = 0.225;

export interface CardData
{
    id: string;
    index?: number;
    name: string;
    assetKey: string;
    rarity: string;
    cost: number;
    attack?: number;
    health?: number;
    maxHealth?: number;
    baseAttack?: number;
    baseHealth?: number;
    canAttack?: boolean;
    description: string;
    requiresTarget: boolean;
    effects: clientEffect;
}


export function withStartingStats(data: CardData): CardData
{
    if (data.baseAttack === undefined && data.baseHealth === undefined)
        return data;
    return { ...data, attack: data.baseAttack ?? data.attack, health: data.baseHealth ?? data.health, maxHealth: data.baseHealth ?? data.maxHealth };
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
    private frame: Phaser.GameObjects.Image;
    private art: Phaser.GameObjects.Image | null = null;

    private nameText: Phaser.GameObjects.Text;
    private descText: Phaser.GameObjects.Text;
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
        this.frame = scene.add.image(0, 0, resolveCardFrameKey(cardData.rarity));
        this.frame.setDisplaySize(width, height);

        const fontFamily = scene.game.registry.get(GAME_FONT_FAMILY_KEY) as string | undefined;

        this.nameText = scene.add.text(0, 0, cardData.name, { fontFamily, color: "#020202",
                                    stroke: "#ffffff", strokeThickness: 3 }).setOrigin(0.5);
        this.descText = scene.add.text(0, 0, cardData.description, { fontFamily, color: "#020202",
                                    stroke: "#ffffff", strokeThickness: 2, align: "center" }).setOrigin(0.5);
        this.costText = scene.add.text(0, 0, `${cardData.cost}`, { fontFamily,
                                    color: "#f6f7f7", stroke: "#000000", strokeThickness: 4  }).setOrigin(0.5);
        this.add([this.frame, this.nameText, this.descText, this.costText]);

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
            this.attackText = scene.add.text(0, 0, `${cardData.attack}`,
                { fontFamily, color: "#ffffff", stroke: "#000000", strokeThickness: 4  }).setOrigin(0.5);
            this.healthText = scene.add.text(0, 0, `${cardData.health}`,
                { fontFamily, color: "#ffffff", stroke: "#000000", strokeThickness: 4  }).setOrigin(0.5);
            this.add([this.attackText, this.healthText]);
        }

        this.setSize(width, height);
        this.resize(width, height);
        scene.add.existing(this);

        this.setInteractive({ draggable: true, useHandCursor: true });

        const { key: artKey, needsAsyncLoad } = resolveInitialCardArt(scene, cardData.assetKey);
        if (artKey)
            this.setArtTexture(artKey);
        else if (needsAsyncLoad)
        {
            ensureCardArt(scene, cardData.assetKey, (key) => {
                if (this.hasValidScene())
                    this.setArtTexture(key);
            });
        }
    }

    private setArtTexture(key: string): void
    {
        if (!this.art)
        {
            this.art = this.scene.add.image(0, 0, key);
            this.addAt(this.art, this.getIndex(this.frame));
        }
        else
            this.art.setTexture(key);

        layoutBoxImage(this.art, CARD_ART_BOX, this.width, this.height);
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

        this.frame.setDisplaySize(width, height);
        this.setSize(width, height);

        if (this.art)
            layoutBoxImage(this.art, CARD_ART_BOX, width, height);

        if (this.input && this.input.hitArea)
            this.input.hitArea.setTo(0, 0, width, height);

        const isSpell = isSpellRarity(this.cardData.rarity);
        const nameBox = isSpell ? CARD_NAME_BOX_SPELL : CARD_NAME_BOX;
        const costBox = isSpell ? CARD_COST_BOX_SPELL : CARD_COST_BOX;

        const nameBoxWidthPx = (nameBox.width / 100) * width;
        const nameBoxHeightPx = (nameBox.height / 100) * height;
        const nameOffset = boxCenterOffset(nameBox, width, height);
        this.nameText.setPosition(nameOffset.x, nameOffset.y);
        this.nameText.setWordWrapWidth(nameBoxWidthPx);
        maximizeTextToBox(this.nameText, nameBoxWidthPx, nameBoxHeightPx);

        const descBox = isSpell ? CARD_DESC_BOX_SPELL : CARD_DESC_BOX;
        const descBoxWidthPx = (descBox.width / 100) * width;
        const descBoxHeightPx = (descBox.height / 100) * height;
        const descOffset = boxCenterOffset(descBox, width, height);
        this.descText.setPosition(descOffset.x, descOffset.y);
        maximizeWrappedTextToBox(this.descText, descBoxWidthPx, descBoxHeightPx, 8, Math.round(descBoxHeightPx * DESC_MAX_FONT_RATIO));

        layoutBoxText(this.costText, costBox, width, height, 0.19);

        if (this.attackText && this.healthText)
        {
            layoutBoxText(this.attackText, CARD_ATTACK_BOX, width, height, 0.2);
            layoutBoxText(this.healthText, CARD_HEALTH_BOX, width, height, 0.2);
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
        this.descText.setText(data.description);
        this.costText.setText(`${data.cost}`);

        if (data.attack && data.health)
            this.updateStats(data.health, data.attack);

        if (data.canAttack !== undefined)
            this.canAttack = data.canAttack;

        this.refreshEffectVisibility();
        this.resize(this.width, this.height);
    }

    updateStats(health: number, attack: number)
    {
        if (this.attackText && this.healthText && this.cardData.maxHealth)
        {
            this.attackText.setText(`${attack}`);
            this.healthText.setText(`${health}`);
            layoutBoxText(this.attackText, CARD_ATTACK_BOX, this.width, this.height, 0.16);
            layoutBoxText(this.healthText, CARD_HEALTH_BOX, this.width, this.height, 0.16);
            if (attack > this.startingAttack)
                this.attackText.setColor(BUFFED_STAT_COLOR);
            else if (attack < this.startingAttack)
                this.attackText.setColor(STAT_COLOR);
            else
                this.attackText.setColor(MAX_STAT_COLOR);

            if (health < this.cardData.maxHealth)
                this.healthText.setColor(STAT_COLOR);
            else if (health > this.startingHealth)
                this.healthText.setColor(BUFFED_STAT_COLOR);
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

        const glowWidth = width;
        const glowHeight = height;
        this.attackGlow.clear();
        this.attackGlow.lineStyle(6, 0x00ff88, 0.25);
        this.attackGlow.strokeRoundedRect(-glowWidth / 2 - 4, -glowHeight / 2 - 4, glowWidth + 8, glowHeight + 8, 8);
        this.attackGlow.lineStyle(3, 0x00ff88, 0.7);
        this.attackGlow.strokeRoundedRect(-glowWidth / 2 - 2, -glowHeight / 2 - 2, glowWidth + 4, glowHeight + 4, 8);
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
