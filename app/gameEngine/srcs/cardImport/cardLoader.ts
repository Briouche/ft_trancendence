import { PrismaClient, Prisma } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { MinionCard, SpellCard, Card } from '../card'
import { Deck } from '../deck'
import { legendary } from '../legendary'
import { lifestealEffect } from '../effect'
import { ARCHIMEDE_ID, BATTLECRY_OVERRIDES, DEATHRATTLE_OVERRIDES, SPELL_EFFECT_OVERRIDES, NoOpEffect } from './keywordEffects'
import { buildEffect, EffectSpec } from './effectFactory'

const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000, max: 15, idleTimeoutMillis: 60000 })
const adapter = new PrismaPg(pool)
export const prisma = new PrismaClient({ adapter })

const CARD_SELECT = {
    id: true, assetKey: true, name: true, type: true, rarity: true, cost: true, atk: true,
    def: true, desc: true, legendId: true, taunt: true, rush: true, cannotAttack: true,
    archi: true, spellpower: true, battlecry: true, deathrattle: true, onAttack: true,
    onDamage: true, startOfTurnEffect: true, endOfTurnEffect: true, spellEffect: true,
    keywords: true,
} as const

export type RawCard = Prisma.CardGetPayload<{ select: typeof CARD_SELECT }>

const LEGENDARY_PASSIVES: legendary[] = ["jeffe", "timmy", "archimede", "freddy", "roidesrats", "gertrude"]

function resolveLegendaryPassive(legendId: string): legendary | undefined
{
    return LEGENDARY_PASSIVES.find(l => l === legendId)
}

function safeNumber(value: string): number
{
    const n = Number(value)
    return Number.isNaN(n) ? 0 : n
}

export function rawToMinionCard(raw: RawCard, playerPrefix = "", suffix = ""): MinionCard
{
    const keywords = raw.keywords ?? []

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
			onDamage:			buildEffect(raw.onDamage as EffectSpec | null),
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

        else
        return rawToMinionCard(raw, playerPrefix, suffix)
}

type CardCatalog = { byId: Map<string, RawCard>; byName: Map<string, RawCard> }

let catalogPromise: Promise<CardCatalog> | null = null

async function loadCatalog(): Promise<CardCatalog>
{
    const rows = await prisma.card.findMany({ select: CARD_SELECT })
    console.log(`Card catalog loaded: ${rows.length} cards`)
    return {
        byId:   new Map(rows.map(c => [c.id, c])),
        byName: new Map(rows.map(c => [c.name, c])),
    }
}

// The card catalog is content data (~76 rows) that only changes on a re-seed, so it's loaded once
// per process instead of being re-queried on every match start — see index.ts, which kicks this
// off at boot so it's warm before the first player arrives (and doubles as the Prisma warm-up).
// Memoized the same way as ensureCardFontLoaded in app/game/objects/gameFonts.ts: concurrent
// callers share one in-flight load, and a failure clears the memo so the next call retries rather
// than leaving the process permanently unable to start a game.
// Caveat: re-seeding while this process is running leaves the cache stale until it restarts.
export function ensureCatalogLoaded(): Promise<CardCatalog>
{
    if (!catalogPromise)
    {
        catalogPromise = loadCatalog().catch(err =>
        {
            catalogPromise = null
            throw err
        })
    }
    return catalogPromise
}

// Build a deck from a specific list of card ids (for player-built decks later)
export async function makeDeckFromIds(cardIds: string[], playerPrefix = ""): Promise<Deck>
{
    const { byId } = await ensureCatalogLoaded()

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

// Build a deck from a flat list of card NAMES (aiDecks.ts) instead of ids — AI decks
export async function makeDeckFromNames(cardNames: string[], playerPrefix = ""): Promise<Deck>
{
    const { byName } = await ensureCatalogLoaded()

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

// Build a deck from a player's saved Deck
export async function makeDeckFromDeckId(deckId: number, ownerId: number, playerPrefix = ""): Promise<Deck | null>
{
    // Prisma loads the `cards` relation with a second SELECT rather than a join (its
    // relationLoadStrategy option isn't available under the pg driver adapter), so this is 2 round
    // trips — still the only DB work left on the match-start path now that cards come from memory.
    const deck = await prisma.deck.findUnique({
        where: { id: deckId },
        select: { userId: true, cards: { select: { cardId: true, qty: true } } },
    })

    if (!deck || deck.cards.length === 0)
        return null

    if (deck.userId !== ownerId)
    {
        console.warn(`Deck ${deckId} requested by user ${ownerId} but owned by ${deck.userId} — rejected`)
        return null
    }

    const cardIds: string[] = []
    for (const dc of deck.cards)
        for (let i = 0; i < dc.qty; i++)
            cardIds.push(dc.cardId)

    return makeDeckFromIds(cardIds, playerPrefix)
}

export type WinCategory = 'winsVsAiEasy' | 'winsVsAiMedium' | 'winsVsAiHard' | 'winsVsPlayer'


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
