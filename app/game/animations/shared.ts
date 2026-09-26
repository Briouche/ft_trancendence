import Phaser from "phaser";

// Floating numbers and glow pulses shared by the effect animations.

export const MAX_MAGNITUDE = 40;
export const POSITIVE_COLOR = "#09d84e";
export const NEGATIVE_COLOR = "#ff4d4d";

/** Number that floats up and fades out at (x, y); bigger for bigger `magnitude`. Fire-and-forget. */
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

/** Colored ring that expands and fades behind `target`. Fire-and-forget. */
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
