import Phaser from "phaser";
import { Card } from "../objects/card/Card";

const BATTLECRY_COLOR = 0x33CCFF;
const WAVE_COUNT = 2;
const WAVE_DURATION = 350;

export function battlecryAnimation(scene: Phaser.Scene, card: Card): Promise<void>
{
    return new Promise((resolve) =>
    {
        const width = card.width;
        const height = card.height;
        let completed = 0;

        for (let i = 0; i < WAVE_COUNT; i++)
        {
            const ring = scene.add.graphics();
            card.add(ring);
            ring.lineStyle(4, BATTLECRY_COLOR, 0.9);
            ring.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);

            scene.tweens.add({
                targets: ring,
                scaleX: 1.6,
                scaleY: 1.6,
                alpha: 0,
                duration: WAVE_DURATION,
                delay: i * 150,
                ease: "Cubic.Out",
                onComplete: () =>
                {
                    ring.destroy();
                    completed++;
                    if (completed === WAVE_COUNT)
                        resolve();
                },
            });
        }

        // punchy scale-pop on the card itself — the "shout"
        scene.tweens.chain({
            targets: card,
            tweens: [
                { scaleX: 1.12, scaleY: 1.12, duration: 100, ease: "Back.Out" },
                { scaleX: 1, scaleY: 1, duration: 150, ease: "Sine.InOut" },
            ],
        });
    });
}
