import { PrismaClient, Card as DbCard } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { MinionCard, SpellCard, Card } from '../card'
import { Deck } from '../deck'
import { legendary } from '../legendary'
import { lifestealEffect } from '../effect'
import { ARCHIMEDE_ID, BATTLECRY_OVERRIDES, DEATHRATTLE_OVERRIDES, SPELL_EFFECT_OVERRIDES, NoOpEffect } from './keywordEffects'
import { buildEffect, EffectSpec } from './effectFactory'

const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export type RawCard = DbCard

const LEGENDARY_PASSIVES: legendary[] = ["jeffe", "timmy", "archimede", "freddy", "roidesrats", "gertrude"]

// legendId doubles as the legendaryPassive slot for a legendary card itself (e.g. "timmy"),
// while on non-legendary cards it's a family-grouping reference to another card's id (e.g. the
// "(archi card)" creatures point at Archimed's own id, see ARCHIMEDE_ID in keywordEffects.ts) —
// only recognize it as a passive when it's one of the implemented legendary types.
function resolveLegendaryPassive(legendId: string): legendary | undefined
{
    return LEGENDARY_PASSIVES.find(l => l === legendId)
}

// cost/atk/def sont des String en base (voir schema.prisma) — normalement numériques, sauf pour
// les rares cartes à coût/stats variables ("X", pas encore scriptées ici). Number("") vaut déjà
// 0 (pas NaN), donc les champs vides des sorts (pas d'atk/def) passent tels quels ; seul "X" a
// besoin de ce filet, sinon NaN se propage dans tout le moteur (mana >= NaN est toujours faux :
// carte injouable en silence plutôt qu'une vraie erreur).
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

export async function loadAllCards(): Promise<RawCard[]>
{
    return prisma.card.findMany()
}

// Build a deck from the full collection: 1 legendary + 20 random commons = 21
export async function makeCollectionDeck(playerPrefix = ""): Promise<Deck>
{
    const allCards = await loadAllCards()

    const legendaries = allCards.filter(c => c.rarity === 'Légendaire')
    const commons     = allCards.filter(c => c.rarity !== 'Légendaire')

    const legend = pickRandom(legendaries)
    const picked = shuffle(commons).slice(0, 20)

    // Every card built for a player's deck gets a unique, incrementing postfix on top of the
    // player prefix — otherwise two copies of the same card (or, here, an unlucky reshuffle)
    // would collide on id, since rawToCard/rawToMinionCard build it deterministically from
    // playerPrefix + raw.id alone.
    let counter = 0
    const gameCards: Card[] = [
        rawToCard(legend, playerPrefix, `_${counter++}`),
        ...picked.map(c => rawToCard(c, playerPrefix, `_${counter++}`)),
    ]

    return new Deck(gameCards)
}

// Build a deck from a specific list of card ids (for player-built decks later)
export async function makeDeckFromIds(cardIds: string[], playerPrefix = ""): Promise<Deck>
{
    const rows = await prisma.card.findMany({ where: { id: { in: cardIds } } })
    const byId = new Map(rows.map(c => [c.id, c]))

    // Duplicate copies of the same card share the same `id` occurrence here, so a plain
    // playerPrefix isn't enough to keep them distinct within one deck (findIndex/Map lookups by
    // card id would then silently collide) — the per-card counter guarantees uniqueness even
    // when the same card appears more than once.
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

// Build a deck from a flat list of card NAMES (aiDecks.ts) instead of ids — lets the AI's decks
// live as plain, hand-editable text in code, with no Deck/DeckCard rows and no ownership check
// (the human player doesn't need to own — or even have unlocked — any of these cards). A name
// repeated twice in the list yields two copies, same convention as makeDeckFromIds below.
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

// Build a deck from a player's saved Deck (deck builder) — DeckCard only stores one row per
// card id with a qty, so a card added twice needs to appear twice in the flat id list handed to
// makeDeckFromIds (which draws one game Card per id occurrence). Returns null for a deck that
// doesn't exist (deleted between selection and match start) or was saved empty, so the caller
// can reject the match instead of silently starting one with zero cards.
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

function pickRandom<T>(arr: T[]): T
{
    return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle<T>(arr: T[]): T[]
{
    const out = [...arr]
    for (let i = out.length - 1; i > 0; i--)
    {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]]
    }
    return out
}
