import * as fs from 'fs'
import * as path from 'path'
import { MinionCard, Card } from './card'
import { Deck } from './deck'

interface RawCard {
	id:       string
	name:     string
	type:     string
	rarity:   string
	cost:     string
	costNum:  number
	atk:      string
	def:      string
	desc:     string
	qty:      number
	emoji:    string
	color:    string
	legendId: string
}

const COLLECTION_PATH = path.resolve(__dirname, '../../app/prisma/seeds/data/tcg-collection.json')

function parseNum(value: string): number {
	const n = parseInt(value, 10)
	return isNaN(n) ? 0 : n
}

function rawToMinionCard(raw: RawCard): MinionCard {
	return new MinionCard(raw.id, `${raw.emoji} ${raw.name}`, 
		parseNum(raw.cost), raw.desc, 
			parseNum(raw.atk), parseNum(raw.def))
}

export function loadAllCards(): RawCard[] {
	const raw = fs.readFileSync(COLLECTION_PATH, 'utf-8')
	const data = JSON.parse(raw) as { cards: RawCard[] }
	return data.cards
}

// Build a deck from the full collection, respecting qty per card
export function makeCollectionDeck(): Deck {
    const allCards = loadAllCards()

    const legendaries = allCards.filter(c => c.rarity === 'Légendaire')
    const commons     = allCards.filter(c => c.rarity !== 'Légendaire')

    const legend = pickRandom(legendaries)
    const picked = shuffle(commons).slice(0, 20)

    const gameCards: Card[] = [
        rawToMinionCard(legend),
        ...picked.map(rawToMinionCard),
    ]

    return new Deck(gameCards)
}

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle<T>(arr: T[]): T[] {
    const out = [...arr]
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]]
    }
    return out
}

// Build a deck from a specific list of card ids (for player-built decks)
export function makeDeckFromIds(cardIds: string[]): Deck {
	const allCards = loadAllCards()
	const byId = new Map(allCards.map(c => [c.id, c]))
	const gameCards: Card[] = []

	for (const id of cardIds) {
		const raw = byId.get(id)
		if (raw)
			gameCards.push(rawToMinionCard(raw))
	}

	return new Deck(gameCards)
}
