import Phaser from "phaser";
import { Card } from "../objects/card/Card";

const GROW_SCALE = 4.2;
const DURATION = 700;

export function deathrattleAnimation(scene: Phaser.Scene, card: Card): Promise<void>
{
    return new Promise((resolve) =>
    {
        const skull = card.getDeathrattleSkull();
        const originalScaleX = skull.scaleX;
        const originalScaleY = skull.scaleY;
        const originalAlpha = skull.alpha;

        scene.tweens.add({
            targets: skull,
            scaleX: originalScaleX * GROW_SCALE,
            scaleY: originalScaleY * GROW_SCALE,
            alpha: 0,
            duration: DURATION,
            ease: "Sine.Out",
            onComplete: () =>
            {
                skull.setScale(originalScaleX, originalScaleY);
                skull.setAlpha(originalAlpha);
                resolve();
            },
        });
    });
}
