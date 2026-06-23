import { GameEngine } from "./gameEngine";
import { Hero } from "./hero";
import { Player } from "./player";
import { makeBasicDeck } from "./deck";

export function gameLoop() : void
{
    let player1 = new Player(new Hero("Jef"), makeBasicDeck());
    let player2 = new Player(new Hero("Jan"), makeBasicDeck());
    let engine  = new GameEngine([player1, player2]);

    engine.startGame();
}
