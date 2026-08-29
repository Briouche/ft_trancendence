import Phaser from "phaser";
import { Card, CardData } from "../Card";
import { attachCardPreviewHover } from "../CardPreview";
import { computeXs } from "./BoardMath";

const CARD_ASPECT_RATIO = 1.4;

//handles both player's minion row, collection of useful methods
export class CardRow
{
    private cards: Card[] = [];

    constructor(private scene: Phaser.Scene, private side: 0 | 1, private maxSlots: number)
    {}

    get all(): Card[]
    {
        return this.cards;
    }

    contains(card: Card): boolean
    {
        return this.cards.includes(card);
    }

    findById(id: string): Card | undefined
    {
        return this.cards.find((c) => c.cardData.id === id);
    }

    findInsertIndex(dropX: number, height: number, centerX: number, slotSizeRatio: number): number | undefined
    {
        if (this.cards.length >= this.maxSlots)
            return undefined;

        const xs = computeXs(this.cards.length, height, centerX, slotSizeRatio);
        for (let i = 0; i < xs.length; i++)
        {
            if (dropX < xs[i])
                return i;
        }
        return this.cards.length;
    }

    insert(card: Card, index: number, isMyTurn: boolean): void
    {
        this.cards.splice(index, 0, card);
        card.setCardContext(true, isMyTurn, this.side === 0);
        this.applyInteractivity(card);
    }

    remove(card: Card): boolean
    {
        const index = this.cards.indexOf(card);
        if (index === -1)
            return false;
        this.cards.splice(index, 1);
        return true;
    }

    sync(dataList: CardData[], isMyTurn: boolean): void
    {
        const remaining = [...this.cards];
        const next: Card[] = [];

        for (const data of dataList)
        {
            const existingIndex = remaining.findIndex((c) => c.cardData.id === data.id);
            if (existingIndex !== -1)
            {
                const card = remaining[existingIndex];
                card.updateData(data);
                card.setCardContext(true, isMyTurn, this.side === 0);
                next.push(card);
                remaining.splice(existingIndex, 1);
            }
            else
            {
                const card = new Card(this.scene, data);
                card.setCardContext(true, isMyTurn, this.side === 0);
                this.applyInteractivity(card);
                next.push(card);
            }
        }

        remaining.forEach((c) => c.destroy());
        this.cards = next;
    }

    layout(y: number, width: number, height: number, cardHeightRatio: number): void
    {
        const xs = computeXs(this.cards.length, height, width / 2, cardHeightRatio);
        const slotSize = height * cardHeightRatio;

        for (let i = 0; i < this.cards.length; i++)
        {
            const card = this.cards[i];
            card.resize(slotSize, slotSize * CARD_ASPECT_RATIO);
            card.setTransform(xs[i], y, 0, i);
            if (!card.isDragging)
                card.returnToBase();
        }
    }

    private applyInteractivity(card: Card): void
    {
        if (this.side === 1)
            card.setInteractive(); // hover only — attack/target still goes through Target.ts's own zones, not the card object
        else
            card.setInteractive({ draggable: true, useHandCursor: true });
        attachCardPreviewHover(card);
    }
}
