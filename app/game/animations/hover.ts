import { Card } from "../objects/card/Card";


const HOVER_LIFT_RATIO = 0.25;
const HOVER_DEPTH = 1000;

/** Makes a hand card rise and come to the front while the pointer is over it. */
export function attachCardHover(card: Card): void
{
    card.on("pointerover", () => onHoverStart(card));
    card.on("pointerout", () => onHoverEnd(card));
}

function onHoverStart(card: Card): void
{
    if (card.isDragging || !card.active || !card.scene)
        return;

    card.isHovering = true;
    const base = card.getBasePosition();

    card.scene.tweens.add({
        targets: card,
        x: base.x,
        y: base.y - card.height * HOVER_LIFT_RATIO,
        rotation: 0,
        duration: 120,
        ease: "Sine.Out",
    });
    card.setDepth(HOVER_DEPTH);
}

function onHoverEnd(card: Card): void
{
    card.isHovering = false;
    if (card.isDragging || !card.active || !card.scene)
        return;
    card.returnToBase();
}
