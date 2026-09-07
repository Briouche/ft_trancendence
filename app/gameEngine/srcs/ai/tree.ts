// MCTS tree mechanics: selection, expansion, simulation, backprop.

import { GameEngine } from "../gameEngine";
import { Targetable } from "../target";
import { Action } from "./types";
import { MinionCard } from "../card";

const UCB1_C = Math.SQRT2;

// A single point in the "tree" of possible futures the AI is exploring.
// Each node = one possible game state, reached by one possible move.

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

// Takes a move and plays it out on a COPY of the game, so the real match
// is never touched. Every simulated move goes through this.

export function applyAction(engine: GameEngine, action: Action): GameEngine {
  const clone = engine.clone();

  switch (action.type) {
    case "playCard":
      clone.playCard(action.cardIndex, new Map());
      break;
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

// Creates a new node for the tree: a snapshot of the game at this point,
// plus the list of moves not yet explored from here.

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

// Scores how "worth exploring" a move is — balances trying moves that have
// worked well so far vs. trying moves that haven't been tested much yet.
// This is the formula that makes MCTS smarter than pure random guessing.

function ucb1(node: MCTSNode, parentVisits: number): number {
  if (node.visits === 0) return Infinity;
  return (node.wins / node.visits) + UCB1_C * Math.sqrt(Math.log(parentVisits) / node.visits);
}

// Picks the most promising move to explore next, based on the score above.

export function selectBestChild(node: MCTSNode): MCTSNode {
  return node.children.reduce((best, c) => ucb1(c, node.visits) > ucb1(best, node.visits) ? c : best);
}

// Tries one move that hasn't been tested yet from this point in the tree.

export function expand(node: MCTSNode): MCTSNode {
  const idx    = Math.floor(Math.random() * node.untriedActions.length);
  const action = node.untriedActions.splice(idx, 1)[0];
  const child  = createNode(applyAction(node.state, action), node, action);
  node.children.push(child);
  return child;
}

// Plays a full game out to the end using random moves on both sides, just
// to get a rough "did this path lead to a win or a loss" signal.

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

export function simulate(state: GameEngine, forPlayer: 0 | 1): number 
{
  let s = state;
  const MAX_DEPTH = 60;

  for (let d = 0; d < MAX_DEPTH && !s.isTerminal(); d++) 
  {
    const actions = s.getLegalActions();
    s = applyAction(s, actions[Math.floor(Math.random() * actions.length)]);
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

// After a simulated game ends, walks back up the tree updating each node's
// win/loss record — this is how the AI "learns" which early moves were good.

export function backpropagate(node: MCTSNode | null, result: number, forPlayer: 0 | 1): void 
{
  for (let n = node; n !== null; n = n.parent) 
  {
    n.visits++;
    n.wins += n.ownerIndex === forPlayer ? result : 1 - result;
  }
}