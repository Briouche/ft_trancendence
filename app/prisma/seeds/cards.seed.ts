import { PrismaClient } from '@prisma/client'
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
}

export async function seedCards(prisma: PrismaClient) {
	const jsonPath = path.resolve(__dirname, './data/tcg-collection.json')
	const raw = fs.readFileSync(jsonPath, 'utf-8')
	const data = JSON.parse(raw) as { cards: RawCard[] }

	console.log(`🃏 Seeding ${data.cards.length} cards...`)

	for (const card of data.cards) {
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
			},
		})
	}

	console.log('✅ Cards successfully seeded.')
}
