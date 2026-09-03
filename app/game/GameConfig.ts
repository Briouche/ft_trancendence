import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";
import type { Difficulty } from "./shared/protocol";

export type GameMode = "solo" | "multiplayer";

export function createGameConfig(parent: HTMLDivElement, mode: GameMode, difficulty: Difficulty, deckId: number, cardBack: number): Phaser.Types.Core.GameConfig
{
    return {
        type: Phaser.AUTO, parent, backgroundColor: "#5858b3",
        // roundPixels : sans ça, le texte des cartes (positionné à des coordonnées en %
        // converties en float, pas forcément sur un pixel entier) rendait légèrement flou/
        // anti-crénelé au lieu de net.
        roundPixels: true,
        scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH, width: "100%", height: "100%" },
        scene: [BootScene, GameScene],
        callbacks: {
            preBoot: (game: Phaser.Game) => game.scene.start("BootScene", { mode, difficulty, deckId, cardBack }),
        },
    };
}