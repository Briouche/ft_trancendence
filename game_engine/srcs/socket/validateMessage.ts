import { ClientMessage } from "../shared/protocol";
import { DIFFICULTY_PRESETS, Difficulty } from "../ai/types";

// Checks on what clients send. The client is not trusted: anything that reaches the engine is
// validated here first (serverSocket.ts for match requests, gameSession.ts for in-game moves).

/**
 * True for a known AI difficulty. An unknown one used to leave DIFFICULTY_PRESETS[difficulty]
 * undefined and the AI loop dead, so the match hung forever on the AI's turn.
 */
export function isDifficulty(value: unknown): value is Difficulty
{
    return typeof value === "string" && Object.prototype.hasOwnProperty.call(DIFFICULTY_PRESETS, value);
}

/** True for a positive integer deck id. */
export function isDeckId(value: unknown): value is number
{
    return Number.isSafeInteger(value) && (value as number) > 0;
}

/**
 * Shape check of an in-game message before it reaches the engine: a string boardIndex, for one,
 * would slip past the range check in handlePlayCard (string comparisons are always false).
 */
export function isWellFormed(msg: unknown): msg is ClientMessage
{
    if (typeof msg !== "object" || msg === null)
        return false;

    const m = msg as Record<string, unknown>;
    switch (m.type)
    {
        case "playCard":
            return typeof m.cardId === "string" && (m.boardIndex === undefined || Number.isSafeInteger(m.boardIndex));
        case "attack":
            return typeof m.attackerId === "string" && typeof m.targetId === "string";
        case "targetChoice":
            return m.targetId === null || typeof m.targetId === "string";
        default:
            return typeof m.type === "string";
    }
}
