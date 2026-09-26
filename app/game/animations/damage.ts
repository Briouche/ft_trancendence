import Phaser from "phaser";
import { MAX_MAGNITUDE, NEGATIVE_COLOR, spawnFloatingNumber } from "./shared";

const MIN_SHAKE = 8;
const SHAKE_PER_DAMAGE = 2.5;
const MIN_SCALE_DIP = 0.05;
const SCALE_DIP_PER_DAMAGE = 0.01;

/** Shake and squash scaled by the damage amount, with a floating "-N". */
export function damageAnimation(scene: Phaser.Scene, target: Phaser.GameObjects.Container, damage: number): Promise<void>
{
    return new Promise((resolve) =>
    {
        const magnitude = Phaser.Math.Clamp(damage, 1, MAX_MAGNITUDE);
        const shakeDistance = MIN_SHAKE + magnitude * SHAKE_PER_DAMAGE;
        const scaleDip = MIN_SCALE_DIP + magnitude * SCALE_DIP_PER_DAMAGE;

        const originalX = target.x;
        const originalScale = target.scaleX;

        scene.cameras.main.shake(80 + magnitude * 4, 0.001 + magnitude * 0.0007);

        scene.tweens.chain({
            targets: target,
            tweens: [
                { x: originalX - shakeDistance, scaleX: originalScale - scaleDip, scaleY: originalScale - scaleDip, duration: 40, ease: "Sine.Out" },
                { x: originalX + shakeDistance * 0.6, duration: 60, ease: "Sine.InOut" },
                { x: originalX, scaleX: originalScale, scaleY: originalScale, duration: 90, ease: "Back.Out", onComplete: () => resolve() },
            ],
        });

        spawnFloatingNumber(scene, target.x, target.y, `-${damage}`, NEGATIVE_COLOR, magnitude);
    });
}
