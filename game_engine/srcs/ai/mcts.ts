
import { Action, GameEngine } from "../gameEngine";
import { determinize } from "./determinize";
import { createNode, selectBestChild, expand, simulate, backpropagate, winRateFor } from "./tree";

/**
 * Best action for the current player: one MCTS tree per sampled opponent hand ("world"),
 * the action with the best average win rate across worlds wins.
 */
export async function getBestAction(
  engine: GameEngine,
  simulations: number,
  worlds: number
): Promise<Action>
{
  const currentPlayer: 0 | 1 = engine.currentTurn;
  const scores = new Map<string, { action: Action; total: number; count: number; visits: number }>();

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

      const result = simulate(node.state, currentPlayer, node.depth);
      backpropagate(node, result, currentPlayer);
    }

    for (const child of root.children) {
      if (!child.action || child.visits === 0) continue;
      const key      = JSON.stringify(child.action);
      const winRate  = winRateFor(root, child);
      const existing = scores.get(key);
      if (existing) {
        existing.total += winRate; existing.count++; existing.visits += child.visits; }
      else
        scores.set(key, { action: child.action, total: winRate, count: 1, visits: child.visits });
    }
  }

  // Best average win rate across worlds; on a tie, the most visited action (the search spent
  // its effort there, the standard "robust child" choice) rather than whichever came first.
  let bestAction: Action = { type: "endTurn" };
  let bestScore          = -1;
  let bestVisits         = -1;

  for (const { action, total, count, visits } of scores.values()) {
    const avg = total / count;
    if (avg > bestScore + 1e-9 || (Math.abs(avg - bestScore) <= 1e-9 && visits > bestVisits)) {
      bestScore = avg; bestAction = action; bestVisits = visits;
    }
  }

  return bestAction;
}
