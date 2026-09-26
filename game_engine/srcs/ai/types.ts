// Strength of the AI at each difficulty (the keys are the values the client sends).
//
// - simulations / worlds: search effort. `worlds` is how many random guesses of the opponent's
//   hidden hand are searched (the AI never sees the real one); `simulations` is how many MCTS
//   iterations each guess gets. More of both = better-informed moves.
// - mistakeRate: probability that a move is picked at random among the sensible ones instead of
//   the searched best move — the "human" imprecision (see ai/policy.ts).
// - thinkMs: range of the pause before each move, so the AI plays at a human pace and its
//   actions can be followed on screen.
export const DIFFICULTY_PRESETS = {
  facile:    { simulations: 100,  worlds: 2, mistakeRate: 0.25, thinkMs: [1200, 2400] },
  moyen:     { simulations: 500,  worlds: 5, mistakeRate: 0.10, thinkMs: [900, 1900] },
  difficile: { simulations: 2000, worlds: 8, mistakeRate: 0,    thinkMs: [700, 1500] },
} as const;

export type Difficulty = keyof typeof DIFFICULTY_PRESETS;
