
// The only function other code needs to call. Given the current real game
// state, runs many simulated games (see tree.ts) across several guessed
// versions of the opponent's hand ("worlds" — see determinize.ts), then
// returns whichever move won the most across all of them.


import { GameEngine } from "../gameEngine";
import { Action } from "./types";
import { determinize } from "./determinize";
import { createNode, selectBestChild, expand, simulate, backpropagate } from "./tree";

const MCTS_SIMULATIONS       = parseInt(process.env.MCTS_SIMULATIONS ?? "500");
const DETERMINIZATION_WORLDS = parseInt(process.env.MCTS_WORLDS      ?? "5");

export function getBestAction(engine: GameEngine): Action 
{
  const currentPlayer: 0 | 1 = engine.currentTurn;
  const scores = new Map<string, { action: Action; total: number; count: number }>();

  for (let w = 0; w < DETERMINIZATION_WORLDS; w++) {
    const root = createNode(determinize(engine, currentPlayer), null, null);

    for (let i = 0; i < MCTS_SIMULATIONS; i++) {
      let node = root;
      while (!node.state.isTerminal() && node.untriedActions.length === 0 && node.children.length > 0) {
        node = selectBestChild(node);
      }

      if (!node.state.isTerminal() && node.untriedActions.length > 0) {
        node = expand(node);
      }

      const result = simulate(node.state, currentPlayer);
      backpropagate(node, result, currentPlayer);
    }

    for (const child of root.children) {
      if (!child.action) continue;
      const key      = JSON.stringify(child.action);
      const winRate  = child.visits > 0 ? child.wins / child.visits : 0;
      const existing = scores.get(key);
      if (existing) { 
        existing.total += winRate; existing.count++; }
      else         
        scores.set(key, { action: child.action, total: winRate, count: 1 });
    }
  }

  let bestAction: Action = { type: "endTurn" };
  let bestScore          = -1;

  for (const { action, total, count } of scores.values()) {
    const avg = total / count;
    if (avg > bestScore) { bestScore = avg; bestAction = action; }
  }

  return bestAction;
}