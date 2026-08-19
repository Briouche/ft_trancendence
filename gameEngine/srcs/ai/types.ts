
// Every possible move the AI (or a player) can make on their turn.
// MCTS works with this list instead of talking to the game engine directly (for now).
 
export type Action =
  | { type: "playCard"; cardIndex: number }
  | { type: "attack"; attackerIndex: number; targetIndex: number }
  | { type: "endTurn" };