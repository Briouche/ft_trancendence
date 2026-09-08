import { PrismaClient, Keyword } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { EffectSpec } from '../../gameEngine/srcs/cardImport/effectFactory'

interface RawCard
{
	id:       string
	assetKey: string
	artist?:  string
	name:     string
	type:     string
	rarity:   string
	cost:     string
	atk:      string
	def:      string
	desc:     string
	qty:      number
	legendId: string

	taunt?: boolean
	rush?:  boolean
	cannotAttack?: boolean
	archi?: boolean
	spellpower?: number

	battlecry?:         EffectSpec
	deathrattle?:       EffectSpec
	onAttack?:          EffectSpec
	onDamage?:          EffectSpec
	startOfTurnEffect?: EffectSpec
	endOfTurnEffect?:   EffectSpec
	spellEffect?:       EffectSpec
	keywords?: string[]
}

// Labels as written in the JSON -> Prisma enum value
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

export async function seedCards(prisma: PrismaClient)
{
	const jsonPath = path.resolve(__dirname, './data/tcg-collection.json')
	const raw = fs.readFileSync(jsonPath, 'utf-8')
	const data = JSON.parse(raw) as { cards: RawCard[] }

	console.log(`🃏 Seeding ${data.cards.length} cards...`)

	for (const card of data.cards)
	{
		const shared = {
			name:      card.name,
			type:      card.type   ?? '',
			rarity:    card.rarity,
			cost:      card.cost ?? 0,
			atk:       card.atk,
			def:       card.def,
			desc:      card.desc,
			qty:       card.qty    ?? 1,
			legendId:  card.legendId ?? '',
			assetKey:  card.assetKey,
			artist:    card.artist,

			taunt: card.taunt,
			rush:  card.rush,
			cannotAttack: card.cannotAttack,
			archi: card.archi,
			spellpower: card.spellpower,

			battlecry:         card.battlecry,
			deathrattle:       card.deathrattle,
			onAttack:          card.onAttack,
			onDamage:          card.onDamage,
			startOfTurnEffect: card.startOfTurnEffect,
			endOfTurnEffect:   card.endOfTurnEffect,
			spellEffect:       card.spellEffect,

			keywords: parseKeywords(card.keywords, card.id),
		}

		await prisma.card.upsert(
		{
			where:  { id: card.id },
			update: shared,
			create: { id: card.id, ...shared },
		})
	}

	console.log('✅ Cards successfully seeded.')

	// upsert() above never deletes, so a card removed from the JSON would otherwise stay in the
	// DB indefinitely. This syncs the deletion — UserCard/DeckCard first (Card has no
	// onDelete: Cascade), then Card. Guard against an empty JSON: `notIn: []` would match every
	// row and wipe the table.
	const validIds = data.cards.map(c => c.id)
	if (validIds.length > 0) {
		const staleCount = await prisma.card.count({ where: { id: { notIn: validIds } } })

		if (staleCount > 0) {
			await prisma.userCard.deleteMany({ where: { cardId: { notIn: validIds } } })
			await prisma.deckCard.deleteMany({ where: { cardId: { notIn: validIds } } })
			await prisma.card.deleteMany({ where: { id: { notIn: validIds } } })
			console.log(`🧹 Removed ${staleCount} stale card(s) no longer in tcg-collection.json.`)
		}
	}
}
