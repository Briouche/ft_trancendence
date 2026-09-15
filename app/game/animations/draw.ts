import { Card } from "../objects/card/Card";

// Card flies from the deck, is held enlarged for a second, then settles into the hand.
export function drawCardAnimation(scene: Phaser.Scene, card: Card, fromX: number, fromY: number): Promise<void>
{
    return new Promise((resolve) =>
    {
        const base = card.getBasePosition();

        card.x = fromX;
        card.y = fromY;
        card.rotation = 0;
        card.setAlpha(0);
        card.setScale(0.7);

        scene.tweens.chain({
            targets: card,
            tweens: [
                { x: card.x, y: card.y, duration: 200, scale: 0.5, ease: "Cubic.out" },
                { x: scene.scale.canvas.width / 2.5, y: scene.scale.canvas.height / 2.5, rotation: 0, alpha: 1, scale: 1.5, duration: 500, ease: "Cubic.out" },
                { duration: 1000 },
                { x: base.x, y: base.y, scale: 1, rotation: base.rotation, duration: 200, ease: "Cubic.InOut", onComplete: () => resolve() }
            ]
        });
    });
}
