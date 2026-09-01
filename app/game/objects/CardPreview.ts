import Phaser from "phaser";
import { Card, CardData, withStartingStats } from "./Card";
import { clientEffect } from "../shared/protocol";
import { ensureCardAsset } from "./CardAssetLoader";

const PREVIEW_DEPTH = 3200;
const PREVIEW_HEIGHT_RATIO = 1 / 2.5;
const CARD_ASPECT_RATIO = 1.4;
const LEFT_MARGIN_RATIO = 0.07;
const HOVER_DELAY_MS = 2000;
const PLAYED_DURATION_MS = 3000;

const KEYWORD_GAP_RATIO = 0.03;
const KEYWORD_ROW_HEIGHT_RATIO = 0.15;
const KEYWORD_ROW_WIDTH_RATIO = 0.6;
const KEYWORD_LIST_OFFSET_RATIO = 0.03;

const EFFECT_LABELS: Partial<Record<keyof clientEffect, string>> = {
    taunt: "Taunt: you have to attack this minion\nbefore attacking another one",
    deathrattle: "Deathrattle: triggers on death",
    startOfTurn: "Start of Turn: triggers at the start of your turn",
    endOfTurn: "End of Turn: triggers at the end of your turn",
    onAttack: "On Attack: triggers whenever this minion attacks",
    onDamage: "On Damage: triggers whenever this minion takes damage",
    battlecry: "Battlecry: triggers on play",
    rush: "Rush: when played, can attack immidiatly,\nbut can't attack heroes on it's first turn",
    archi: "Archi: play all 6 to setup the ARCHI-exodia",
};

class CardPreview extends Phaser.GameObjects.Container
{
    constructor(scene: Phaser.Scene, cardData: CardData)
    {
        super(scene, 0, 0);

        cardData = withStartingStats(cardData);
        const { height: canvasHeight } = scene.scale;
        const previewHeight = canvasHeight * PREVIEW_HEIGHT_RATIO;
        const previewWidth = previewHeight / CARD_ASPECT_RATIO;

        const initialKey = scene.textures.exists(cardData.assetKey) ? cardData.assetKey : "placeholder_card";
        const image = scene.add.image(0, 0, initialKey);
        image.setDisplaySize(previewWidth, previewHeight);
        if (initialKey !== cardData.assetKey)
        {
            ensureCardAsset(scene, cardData.assetKey, (key) =>
            {
                if (this.scene && this.active)
                    image.setTexture(key).setDisplaySize(previewWidth, previewHeight);
            });
        }

        const nameText = scene.add.text(-previewHeight * 0.05, -previewHeight * 0.4, cardData.name,
            { fontSize: `${Math.round(previewHeight * 0.05)}px`, color: "#020202", stroke: "#ffffff", strokeThickness: 3,
              wordWrap: { width: previewWidth * 0.8 } }).setOrigin(0.5, 0);
        const costText = scene.add.text(previewWidth * 0.32, -previewHeight * 0.365, `${cardData.cost}`,
            { fontSize: `${Math.round(previewHeight * 0.15)}px`, color: "#f6f7f7", stroke: "#000000", strokeThickness: 4 }).setOrigin(0.5);

        const children: Phaser.GameObjects.GameObject[] = [image, nameText, costText];

        if (cardData.attack !== undefined && cardData.health !== undefined)
        {
            const attackText = scene.add.text(-previewWidth * 0.4, previewHeight * 0.43, `${cardData.attack}`,
                { fontSize: `${Math.round(previewHeight * 0.13)}px`, color: "#ffffff", stroke: "#000000", strokeThickness: 4 }).setOrigin(0, 1);
            const healthText = scene.add.text(previewWidth * 0.4, previewHeight * 0.43, `${cardData.health}`,
                { fontSize: `${Math.round(previewHeight * 0.13)}px`, color: "#ffffff", stroke: "#000000", strokeThickness: 4 }).setOrigin(1, 1);
            children.push(attackText, healthText);
        }

        const activeKeywords = (Object.keys(EFFECT_LABELS) as (keyof clientEffect)[])
            .filter((key) => !!cardData.effects[key]);

        const rowHeight = previewHeight * KEYWORD_ROW_HEIGHT_RATIO;
        const rowWidth = previewHeight * KEYWORD_ROW_WIDTH_RATIO;
        const rowGap = previewHeight * KEYWORD_GAP_RATIO;
        const listX = previewWidth / 2 + rowWidth / 2 + previewHeight * KEYWORD_LIST_OFFSET_RATIO;
        const listTop = -((activeKeywords.length * rowHeight + (activeKeywords.length - 1) * rowGap) / 2) + rowHeight / 2;

        activeKeywords.forEach((key, i) =>
        {
            const rowY = listTop + i * (rowHeight + rowGap);
            const rect = scene.add.rectangle(listX, rowY, rowWidth, rowHeight, 0x1a1a2e, 0.85).setStrokeStyle(2, 0xffe680, 0.9);
            const label = scene.add.text(listX, rowY, EFFECT_LABELS[key]!,
                { fontSize: `${Math.round(rowHeight * 0.2)}px`, color: "#ffffff", align: "center",
                  wordWrap: { width: rowWidth * 0.85 } }).setOrigin(0.5);
            children.push(rect, label);
        });

        this.add(children);

        const x = previewWidth / 2 + canvasHeight * LEFT_MARGIN_RATIO;
        const y = canvasHeight / 2;
        this.setPosition(x, y);
        this.setDepth(PREVIEW_DEPTH);
        scene.add.existing(this);
    }
}

export function attachCardPreviewHover(card: Card): void
{
    let timer: Phaser.Time.TimerEvent | null = null;
    let preview: CardPreview | null = null;

    const clear = () =>
    {
        timer?.remove();
        timer = null;
        preview?.destroy();
        preview = null;
    };

    card.on("pointerover", () =>
    {
        timer = card.scene.time.delayedCall(HOVER_DELAY_MS, () =>
        {
            preview = new CardPreview(card.scene, card.cardData);
        });
    });
    card.on("pointerout", clear);
    card.once(Phaser.GameObjects.Events.DESTROY, clear);
}

export function showCardPreview(scene: Phaser.Scene, cardData: CardData, durationMs: number = PLAYED_DURATION_MS): void
{
    const preview = new CardPreview(scene, cardData);
    scene.time.delayedCall(durationMs, () => preview.destroy());
}
