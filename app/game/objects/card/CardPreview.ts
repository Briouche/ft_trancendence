import Phaser from "phaser";
import { Card, CardData, withStartingStats } from "./Card";
import { clientEffect } from "../../shared/protocol";
import { ensureCardArt, resolveCardFrameKey, resolveInitialCardArt } from "./CardAssetLoader";
import {
    boxCenterOffset, layoutBoxImage, layoutBoxText, maximizeTextToBox, maximizeWrappedTextToBox,
    GAME_ATTACK_BOX, GAME_COST_BOX, GAME_COST_BOX_SPELL, GAME_HEALTH_BOX,
} from "./cardTextLayout";
import { GAME_FONT_FAMILY_KEY } from "./../gameFontRegistry";
import {
    CARD_ART_BOX, CARD_DESC_BOX, CARD_DESC_BOX_SPELL, CARD_NAME_BOX, CARD_NAME_BOX_SPELL, isSpellRarity,
} from "@/lib/cardLayout";

// A large, readable rendition of one card, shown either on hover (attachCardPreviewHover, e.g.
// over small board/hand cards) or briefly when a card is played (showCardPreview). Also lists the
// card's active keyword effects (taunt, rush, etc.) as an explanatory sidebar.

const PREVIEW_DEPTH = 3200;
const PREVIEW_HEIGHT_RATIO = 1 / 2.5;
const CARD_ASPECT_RATIO = 1.4;
const LEFT_MARGIN_RATIO = 0.07;
const HOVER_DELAY_MS = 2000;
const PLAYED_DURATION_MS = 3000;

// Ceiling on the description's font size, relative to its box height — see Card.ts.
const DESC_MAX_FONT_RATIO = 0.225;

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

        const frame = scene.add.image(0, 0, resolveCardFrameKey(cardData.rarity));
        frame.setDisplaySize(previewWidth, previewHeight);

        const fontFamily = scene.game.registry.get(GAME_FONT_FAMILY_KEY) as string | undefined;
        const isSpell = isSpellRarity(cardData.rarity);
        const nameBox = isSpell ? CARD_NAME_BOX_SPELL : CARD_NAME_BOX;
        const costBox = isSpell ? GAME_COST_BOX_SPELL : GAME_COST_BOX;

        const nameText = scene.add.text(0, 0, cardData.name,
            { fontFamily, color: "#020202", stroke: "#ffffff", strokeThickness: 3 }).setOrigin(0.5);
        const nameOffset = boxCenterOffset(nameBox, previewWidth, previewHeight);
        const nameBoxWidthPx = (nameBox.width / 100) * previewWidth;
        const nameBoxHeightPx = (nameBox.height / 100) * previewHeight;
        nameText.setPosition(nameOffset.x, nameOffset.y);
        nameText.setWordWrapWidth(nameBoxWidthPx);
        maximizeTextToBox(nameText, nameBoxWidthPx, nameBoxHeightPx);

        const descBox = isSpell ? CARD_DESC_BOX_SPELL : CARD_DESC_BOX;
        const descText = scene.add.text(0, 0, cardData.description,
            { fontFamily, color: "#020202", stroke: "#ffffff", strokeThickness: 2, align: "center" }).setOrigin(0.5);
        const descOffset = boxCenterOffset(descBox, previewWidth, previewHeight);
        const descBoxWidthPx = (descBox.width / 100) * previewWidth;
        const descBoxHeightPx = (descBox.height / 100) * previewHeight;
        descText.setPosition(descOffset.x, descOffset.y);
        maximizeWrappedTextToBox(descText, descBoxWidthPx, descBoxHeightPx, 8, Math.round(descBoxHeightPx * DESC_MAX_FONT_RATIO));

        const costText = scene.add.text(0, 0, `${cardData.cost}`,
            { fontFamily, color: "#f6f7f7", stroke: "#000000", strokeThickness: 4 }).setOrigin(0.5);
        layoutBoxText(costText, costBox, previewWidth, previewHeight, 0.23);

        const children: Phaser.GameObjects.GameObject[] = [frame, nameText, descText, costText];

        if (cardData.attack !== undefined && cardData.health !== undefined)
        {
            const attackText = scene.add.text(0, 0, `${cardData.attack}`,
                { fontFamily, color: "#ffffff", stroke: "#000000", strokeThickness: 4 }).setOrigin(0.5);
            layoutBoxText(attackText, GAME_ATTACK_BOX, previewWidth, previewHeight, 0.20);

            const healthText = scene.add.text(0, 0, `${cardData.health}`,
                { fontFamily, color: "#ffffff", stroke: "#000000", strokeThickness: 4 }).setOrigin(0.5);
            layoutBoxText(healthText, GAME_HEALTH_BOX, previewWidth, previewHeight, 0.20);

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
                { fontFamily, fontSize: `${Math.round(rowHeight * 0.3)}px`, color: "#ffffff", align: "center",
                  wordWrap: { width: rowWidth * 0.85 } }).setOrigin(0.5);
            children.push(rect, label);
        });

        this.add(children);

        let art: Phaser.GameObjects.Image | null = null;
        const setArt = (key: string) =>
        {
            if (!art)
            {
                art = scene.add.image(0, 0, key);
                this.addAt(art, this.getIndex(frame));
            }
            else
                art.setTexture(key);

            layoutBoxImage(art, CARD_ART_BOX, previewWidth, previewHeight);
        };

        const { key: artKey, needsAsyncLoad } = resolveInitialCardArt(scene, cardData.assetKey);
        if (artKey)
            setArt(artKey);
        else if (needsAsyncLoad)
        {
            ensureCardArt(scene, cardData.assetKey, (key) =>
            {
                if (this.scene && this.active)
                    setArt(key);
            });
        }

        const x = previewWidth / 2 + canvasHeight * LEFT_MARGIN_RATIO;
        const y = canvasHeight / 2;
        this.setPosition(x, y);
        this.setDepth(PREVIEW_DEPTH);
        scene.add.existing(this);
    }
}

const previewCleanups = new WeakMap<Card, () => void>();

export function attachCardPreviewHover(card: Card): void
{
    detachCardPreviewHover(card);

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

    previewCleanups.set(card, clear);
}

// Must be called before stripping/replacing a card's listeners (e.g. moving it
// between hand and board) so a pending delayed preview can't fire after the
// hover that requested it has already been torn down — that preview would
// then have no pointerout/destroy handler left to clear it.
export function detachCardPreviewHover(card: Card): void
{
    const clear = previewCleanups.get(card);
    if (clear)
    {
        clear();
        previewCleanups.delete(card);
    }
}

export function showCardPreview(scene: Phaser.Scene, cardData: CardData, durationMs: number = PLAYED_DURATION_MS): void
{
    const preview = new CardPreview(scene, cardData);
    scene.time.delayedCall(durationMs, () => preview.destroy());
}
