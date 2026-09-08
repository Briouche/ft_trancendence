
// Every possible move the AI (or a player) can make on their turn.
// MCTS works with this list instead of talking to the game engine directly (for now).
 
export type Action =
  | { type: "playCard"; cardIndex: number; targetIndex?: number }
  | { type: "attack"; attackerIndex: number; targetIndex: number }
  | { type: "endTurn" };

export const DIFFICULTY_PRESETS = {
  facile:    { simulations: 100, worlds: 2 },
  moyen:     { simulations: 500, worlds: 5 },
  difficile: { simulations: 2000, worlds: 8 },
} as const;

export type Difficulty = keyof typeof DIFFICULTY_PRESETS;