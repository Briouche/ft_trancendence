import { PrismaClient, Prisma } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { MinionCard, SpellCard, Card } from '../card'
import { Deck } from '../deck'
import { legendary } from '../legendary'
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

type CardCatalog = { byId: Map<string, RawCard>; byName: Map<string, RawCard> }

let catalogPromise: Promise<CardCatalog> | null = null
let catalogLoadedAt = 0

const CATALOG_REFRESH_COOLDOWN_MS = 30_000

const SEED_SETTLE_MS = 1500
const SEED_SETTLE_ATTEMPTS = 40

// `prisma db seed` runs in the *app* container as a sequence of per-row upserts, and game_engine
// only waits for the DB to be healthy (docker-compose.yml) — nothing tells it the seed finished.
// So a cold `docker compose up` reliably reads the Card table while it is still filling: observed
// 0 rows on one boot and 39 of 76 on the next. Since the catalog is cached for the process
// lifetime, that snapshot is what every match then builds its decks from.
//
// There's no completion signal to wait on, so infer one: sample the row count until it stops
// growing. Costs one extra COUNT and ~1.5s, paid once per process and absorbed by the boot
// preload in index.ts — no player ever waits for it.
async function waitForSettledCardCount(): Promise<number>
{
    let previous = -1

    for (let attempt = 0; attempt < SEED_SETTLE_ATTEMPTS; attempt++)
    {
        const count = await prisma.card.count()
        if (count > 0 && count === previous)
            return count

        if (previous !== -1 && count !== previous)
            console.log(`Waiting for the card seed to finish (${previous} -> ${count} rows)`)

        previous = count
        await new Promise(resolve => setTimeout(resolve, SEED_SETTLE_MS))
    }

    return previous
}

async function loadCatalog(): Promise<CardCatalog>
{
    // An empty Card table is never a legitimate state for a running game, so don't cache it —
    // throwing clears the memo (see ensureCatalogLoaded) and the next caller retries, rather than
    // leaving the process building empty decks for the rest of its life.
    if (await waitForSettledCardCount() === 0)
        throw new Error("Card table is empty — the seed has not run yet")

    const rows = await prisma.card.findMany({ select: CARD_SELECT })
    if (rows.length === 0)
        throw new Error("Card table is empty — the seed has not run yet")

    console.log(`Card catalog loaded: ${rows.length} cards`)
    catalogLoadedAt = Date.now()
    return {
        byId:   new Map(rows.map(c => [c.id, c])),
        byName: new Map(rows.map(c => [c.name, c])),
    }
}

// The seed upserts cards one row at a time, so a read can also land *mid*-seed and cache a
// partial snapshot (and re-seeding a running stack leaves the cache stale the same way). A lookup
// miss is the only signal available for that, so re-read once when one happens — rate-limited,
// because the genuine name typos in aiDecks.ts miss on every single solo match and must not turn
// into an extra query per match start.
async function catalogFor(keys: string[], pick: (c: CardCatalog) => Map<string, RawCard>): Promise<Map<string, RawCard>>
{
    let map = pick(await ensureCatalogLoaded())

    if (keys.every(k => map.has(k)) || Date.now() - catalogLoadedAt < CATALOG_REFRESH_COOLDOWN_MS)
        return map

    console.warn("Card catalog lookup miss — re-reading it in case the cached snapshot is stale")
    catalogPromise = null
    try
    {
        map = pick(await ensureCatalogLoaded())
    }
    catch (err)
    {
        // Keep serving the snapshot we already have rather than failing the match outright.
        console.error("Card catalog refresh failed:", err)
    }
    return map
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
    const byId = await catalogFor(cardIds, c => c.byId)

    const gameCards: Card[] = []
    let counter = 0
    for (const id of cardIds)
    {
        const raw = byId.get(id)
        if (raw)
            gameCards.push(rawToCard(raw, playerPrefix, `_${counter++}`))
        else
            console.warn(`makeDeckFromIds: no card with id "${id}" in the catalog`)
    }

    return new Deck(gameCards)
}

// Deck from card names (AI decks, aiDecks.ts); no ownership check.
export async function makeDeckFromNames(cardNames: string[], playerPrefix = ""): Promise<Deck>
{
    const byName = await catalogFor(cardNames, c => c.byName)

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

    const built = await makeDeckFromIds(cardIds, playerPrefix)

    // The DeckCard rows exist but none of them resolved against the catalog — starting the match
    // anyway would put the player on a board with no cards at all and no way to act. Returning
    // null makes serverSocket.ts reject with "Deck introuvable ou vide." instead.
    if (built.size() === 0)
    {
        console.error(`Deck ${deckId} resolved to 0 playable cards — catalog out of sync with the DB?`)
        return null
    }

    return built
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
