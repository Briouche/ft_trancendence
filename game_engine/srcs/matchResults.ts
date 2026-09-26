import { MatchMode } from "@prisma/client";
import { prisma } from "./db";
import { Difficulty } from "./ai/types";
import { MatchRewards } from "./shared/protocol";

// Persistence of a finished match: win counters, reward packs, card backs, Elo and the match
// history rows, all in one transaction so a crash can't record half a result.

type WinCategory = "winsVsAiEasy" | "winsVsAiMedium" | "winsVsAiHard" | "winsVsPlayer";

/** Match mode stored in Match.mode for a game against the AI at each difficulty. */
export const AI_MATCH_MODE: Record<Difficulty, MatchMode> = {
    facile: MatchMode.AI_EASY,
    moyen: MatchMode.AI_MEDIUM,
    difficile: MatchMode.AI_HARD,
};

const WIN_CATEGORY: Record<MatchMode, WinCategory> = {
    PVP: "winsVsPlayer",
    AI_EASY: "winsVsAiEasy",
    AI_MEDIUM: "winsVsAiMedium",
    AI_HARD: "winsVsAiHard",
};

// Packs granted per win — the "Win this match: N packs" promise shown on the Play screen
// (packsForWin in app/app/play/PlayModeSelector.tsx). Kept in sync by hand: the client only
// displays that number, it never sends it back.
const PACKS_FOR_WIN: Record<MatchMode, number> = {
    AI_EASY: 0,
    AI_MEDIUM: 1,
    AI_HARD: 2,
    PVP: 2,
};

// Card back unlocked by the first win of each mode (indices into app/lib/cardBacks.ts).
const CARD_BACK_FOR_WIN: Record<MatchMode, number> = {
    PVP: 3,
    AI_EASY: 4,
    AI_MEDIUM: 5,
    AI_HARD: 6,
};

/** Standard Elo K-factor: how much one game can move a rating (PvP only). */
export const ELO_K_FACTOR = 32;

/**
 * Elo change of the winner and the loser: the winner gains K × (1 − expected score), the loser
 * loses the same amount. Beating a higher-rated player is worth more than beating a weaker one.
 */
export function eloDeltas(winnerElo: number, loserElo: number): { winner: number; loser: number }
{
    const expectedWinner = 1 / (1 + 10 ** ((loserElo - winnerElo) / 400));
    const delta = Math.round(ELO_K_FACTOR * (1 - expectedWinner));
    return { winner: delta, loser: -delta };
}

export type HumanResult = { userId: number; won: boolean };

/**
 * Records a finished match and returns what each human player earned, keyed by user id.
 *
 * @param mode      PVP or AI_* (the AI seat has no row).
 * @param endReason "hero" (a hero reached 0 HP) or "forfeit" (quit / reconnection timeout).
 * @param humans    One entry per human seat (1 against the AI, 2 in PvP).
 */
export async function recordMatch(mode: MatchMode, endReason: "hero" | "forfeit", humans: HumanResult[]): Promise<Map<number, MatchRewards>>
{
    return prisma.$transaction(async tx =>
    {
        const rewards = new Map<number, MatchRewards>(humans.map(h => [h.userId, { packs: 0, eloChange: 0 }]));

        if (mode === MatchMode.PVP && humans.length === 2)
        {
            const winner = humans.find(h => h.won);
            const loser = humans.find(h => !h.won);
            if (winner && loser)
            {
                const users = await tx.user.findMany({ where: { id: { in: [winner.userId, loser.userId] } }, select: { id: true, elo: true } });
                const eloOf = (id: number) => users.find(u => u.id === id)?.elo ?? 1000;
                const deltas = eloDeltas(eloOf(winner.userId), eloOf(loser.userId));
                rewards.get(winner.userId)!.eloChange = deltas.winner;
                rewards.get(loser.userId)!.eloChange = deltas.loser;
                await tx.user.update({ where: { id: winner.userId }, data: { elo: { increment: deltas.winner } } });
                await tx.user.update({ where: { id: loser.userId }, data: { elo: { increment: deltas.loser } } });
            }
        }

        for (const human of humans.filter(h => h.won))
        {
            const packs = PACKS_FOR_WIN[mode];
            await tx.user.update({
                where: { id: human.userId },
                data: { [WIN_CATEGORY[mode]]: { increment: 1 }, ...(packs > 0 ? { unopenedPacks: { increment: packs } } : {}) },
            });
            rewards.get(human.userId)!.packs = packs;

            // Conditional push: only matches when the back isn't unlocked yet, so it's granted
            // (and announced) exactly once even if two results were recorded at the same time.
            const cardBack = CARD_BACK_FOR_WIN[mode];
            const unlocked = await tx.user.updateMany({
                where: { id: human.userId, NOT: { unlockedCardBacks: { has: cardBack } } },
                data: { unlockedCardBacks: { push: cardBack } },
            });
            if (unlocked.count === 1)
                rewards.get(human.userId)!.cardBackUnlocked = cardBack;
        }

        await tx.match.create({
            data: {
                mode,
                endReason,
                players: { create: humans.map(h => ({ userId: h.userId, won: h.won, eloChange: rewards.get(h.userId)!.eloChange })) },
            },
        });

        return rewards;
    });
}
