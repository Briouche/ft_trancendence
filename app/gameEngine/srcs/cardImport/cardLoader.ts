import { PrismaClient, Card as DbCard } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { MinionCard, SpellCard, Card } from '../card'
import { Deck } from '../deck'
import { legendary } from '../legendary'
import { lifestealEffect } from '../effect'
import { ARCHIMEDE_ID, BATTLECRY_OVERRIDES, DEATHRATTLE_OVERRIDES, SPELL_EFFECT_OVERRIDES, NoOpEffect } from './keywordEffects'

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

export function rawToMinionCard(raw: RawCard, playerPrefix = ""): MinionCard
{
    const name = raw.emoji ? `${raw.emoji} ${raw.name}` : raw.name
    const keywords = raw.keywords ?? []

    return new MinionCard(
        `${playerPrefix}${raw.id}`,
        name,
        safeNumber(raw.cost),
        raw.desc,
        safeNumber(raw.atk),
        safeNumber(raw.def),
        {
            taunt: raw.taunt ?? undefined,
            rush: raw.rush ?? undefined,
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
    )
}

function rawToCard(raw: RawCard, playerPrefix = ""): Card
{
    if (raw.type === "Spell")
    {
        const name = raw.emoji ? `${raw.emoji} ${raw.name}` : raw.name
        return new SpellCard(
            `${playerPrefix}${raw.id}`,
            name,
            safeNumber(raw.cost),
            raw.desc,
            SPELL_EFFECT_OVERRIDES[raw.id]?.() ?? new NoOpEffect(),
            resolveLegendaryPassive(raw.legendId),
        )
    }

    return rawToMinionCard(raw, playerPrefix)
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

    const gameCards: Card[] = [
        rawToCard(legend, playerPrefix),
        ...picked.map(c => rawToCard(c, playerPrefix)),
    ]

    return new Deck(gameCards)
}

// Build a deck from a specific list of card ids (for player-built decks later)
export async function makeDeckFromIds(cardIds: string[], playerPrefix = ""): Promise<Deck>
{
    const rows = await prisma.card.findMany({ where: { id: { in: cardIds } } })
    const byId = new Map(rows.map(c => [c.id, c]))

    const gameCards: Card[] = []
    for (const id of cardIds)
    {
        const raw = byId.get(id)
        if (raw)
            gameCards.push(rawToCard(raw, playerPrefix))
    }

    return new Deck(gameCards)
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
