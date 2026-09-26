import { Action, GameEngine } from "../gameEngine";
import { getBestAction } from "./mcts";
import { isWastedPlay } from "./tree";
import { DIFFICULTY_PRESETS, Difficulty } from "./types";

// How the AI actually picks a move in a real match: the MCTS search, plus human-like
// imprecision on the lower difficulties.

/**
 * The AI's next move for the player whose turn it is.
 *
 * With probability `mistakeRate` the AI plays a random *sensible* move instead of the best one
 * (never a wasted play, and never ending its turn by mistake, which would look like a bug rather
 * than a misplay). Everything else comes from the search, whose strength also depends on the
 * difficulty.
 *
 * @param random injectable for tests; defaults to Math.random.
 */
export async function chooseAiAction(engine: GameEngine, difficulty: Difficulty, random: () => number = Math.random): Promise<Action>
{
    const { simulations, worlds, mistakeRate } = DIFFICULTY_PRESETS[difficulty];

    if (random() < mistakeRate)
    {
        const sensible = engine.getLegalActions().filter(a => a.type !== "endTurn" && !isWastedPlay(engine, a));
        if (sensible.length > 0)
            return sensible[Math.floor(random() * sensible.length)];
    }

    return getBestAction(engine, simulations, worlds);
}

/** Pause before the AI's next move, in ms, drawn in the difficulty's range. */
export function thinkingTime(difficulty: Difficulty, random: () => number = Math.random): number
{
    const [min, max] = DIFFICULTY_PRESETS[difficulty].thinkMs;
    return Math.round(min + random() * (max - min));
}
