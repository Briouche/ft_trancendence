import Phaser from "phaser";
import { Card } from "../objects/card/Card";

/** Minion death: the card spins and shrinks away. Resolves when done (the caller then removes it). */
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
