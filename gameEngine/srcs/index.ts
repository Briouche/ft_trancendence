import { gameLoop } from "./gameLoop";
import { Player } from "./player";
import { Hero }       from "./hero";
import { makeBasicDeck }       from "./deck";

const player1: Player = new Player(new Hero("Stef"),  makeBasicDeck(), 0);
const player2: Player = new Player(new Hero("Bribz"), makeBasicDeck(), 1);

gameLoop(player1, player2);
