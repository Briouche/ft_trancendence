import Phaser from "phaser";
import { MAX_MAGNITUDE, POSITIVE_COLOR, spawnFloatingNumber, spawnGlowPulse } from "./shared";

export function healAnimation(scene: Phaser.Scene, target: Phaser.GameObjects.Container, amount: number): Promise<void>
{
    return new Promise((resolve) =>
    {
        const magnitude = Phaser.Math.Clamp(amount, 1, MAX_MAGNITUDE);
        const originalScale = target.scaleX;

        spawnGlowPulse(scene, target, 0x09d84e);

        scene.tweens.add({
            targets: target,
            scaleX: originalScale * 1.08,
            scaleY: originalScale * 1.08,
            duration: 160,
            yoyo: true,
            ease: "Sine.InOut",
            onComplete: () => resolve(),
        });

        spawnFloatingNumber(scene, target.x, target.y, `+${amount}`, POSITIVE_COLOR, magnitude);
    });
}
