import Phaser from "phaser";
import { MAX_MAGNITUDE, NEGATIVE_COLOR, POSITIVE_COLOR, spawnFloatingNumber, spawnGlowPulse } from "./shared";

export function buffAnimation(scene: Phaser.Scene, target: Phaser.GameObjects.Container, attackDelta: number, healthDelta: number): Promise<void>
{
    return new Promise((resolve) =>
    {
        const deltas = [attackDelta, healthDelta].filter((d) => d !== 0);
        if (deltas.length === 0)
        {
            resolve();
            return;
        }

        const magnitude = Phaser.Math.Clamp(Math.max(...deltas.map(Math.abs)), 1, MAX_MAGNITUDE);
        const originalScale = target.scaleX;
        const netPositive = deltas.reduce((a, b) => a + b, 0) >= 0;

        spawnGlowPulse(scene, target, netPositive ? 0x09d84e : 0xff4d4d);

        scene.tweens.add({
            targets: target,
            scaleX: originalScale * 1.08,
            scaleY: originalScale * 1.08,
            duration: 160,
            yoyo: true,
            ease: "Sine.InOut",
            onComplete: () => resolve(),
        });

        deltas.forEach((delta, i) =>
        {
            const offsetX = deltas.length > 1 ? (i === 0 ? -14 : 14) : 0;
            const color = delta > 0 ? POSITIVE_COLOR : NEGATIVE_COLOR;
            spawnFloatingNumber(scene, target.x + offsetX, target.y, `${delta > 0 ? "+" : ""}${delta}`, color, magnitude);
        });
    });
}
