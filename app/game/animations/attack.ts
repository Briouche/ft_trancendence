import Phaser from "phaser";
import { Card } from "../objects/card/Card";

export function attackAnimation(scene: Phaser.Scene, attacker: Card, targetX: number, targetY: number): Promise<void>
{
    return new Promise((resolve) =>
    {
        const startX = attacker.x;
        const startY = attacker.y;
        const angle = Phaser.Math.Angle.Between(startX, startY, targetX, targetY);
        const pullBack = 60;
        const backX = startX - Math.cos(angle) * pullBack;
        const backY = startY - Math.sin(angle) * pullBack;

        scene.tweens.chain({
            targets: attacker,
            tweens: [
                { x: backX, y: backY, duration: 300, ease: "back.out" },
                {
                    x: targetX, y: targetY, duration: 100, ease: "expo.in",
                    onComplete: () => { if (attacker.active) scene.cameras.main.shake(150, 0.01); },
                },
                {
                    x: startX, y: startY, duration: 150, ease: "expo.out",
                    onComplete: () => resolve(),
                },
            ],
        });
    });
}
