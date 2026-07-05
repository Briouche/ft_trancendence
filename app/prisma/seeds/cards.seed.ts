import { PrismaClient, Keyword } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

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
	keywords?: string[]
}

// Libellés tels qu'écrits dans le JSON -> valeur d'enum Prisma
const KEYWORD_LABELS: Record<string, Keyword> = {
	'Ruée':             Keyword.RUEE,
	"Râle d'agonie":    Keyword.RALE_DAGONIE,
	'Cri de guerre':    Keyword.CRI_DE_GUERRE,
	'Régénération':     Keyword.REGENERATION,
	'Aventurier':       Keyword.AVENTURIER,
	'Taunt':            Keyword.TAUNT,
	'Soigné':           Keyword.SOIGNE,
	'Vol de vie':       Keyword.VOL_DE_VIE,
	'Silence':          Keyword.SILENCE,
}

function parseKeywords(raw: string[] | undefined, cardId: string): Keyword[] {
	if (!raw) return []
	return raw.map(label => {
		const keyword = KEYWORD_LABELS[label]
		if (!keyword) throw new Error(`Mot-clé inconnu "${label}" sur la carte ${cardId}`)
		return keyword
	})
}

export async function seedCards(prisma: PrismaClient) {
	const jsonPath = path.resolve(__dirname, './data/tcg-collection.json')
	const raw = fs.readFileSync(jsonPath, 'utf-8')
	const data = JSON.parse(raw) as { cards: RawCard[] }

	console.log(`🃏 Seeding ${data.cards.length} cards...`)

	for (const card of data.cards) {
		const keywords = parseKeywords(card.keywords, card.id)

		await prisma.card.upsert({
			where:  { id: card.id },
			update: {
				name:     card.name,
				type:     card.type     ?? '',
				rarity:   card.rarity,
				cost:     card.cost,
				costNum:  card.costNum  ?? 0,
				atk:      card.atk,
				def:      card.def,
				desc:     card.desc,
				qty:      card.qty      ?? 1,
				emoji:    card.emoji    ?? '',
				color:    card.color    ?? '',
				legendId: card.legendId ?? '',
				keywords,
			},
			create: {
				id:       card.id,
				name:     card.name,
				type:     card.type     ?? '',
				rarity:   card.rarity,
				cost:     card.cost,
				costNum:  card.costNum  ?? 0,
				atk:      card.atk,
				def:      card.def,
				desc:     card.desc,
				qty:      card.qty      ?? 1,
				emoji:    card.emoji    ?? '',
				color:    card.color    ?? '',
				legendId: card.legendId ?? '',
				keywords,
			},
		})
	}

	console.log('✅ Cards successfully seeded.')
}
