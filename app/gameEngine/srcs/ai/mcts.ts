
import { GameEngine } from "../gameEngine";
import { Action } from "./types";
import { determinize } from "./determinize";
import { createNode, selectBestChild, expand, simulate, backpropagate } from "./tree";


export async function getBestAction(
  engine: GameEngine,
  simulations: number,
  worlds: number
): Promise<Action> 
{
  const currentPlayer: 0 | 1 = engine.currentTurn;
  const scores = new Map<string, { action: Action; total: number; count: number }>();

  for (let w = 0; w < worlds; w++) {
    const root = createNode( await determinize(engine, currentPlayer), null, null);

    for (let i = 0; i < simulations; i++) {
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
      const rawRate  = child.visits > 0 ? child.wins / child.visits : 0;
      const winRate  = child.ownerIndex === currentPlayer ? rawRate : 1 - rawRate;
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