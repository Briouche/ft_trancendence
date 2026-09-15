// worlds: sampled opponent hands; simulations: MCTS iterations per world.
export const DIFFICULTY_PRESETS = {
  facile:    { simulations: 100, worlds: 2 },
  moyen:     { simulations: 500, worlds: 5 },
  difficile: { simulations: 2000, worlds: 8 },
} as const;

export type Difficulty = keyof typeof DIFFICULTY_PRESETS;
