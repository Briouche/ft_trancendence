import Phaser from "phaser";

// Small VFX helpers (floating +/- numbers, glow pulses) reused by several animations/*.ts files.

// Clamps the value so a huge damage/heal/buff number can't blow up font size or shake distance
// past this point.
export const MAX_MAGNITUDE = 40;
export const POSITIVE_COLOR = "#09d84e";
export const NEGATIVE_COLOR = "#ff4d4d";

export function spawnFloatingNumber(scene: Phaser.Scene, x: number, y: number, text: string, color: string, magnitude: number): void
{
    const fontSize = 20 + magnitude * 2.5;

    const textObj = scene.add.text(x, y, text,
    {
        fontSize: `${Math.round(fontSize)}px`,
        color,
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
    }).setOrigin(0.5).setDepth(2000);

    scene.tweens.add(
    {
        targets: textObj,
        y: y - 60 - magnitude * 2,
        alpha: 0,
        scale: 1.3,
        duration: 700,
        ease: "Cubic.Out",
        onComplete: () => textObj.destroy(),
    });
}

export function spawnGlowPulse(scene: Phaser.Scene, target: Phaser.GameObjects.Container, color: number): void
{
    const radius = (Math.max(target.width, target.height) || 80) * 0.4;
    const ring = scene.add.circle(target.x, target.y, radius, color, 0.35)
        .setStrokeStyle(2, color, 0.8)
        .setDepth((target.depth ?? 0) - 1);

    scene.tweens.add({
        targets: ring,
        scale: { from: 1, to: 1.6 },
        alpha: { from: 0.5, to: 0 },
        duration: 500,
        ease: "Cubic.easeOut",
        onComplete: () => ring.destroy(),
    });
}
