import Phaser from "phaser";
import { OpponentCard } from "./OpponentCard";

const HAND_Y_RATIO = 1 / 8;          // distance from the TOP of the canvas
const CARD_WIDTH_RATIO = 0.075;
const CARD_ASPECT_RATIO = 1.4;
const OVERLAP_RATIO = 0.55;
const MAX_HAND_WIDTH_RATIO = 0.9;
const MAX_FAN_ANGLE_DEG = 6;
const ARC_DIP_RATIO = 0.05;

export class OpponentHand
{
    private scene: Phaser.Scene;
    private cards: OpponentCard[] = [];

    constructor(scene: Phaser.Scene)
    {
        this.scene = scene;
    }

    setCount(count: number)
    {
        while (this.cards.length < count)
        {
            const cardWidth = this.scene.scale.width * CARD_WIDTH_RATIO;
            const cardHeight = cardWidth * CARD_ASPECT_RATIO;
            this.cards.push(new OpponentCard(this.scene, cardWidth, cardHeight));
        }
        while (this.cards.length > count)
            this.cards.pop()?.destroy();
        this.layout();
    }

    getCount(): number
    {
        return this.cards.length;
    }

    layout(widthCanvas = this.scene.scale.width, heightCanvas = this.scene.scale.height)
    {
        const amount = this.cards.length;
        if (amount === 0)
            return ;

        const cardWidth = widthCanvas * CARD_WIDTH_RATIO;
        const handY = heightCanvas * HAND_Y_RATIO;
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
            const y = handY - dip;
            const rotation = Phaser.Math.DegToRad(-norm * MAX_FAN_ANGLE_DEG);

            this.scene.tweens.add({ targets: card, x, y, rotation, duration: 150, ease: "Back.Out" });
            card.setDepth(i);
        }
    }
}
