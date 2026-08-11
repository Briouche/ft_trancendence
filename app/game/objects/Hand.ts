import Phaser from "phaser";
import { Card, CardData } from "../objects/Card";

const HAND_Y_RATIO = 1 / 8;
const CARD_WIDTH_RATIO = 0.085;
const CARD_ASPECT_RATIO = 1.4;
const OVERLAP_RATIO = 0.55;
const MAX_HAND_WIDTH_RATIO = 0.9;
const MAX_FAN_ANGLE_DEG = 6;
const ARC_DIP_RATIO = 0.05;


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
        const cardWidth = this.scene.scale.width * CARD_WIDTH_RATIO;
        const cardHeight = cardWidth * CARD_ASPECT_RATIO;

        const card: Card = new Card(this.scene, data, cardWidth, cardHeight);
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
        const cardWidth = widthCanvas * CARD_WIDTH_RATIO;
        const handY = heightCanvas * (1 - HAND_Y_RATIO);
        const maxSpacing = cardWidth * OVERLAP_RATIO;
        const maxTotalWidth = widthCanvas * MAX_HAND_WIDTH_RATIO;

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
            card.setTransform(x, y, rotation, i);
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
                existing.updateData(data);
            else
                this.addCard(data);
        }

        this.layout();
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
        this.layout();
    }
}
