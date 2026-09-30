// MCTS: selection (UCB1), expansion, random rollout, backpropagation.

import { Action, GameEngine } from "../gameEngine";
import { Targetable } from "../target";
import { MinionCard } from "../card";
import { Effect } from "../effect";

// UCB1 exploration constant for rewards in [0, 1].
const UCB1_C = Math.SQRT2;

// One reachable game state and the move that led to it.
export interface MCTSNode {
  state:          GameEngine;
  parent:         MCTSNode | null;
  action:         Action | null;
  children:       MCTSNode[];
  visits:         number;
  wins:           number;
  untriedActions: Action[];
  ownerIndex:     0 | 1;
}

/** Plays `action` on a clone and returns it; the real match is never touched. */
export function applyAction(engine: GameEngine, action: Action): GameEngine {
  const clone = engine.clone();

  switch (action.type) {
    case "playCard": {
      const card = clone.activePlayer().hand.getCards()[action.cardIndex];
      const targets = new Map<Effect, Targetable | null>();
      const effect = clone.getOnPlayEffect(card);

      if (effect) {
        const target = action.targetIndex !== undefined
          ? clone.getOnPlayTargets(card)[action.targetIndex] ?? null
          : null;
        targets.set(effect, target);
      }

      clone.playCard(action.cardIndex, targets);
      break;
    }
    case "attack": {
      const opponentIdx: 0 | 1 = clone.currentTurn === 0 ? 1 : 0;
      const target: Targetable = action.targetIndex === -1
        ? clone.players[opponentIdx].hero
        : clone.board.getMinions(opponentIdx)[action.targetIndex];
      clone.attackWithMinion(action.attackerIndex, target);
      break;
    }
    case "endTurn":
      clone.endTurn();
      break;
  }

  return clone;
}

export function createNode(state: GameEngine, parent: MCTSNode | null, action: Action | null): MCTSNode {
  return {
    state,
    parent,
    action,
    children:       [],
    visits:         0,
    wins:           0,
    untriedActions: state.isTerminal() ? [] : state.getLegalActions(),
    ownerIndex:     state.currentTurn,
  };
}

function ucb1(node: MCTSNode, parentVisits: number): number {
  if (node.visits === 0) return Infinity;
  return (node.wins / node.visits) + UCB1_C * Math.sqrt(Math.log(parentVisits) / node.visits);
}

export function selectBestChild(node: MCTSNode): MCTSNode {
  return node.children.reduce((best, c) => ucb1(c, node.visits) > ucb1(best, node.visits) ? c : best);
}

// Expands one random untried action into a child node.
export function expand(node: MCTSNode): MCTSNode {
  const idx    = Math.floor(Math.random() * node.untriedActions.length);
  const action = node.untriedActions.splice(idx, 1)[0];
  const child  = createNode(applyAction(node.state, action), node, action);
  node.children.push(child);
  return child;
}

export function isWastedPlay(engine: GameEngine, action: Action): boolean {
  if (action.type !== "playCard") return false;

  const card = engine.activePlayer().hand.getCards()[action.cardIndex];
  const effect = engine.getOnPlayEffect(card);
  if (!effect || !effect.resolver) return false;

  if (effect.resolver.requiresInput)
    return action.targetIndex === undefined && engine.getOnPlayTargets(card).length === 0;

  const context = { engine, owner: engine.activePlayer(), source: card };
  return effect.resolver.resolve(context).length === 0;
}

// Heuristic score in [0, 1] for a rollout that hit MAX_DEPTH: hero HP first, board and hand
// as tie-breakers.
function evaluate(state: GameEngine, forPlayer: 0 | 1): number
{
  const oppPlayer = forPlayer === 0 ? 1 : 0;
  const me  = state.players[forPlayer];
  const opp = state.players[oppPlayer];

  const hpDiff = (me.hero.currentHealth / me.hero.maxHealth)
               - (opp.hero.currentHealth / opp.hero.maxHealth);

  const boardScore = (minions: MinionCard[]) =>
    minions.reduce((sum, m) => sum + m.attack + m.currentHealth, 0);
  const boardDiff = boardScore(state.board.getMinions(forPlayer))
                   - boardScore(state.board.getMinions(oppPlayer));

  const handDiff = me.hand.size() - opp.hand.size();

  const W_HP = 1.0, W_BOARD = 0.05, W_HAND = 0.1;
  const raw = W_HP * hpDiff + W_BOARD * boardDiff + W_HAND * handDiff;

  return 0.5 + 0.5 * Math.tanh(raw);
}

// Random playout, capped at MAX_DEPTH plies.
export function simulate(state: GameEngine, forPlayer: 0 | 1): number
{
  let s = state;
  const MAX_DEPTH = 60;

  for (let d = 0; d < MAX_DEPTH && !s.isTerminal(); d++)
  {
    const actions = s.getLegalActions();
    const usefulActions = actions.filter(a => !isWastedPlay(s, a));
    const pool = usefulActions.length > 0 ? usefulActions : actions;
    s = applyAction(s, pool[Math.floor(Math.random() * pool.length)]);
  }

  if (s.isTerminal())
  {
    const winner = s.getWinner();
    if (winner === forPlayer) return 1;
    if (winner === null)      return 0.5;
    return 0;
  }

  return evaluate(s, forPlayer);
}

// Each node's wins are counted from the perspective of the player to move at that node.
export function backpropagate(node: MCTSNode | null, result: number, forPlayer: 0 | 1): void
{
  for (let n = node; n !== null; n = n.parent)
  {
    n.visits++;
    n.wins += n.ownerIndex === forPlayer ? result : 1 - result;
  }
}
