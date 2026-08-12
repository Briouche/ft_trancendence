import { Card } from "../objects/Card";

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

        scene.tweens.add({
            targets: card,
            x: base.x,
            y: base.y,
            rotation: base.rotation,
            alpha: 1,
            scale: 1,
            duration: 300,
            ease: "Cubic.Out",
            onComplete: () => resolve(),
        });
    });
}