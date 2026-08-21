import Phaser from "phaser";

const MIN_SHAKE = 8;
const SHAKE_PER_DAMAGE = 2.5;
const MIN_SCALE_DIP = 0.05;
const SCALE_DIP_PER_DAMAGE = 0.01;
const MAX_MAGNITUDE = 40;

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

        spawnDamageNumber(scene, target.x, target.y, damage, magnitude);
    });
}

function spawnDamageNumber(scene: Phaser.Scene, x: number, y: number, damage: number, magnitude: number)
{
    const fontSize = 20 + magnitude * 2.5;

    const text = scene.add.text(x, y, `-${damage}`,
    {
        fontSize: `${Math.round(fontSize)}px`,
        color: "#ff4d4d",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
    }).setOrigin(0.5).setDepth(2000);

    scene.tweens.add(
    {
        targets: text,
        y: y - 60 - magnitude * 2,
        alpha: 0,
        scale: 1.3,
        duration: 700,
        ease: "Cubic.Out",
        onComplete: () => text.destroy(),
    });
}
