import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { EffectSpec } from '../../gameEngine/srcs/cardImport/effectFactory'

interface RawCard
{
	id:       string
	assetKey: string
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

	taunt?: boolean
	rush?:  boolean
	archi?: boolean

	battlecry?:         EffectSpec
	deathrattle?:       EffectSpec
	onAttack?:          EffectSpec
	onDamage?:          EffectSpec
	startOfTurnEffect?: EffectSpec
	endOfTurnEffect?:   EffectSpec
	spellEffect?:       EffectSpec
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
			emoji:     card.emoji  ?? '',
			color:     card.color  ?? '',
			legendId:  card.legendId ?? '',
			assetKey:  card.assetKey,

			taunt: card.taunt,
			rush:  card.rush,
			archi: card.archi,

			battlecry:         card.battlecry,
			deathrattle:       card.deathrattle,
			onAttack:          card.onAttack,
			onDamage:          card.onDamage,
			startOfTurnEffect: card.startOfTurnEffect,
			endOfTurnEffect:   card.endOfTurnEffect,
			spellEffect:       card.spellEffect
		}

		await prisma.card.upsert(
		{
			where:  { id: card.id },
			update: shared,
			create: { id: card.id, ...shared },
		})
	}

	console.log('✅ Cards successfully seeded.')
}
