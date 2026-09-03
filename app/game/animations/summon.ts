import Phaser from "phaser";
import { Card } from "../objects/card/Card";

export function summonAnimation(scene: Phaser.Scene, card: Card): Promise<void>
{
    return new Promise((resolve) =>
    {
        card.setScale(0.2);
        card.setAlpha(0);
        scene.tweens.add({
            targets: card, scale: 1, alpha: 1, duration: 450, ease: "back.out",
            onComplete: () => resolve(),
        });
    });
}
