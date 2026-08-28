import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";
import type { Difficulty } from "./shared/protocol";

export type GameMode = "solo" | "multiplayer";

export function createGameConfig(parent: HTMLDivElement, mode: GameMode, difficulty: Difficulty): Phaser.Types.Core.GameConfig
{
    return {
        type: Phaser.AUTO, parent, backgroundColor: "#5858b3",
        scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH, width: "100%", height: "100%" },
        scene: [BootScene, GameScene],
        callbacks: {
            preBoot: (game: Phaser.Game) => game.scene.start("BootScene", { mode, difficulty }),
        },
    };
}