import Phaser from "phaser";
import { OpponentCard } from "./OpponentCard";

const HAND_Y_RATIO = 0.12;          // distance from the TOP of the canvas
const CARD_HEIGHT_RATIO = 0.2;
const CARD_ASPECT_RATIO = 1.4;
const OVERLAP_RATIO = 0.55;
const MAX_HAND_SPAN_RATIO = 0.5;
const MAX_FAN_ANGLE_DEG = 6;
const ARC_DIP_RATIO = 0.05;

export class OpponentHand
{
    private scene: Phaser.Scene;
    private cards: OpponentCard[] = [];
    private cardBackKey: string;

    constructor(scene: Phaser.Scene, cardBack = 0)
    {
        this.scene = scene;
        this.cardBackKey = `cardBack_${cardBack}`;
    }

    setCount(count: number)
    {
        while (this.cards.length < count)
        {
            const cardHeight = this.scene.scale.height * CARD_HEIGHT_RATIO;
            const cardWidth = cardHeight / CARD_ASPECT_RATIO;
            this.cards.push(new OpponentCard(this.scene, cardWidth, cardHeight, this.cardBackKey));
        }
        while (this.cards.length > count)
            this.cards.pop()?.destroy();
        this.layout();
    }

    getCount(): number
    {
        return this.cards.length;
    }

    getObject(index: number): OpponentCard
    {
        return this.cards[index];
    }

    layout(widthCanvas = this.scene.scale.width, heightCanvas = this.scene.scale.height)
    {
        const amount = this.cards.length;
        if (amount === 0)
            return ;

        const cardHeight = heightCanvas * CARD_HEIGHT_RATIO;
        const cardWidth = cardHeight / CARD_ASPECT_RATIO;
        const handY = heightCanvas * HAND_Y_RATIO;
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
            const y = handY - dip;
            const rotation = Phaser.Math.DegToRad(-norm * MAX_FAN_ANGLE_DEG);
            card.resize(cardWidth, cardHeight);

            this.scene.tweens.add({ targets: card, x, y, rotation, duration: 150, ease: "Back.Out" });
            card.setDepth(i);
        }
    }
}
