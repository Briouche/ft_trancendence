import Phaser from "phaser";
import { Card } from "../objects/card/Card";

export function deathAnimation(scene: Phaser.Scene, card: Card): Promise<void>
{
    return new Promise((resolve) =>
    {
        scene.tweens.add({
            targets: card, scale: 0, alpha: 0, angle: 90, duration: 450, ease: "back.in",
            onComplete: () => resolve(),
        });
    });
}
