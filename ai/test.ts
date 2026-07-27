/**
* standalone terminal runner.
* Run: npx ts-node ai/test.ts
* Tune: MCTS_SIMULATIONS=1000 MCTS_WORLDS=5 npx ts-node ai/test.ts
 */

import { GameEngine } from "../gameEngine/srcs/gameEngine";
import { Player } from "../gameEngine/srcs/player";
import { Hero } from "../gameEngine/srcs/hero";
import { makeBasicDeck } from "../gameEngine/srcs/deck";
import { getBestAction } from "./mcts";
import { applyAction } from "./tree";

function runTest(): void {
  const p1 = new Player(new Hero("AI-1"), makeBasicDeck());
  const p2 = new Player(new Hero("AI-2"), makeBasicDeck());
  let engine = new GameEngine([p1, p2]);
  engine.startGame();

  let moves = 0;
  const MAX_MOVES = 80;

  while (!engine.isTerminal() && moves < MAX_MOVES) {
    const t0     = Date.now();
    const action = getBestAction(engine);
    const ms     = Date.now() - t0;

    console.log(`Turn ${engine.currentTurn} → ${JSON.stringify(action)}  (${ms}ms)`);
    engine = applyAction(engine, action);
    moves++;
  }

  const winner = engine.getWinner();
  console.log(winner !== null ? `Player ${winner} wins after ${moves} moves` : `Draw / depth cap (${moves} moves)`);
}

runTest();