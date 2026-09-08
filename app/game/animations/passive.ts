import Phaser from "phaser";
import { Card } from "../objects/card/Card";

const GLOW_COLOR = 0xfff066;
const PULSE_DURATION = 220;

export function passiveEffectAnimation(scene: Phaser.Scene, card: Card): Promise<void>
{
    return new Promise((resolve) =>
    {
        const bolt = card.getEffectBolt();
        const fxCapable = bolt as unknown as { postFX?: Phaser.GameObjects.Components.FX };

        // postFX (real glow shader) only exists under WebGL; on the Canvas fallback renderer it's
        // undefined, so a manually animated ring below approximates the same pulse.
        if (fxCapable.postFX)
        {
            const glow = fxCapable.postFX.addGlow(GLOW_COLOR, 0, 0, false, 0.2, 12);

            scene.tweens.add({
                targets: glow,
                outerStrength: 5,
                duration: PULSE_DURATION,
                yoyo: true,
                repeat: 1,
                ease: "Sine.InOut",
                onComplete: () =>
                {
                    fxCapable.postFX!.remove(glow);
                    resolve();
                },
            });
            return;
        }

        const ring = scene.add.circle(bolt.x, bolt.y, bolt.displayWidth * 0.5, GLOW_COLOR, 0);
        ring.setStrokeStyle(3, GLOW_COLOR, 0.9);

        const boltIndex = card.getIndex(bolt);
        card.addAt(ring, boltIndex);

        scene.tweens.add({
            targets: ring,
            radius: bolt.displayWidth,
            alpha: 0,
            duration: PULSE_DURATION * 2,
            ease: "Cubic.Out",
            onComplete: () =>
            {
                ring.destroy();
                resolve();
            },
        });
    });
}
