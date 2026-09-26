import Phaser from "phaser";
import { HistoryEntry } from "./MatchHistory";

const TEXTURE_BY_KIND: Partial<Record<HistoryEntry["icon"]["kind"], string>> = {
    attack: "history_attack",
    turnEnded: "history_turnEnded",
};

function drawCardPlaceholder(g: Phaser.GameObjects.Graphics, size: number): void
{
    g.fillStyle(0x445566, 1);
    g.lineStyle(2, 0x000000, 0.7);
    g.fillRoundedRect(-size / 2, -size / 2, size, size, size * 0.15);
    g.strokeRoundedRect(-size / 2, -size / 2, size, size, size * 0.15);
}

/** Icon of a history entry: the card's art, the sword/hourglass texture, or a drawn placeholder. */
export function createHistoryIcon(scene: Phaser.Scene, icon: HistoryEntry["icon"], x: number, y: number, size: number): Phaser.GameObjects.Image | Phaser.GameObjects.Graphics
{
    const assetKey = icon.kind === "cardPlayed" ? icon.assetKey : TEXTURE_BY_KIND[icon.kind];

    if (assetKey && scene.textures.exists(assetKey))
        return scene.add.image(x, y, assetKey).setDisplaySize(size, size);

    const g = scene.add.graphics({ x, y });
    drawCardPlaceholder(g, size);
    return g;
}
