import Phaser from "phaser";
import { Card, CardData } from "./card/Card";
import { attachCardHover } from "../animations";
import { detachCardPreviewHover } from "./card/CardPreview";

const HAND_Y_RATIO = 0.14;
const CARD_HEIGHT_RATIO = 0.26;
const CARD_ASPECT_RATIO = 1.4;
const OVERLAP_RATIO = 0.55;
const MAX_HAND_SPAN_RATIO = 0.5;
const MAX_FAN_ANGLE_DEG = 6;
const ARC_DIP_RATIO = 0.05;
const FIRST_CARD_DEPTH = 200;


export class Hand
{
    private scene: Phaser.Scene;
    private cards: Card[] = [];

    constructor(scene: Phaser.Scene)
    {
        this.scene = scene;
    }

    addCard(data: CardData): Card
    {
        const cardHeight = this.scene.scale.height * CARD_HEIGHT_RATIO;
        const cardWidth = cardHeight / CARD_ASPECT_RATIO;

        const card: Card = new Card(this.scene, data, cardWidth, cardHeight);
        card.setCardContext(false, false, true);
        attachCardHover(card);
        this.cards.push(card);
        this.layout();
        return card;
    }

    removeCard(card: Card)
    {
        let index = this.cards.indexOf(card);
        if (index !== -1)
            this.cards.splice(index, 1);
        card.destroy();
        this.layout();
    }

    containsCard(card: Card): boolean
    {
        return this.cards.includes(card);
    }

    getCards(): Card[]
    {
        return [...this.cards];
    }

    layout(widthCanvas = this.scene.scale.width, heightCanvas = this.scene.scale.height)
    {
        const amount = this.cards.length;
        if (amount === 0)
            return ;
        const cardHeight = heightCanvas * CARD_HEIGHT_RATIO;
        const cardWidth = cardHeight / CARD_ASPECT_RATIO;
        const handY = heightCanvas * (1 - HAND_Y_RATIO);
        const maxSpacing = cardWidth * OVERLAP_RATIO;
        const maxTotalWidth = heightCanvas * MAX_HAND_SPAN_RATIO;

        let spacing = 0;
        if (amount > 1)
            spacing = Math.min(maxSpacing, maxTotalWidth / (amount - 1));

        const mid = (amount - 1) / 2;

        for (let i = 0; i < this.cards.length; i++)
        {
            const card = this.cards[i];
            const offsetFromCenter = i - mid;
    
            let norm = 0;
            if (mid !== 0)
                norm = offsetFromCenter / mid;

            const x = widthCanvas / 2 + offsetFromCenter * spacing;
            const dip = Math.pow(norm, 2) * heightCanvas * ARC_DIP_RATIO;
            const y = handY + dip;
            const rotation = Phaser.Math.DegToRad(norm * MAX_FAN_ANGLE_DEG);
            const depth = FIRST_CARD_DEPTH + (this.cards.length - 1 - i);
            card.resize(cardWidth, cardHeight);
            card.setTransform(x, y, rotation, depth);
            if (!card.isDragging && !card.isHovering)
                card.returnToBase();
        }
    }

    syncHandFromState(cards: CardData[]): void
    {
        const incomingIds: Set<string> = new Set(cards.map((c) => c.id));
        const current: Card[] = this.getCards();

        for (const card of current)
        {
            if (!incomingIds.has(card.cardData.id))
                this.removeCard(card);
        }

        for (const data of cards)
        {
            const existing: Card | undefined = this.getCards().find((c) => c.cardData.id === data.id);

            if (existing)
            {
                existing.updateData(data);
                existing.setCardContext(false, false, true);
            }
            else
                this.addCard(data);
        }

        this.layout();
    }

    findCardById(id: string): Card | undefined
    {
        return (this.cards.find((card) => card.cardData.id === id));
    }

    extractCard(card: Card): void
    {
        const index = this.cards.indexOf(card);
        if (index !== -1)
            this.cards.splice(index, 1);
        this.layout();
    }

    returnCard(card: Card): void
    {
        if (!this.cards.includes(card))
            this.cards.push(card);
        card.setCardContext(false, false, true);
        detachCardPreviewHover(card);
        card.off("pointerover");
        card.off("pointerout");
        attachCardHover(card);
        this.layout();
    }
}
