import { PrismaClient, Card as DbCard } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { MinionCard, SpellCard, Card } from '../card'
import { Deck } from '../deck'
import { legendary } from '../legendary'
import { buildEffect, EffectSpec } from './effectFactory'

// DB access of the game server: builds engine cards/decks from Card rows, records results.

const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export type RawCard = DbCard

const LEGENDARY_PASSIVES: legendary[] = ["jeffe", "timmy", "archimede", "freddy", "roidesrats", "gertrude"]

// legendId is the passive name on a legendary card; on other cards it's a family reference.
function resolveLegendaryPassive(legendId: string): legendary | undefined
{
    return LEGENDARY_PASSIVES.find(l => l === legendId)
}

// cost/atk/def are strings in the DB; "X" becomes 0.
function safeNumber(value: string): number
{
    const n = Number(value)
    return Number.isNaN(n) ? 0 : n
}

export function rawToMinionCard(raw: RawCard, playerPrefix = "", suffix = ""): MinionCard
{
    return new MinionCard(
        `${playerPrefix}${raw.id}${suffix}`,
        raw.name,
        safeNumber(raw.cost),
        raw.desc,
        safeNumber(raw.atk),
        safeNumber(raw.def),
        {
            taunt: raw.taunt ?? undefined,
            rush: raw.rush ?? undefined,
            cannotAttack: raw.cannotAttack ?? undefined,
            archi: raw.archi ?? undefined,
            spellpower: raw.spellpower ?? undefined,
            battlecry:          buildEffect(raw.battlecry as EffectSpec | null),
            deathrattle:        buildEffect(raw.deathrattle as EffectSpec | null),
            onAttack:           buildEffect(raw.onAttack as EffectSpec | null),
            onDamage:           buildEffect(raw.onDamage as EffectSpec | null),
            startOfTurnEffect:  buildEffect(raw.startOfTurnEffect as EffectSpec | null),
            endOfTurnEffect:    buildEffect(raw.endOfTurnEffect as EffectSpec | null)
        },
        resolveLegendaryPassive(raw.legendId),
        raw.assetKey,
        undefined, undefined,
        raw.rarity,
    )
}

function rawToCard(raw: RawCard, playerPrefix = "", suffix = ""): Card
{
    if (raw.type === "sort")
    {
        return new SpellCard(
            `${playerPrefix}${raw.id}${suffix}`,
            raw.name,
            +raw.cost,
            raw.desc,
            buildEffect(raw.spellEffect as EffectSpec | null)!,
            resolveLegendaryPassive(raw.legendId),
            raw.assetKey,
            raw.rarity
        )
    }
    return rawToMinionCard(raw, playerPrefix, suffix)
}

// One game card per id occurrence; the counter suffix keeps duplicate copies distinct.
async function makeDeckFromIds(cardIds: string[], playerPrefix = ""): Promise<Deck>
{
    const rows = await prisma.card.findMany({ where: { id: { in: cardIds } } })
    const byId = new Map(rows.map(c => [c.id, c]))

    const gameCards: Card[] = []
    let counter = 0
    for (const id of cardIds)
    {
        const raw = byId.get(id)
        if (raw)
            gameCards.push(rawToCard(raw, playerPrefix, `_${counter++}`))
    }

    return new Deck(gameCards)
}

// Deck from card names (AI decks, aiDecks.ts); no ownership check.
export async function makeDeckFromNames(cardNames: string[], playerPrefix = ""): Promise<Deck>
{
    const rows = await prisma.card.findMany({ where: { name: { in: cardNames } } })
    const byName = new Map(rows.map(c => [c.name, c]))

    const gameCards: Card[] = []
    let counter = 0
    for (const name of cardNames)
    {
        const raw = byName.get(name)
        if (raw)
            gameCards.push(rawToCard(raw, playerPrefix, `_${counter++}`))
        else
            console.warn(`makeDeckFromNames: no card named "${name}" (typo in aiDecks.ts?)`)
    }

    return new Deck(gameCards)
}

// Deck from a saved player deck (DeckCard rows with qty). Null when missing or empty.
export async function makeDeckFromDeckId(deckId: number, playerPrefix = ""): Promise<Deck | null>
{
    const deckCards = await prisma.deckCard.findMany({ where: { deckId } })
    if (deckCards.length === 0)
        return null

    const cardIds: string[] = []
    for (const dc of deckCards)
        for (let i = 0; i < dc.qty; i++)
            cardIds.push(dc.cardId)

    return makeDeckFromIds(cardIds, playerPrefix)
}

export async function getUsernameForDeck(deckId: number): Promise<string | null>
{
    const deck = await prisma.deck.findUnique({ where: { id: deckId }, select: { user: { select: { username: true } } } })
    return deck?.user.username ?? null
}

export async function getUserIdForDeck(deckId: number): Promise<number | null>
{
    const deck = await prisma.deck.findUnique({ where: { id: deckId }, select: { userId: true } })
    return deck?.userId ?? null
}

export type WinCategory = 'winsVsAiEasy' | 'winsVsAiMedium' | 'winsVsAiHard' | 'winsVsPlayer'

// Card back unlocked by the first win of each category (see app/lib/cardBacks.ts).
const WIN_CATEGORY_CARD_BACK: Record<WinCategory, number> = {
    winsVsPlayer:   3,
    winsVsAiEasy:   4,
    winsVsAiMedium: 5,
    winsVsAiHard:   6,
}

export async function recordWin(userId: number, category: WinCategory): Promise<void>
{
    await prisma.user.update({ where: { id: userId }, data: { [category]: { increment: 1 } } })
    await unlockCardBackIfNeeded(userId, WIN_CATEGORY_CARD_BACK[category])
}

async function unlockCardBackIfNeeded(userId: number, index: number): Promise<void>
{
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { unlockedCardBacks: true } })
    if (!user || user.unlockedCardBacks.includes(index))
        return
    await prisma.user.update({ where: { id: userId }, data: { unlockedCardBacks: { set: [...user.unlockedCardBacks, index] } } })
}

// Standard Elo update, K = 32. PvP only.
const ELO_K_FACTOR = 32

export async function recordEloUpdate(winnerId: number, loserId: number): Promise<void>
{
    const [winner, loser] = await Promise.all([
        prisma.user.findUnique({ where: { id: winnerId }, select: { elo: true } }),
        prisma.user.findUnique({ where: { id: loserId }, select: { elo: true } }),
    ])
    if (!winner || !loser)
        return

    const expectedWinner = 1 / (1 + 10 ** ((loser.elo - winner.elo) / 400))
    const winnerDelta = Math.round(ELO_K_FACTOR * (1 - expectedWinner))
    const loserDelta = Math.round(ELO_K_FACTOR * (0 - (1 - expectedWinner)))

    await prisma.$transaction([
        prisma.user.update({ where: { id: winnerId }, data: { elo: { increment: winnerDelta } } }),
        prisma.user.update({ where: { id: loserId }, data: { elo: { increment: loserDelta } } }),
    ])
}
