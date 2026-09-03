import Phaser from "phaser";

export function turnBannerAnimation(scene: Phaser.Scene, text: string): Promise<void>
{
    return new Promise((resolve) =>
    {
        const { width, height } = scene.scale;
        const banner = scene.add.text(width / 2, height / 2, text, {
            fontSize: "48px", color: "#ffffff", fontStyle: "bold",
        }).setOrigin(0.5).setAlpha(0).setDepth(2000);

        scene.tweens.chain({
            targets: banner,
            tweens: [
                { alpha: 1, scale: 1.1, duration: 200, ease: "back.out" },
                { scale: 1, duration: 100 },
                { alpha: 0, duration: 300, delay: 600, onComplete: () => { banner.destroy(); resolve(); } },
            ],
        });
    });
}
