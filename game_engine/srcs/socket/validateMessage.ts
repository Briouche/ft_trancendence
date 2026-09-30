import { ClientMessage } from "../shared/protocol";
import { DIFFICULTY_PRESETS } from "../ai/types";

// Runtime check of what a client sends. TypeScript types don't exist at runtime: a modified
// client can send anything (null, strings where numbers are expected, an unknown difficulty),
// and the handlers must only ever see well-formed messages.

const isId = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 128;
const isIndex = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 100;
// Capped at the PostgreSQL `integer` maximum (Deck.id).
const isDeckId = (v: unknown): v is number => Number.isInteger(v) && (v as number) > 0 && (v as number) <= 2_147_483_647;

/** The message if it is a well-formed ClientMessage, otherwise null. */
export function parseClientMessage(raw: unknown): ClientMessage | null
{
    if (typeof raw !== "object" || raw === null)
        return null;
    const msg = raw as Record<string, unknown>;

    switch (msg.type)
    {
        case "ready":
            return isDeckId(msg.deckId) && Number.isInteger(msg.cardBack)
                ? { type: "ready", deckId: msg.deckId, cardBack: msg.cardBack as number } : null;
        case "readySolo":
            return isDeckId(msg.deckId) && Number.isInteger(msg.cardBack)
                && typeof msg.difficulty === "string" && Object.prototype.hasOwnProperty.call(DIFFICULTY_PRESETS, msg.difficulty)
                ? { type: "readySolo", deckId: msg.deckId, cardBack: msg.cardBack as number, difficulty: msg.difficulty as keyof typeof DIFFICULTY_PRESETS } : null;
        case "playCard":
            return isId(msg.cardId) && (msg.boardIndex === undefined || isIndex(msg.boardIndex))
                ? { type: "playCard", cardId: msg.cardId, boardIndex: msg.boardIndex as number | undefined } : null;
        case "attack":
            return isId(msg.attackerId) && isId(msg.targetId)
                ? { type: "attack", attackerId: msg.attackerId, targetId: msg.targetId } : null;
        case "targetChoice":
            return msg.targetId === null || isId(msg.targetId)
                ? { type: "targetChoice", targetId: msg.targetId as string | null } : null;
        case "endTurn":
        case "resume":
        case "quit":
            return { type: msg.type };
        default:
            return null;
    }
}
