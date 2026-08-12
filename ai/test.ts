/**
* standalone terminal runner.
* Run: npx ts-node ai/test.ts
* Tune: MCTS_SIMULATIONS=1000 MCTS_WORLDS=5 npx ts-node ai/test.ts
 */

import { GameEngine } from "../gameEngine/srcs/gameEngine";
import { Player } from "../gameEngine/srcs/player";
import { Hero } from "../gameEngine/srcs/hero";
import { makeBasicDeck } from "../gameEngine/srcs/deck";
import { Action } from "./types";
import { getBestAction } from "./mcts";
import { applyAction } from "./tree";
 
function describeAction(engine: GameEngine, action: Action, playerName: string): string {
  switch (action.type) {
    case "playCard": {
      const card = engine.activePlayer().hand.getCards()[action.cardIndex];
      return `${playerName} plays "${card?.name ?? "?"}"`;
    }
    case "attack": {
      const attacker = engine.board.getMinions(engine.currentTurn)[action.attackerIndex];
      const opponentIdx: 0 | 1 = engine.currentTurn === 0 ? 1 : 0;
      const targetName = action.targetIndex === -1
        ? `${engine.players[opponentIdx].hero.name} (face)`
        : engine.board.getMinions(opponentIdx)[action.targetIndex]?.name ?? "?";
      return `${playerName} attacks ${targetName} with "${attacker?.name ?? "?"}"`;
    }
    case "endTurn":
      return `${playerName} ends their turn`;
  }
}
 
function runTest(): void {
  const p1 = new Player(new Hero("AI-1"), makeBasicDeck(), 0);
  const p2 = new Player(new Hero("AI-2"), makeBasicDeck(), 1);
  let engine = new GameEngine([p1, p2]);
  engine.startGame();
 
  let moves = 0;
  const MAX_MOVES = 80;
 
  while (!engine.isTerminal() && moves < MAX_MOVES) {
    const playerName = engine.activePlayer().hero.name;
 
    const t0     = Date.now();
    const action = getBestAction(engine);
    const ms     = Date.now() - t0;
 
    console.log(`[${ms}ms] ${describeAction(engine, action, playerName)}`);
    engine = applyAction(engine, action);
    moves++;
  }
 
  const winner = engine.getWinner();
  if (winner !== null) {
    console.log(`\n${engine.players[winner].hero.name} wins after ${moves} moves`);
  } else {
    console.log(`\nDraw / depth cap reached (${moves} moves)`);
  }
}
 
runTest();