import { Card, SpellCard, MinionCard } from "./card";
import { makeCollectionDeck } from "./cardLoader";
import { AddEffectfEffect, BuffEffect, CombinedEffect, DamageEffect, DrawCardEffect, HealEffect, RandomMissileEffect, SummonMinionEffect } from "./effect";
import { AllCharactersResolver, AlliedMinionsResolver, AllMinionsResolver, AnyCharacterResolver, NeighboringMinionsResolver, OtherAlliedMinionsResolver, RandomEnemyResolver } from "./target";

export class Deck
{
    private cards: Card[];

    constructor(cards: Card[] = [])
    {
        this.cards = [...cards];
    }

    shuffle(): void
    {
        // Fisher-Yates: walk backwards and swap each card with a random earlier card
        for (let i = this.cards.length - 1; i > 0; i--)
        {
            const j: number = Math.floor(Math.random() * (i + 1));
            const temp: Card = this.cards[i];
            this.cards[i]    = this.cards[j];
            this.cards[j]    = temp;
        }
    }

    draw(): Card | null
    {
        if (this.cards.length === 0)
            return null;
        return this.cards.pop()!;
    }

    size(): number
    {
        return this.cards.length;
    }

    isEmpty(): boolean
    {
        return this.cards.length === 0;
    }
}

export function makeBasicDeck(player: string): Deck
{
    return new Deck ([
        new MinionCard(player + "18", "Flagbearer", 3, "whenever this attacks, buff its neighbors by 1/1", 3, 3, { onAttack: new BuffEffect(1, 1, new NeighboringMinionsResolver()) }),
        new MinionCard(player + "17", "lantern", 2, "at the start of your turn, draw 1 card", 0, 4, { startOfTurnEffect: new DrawCardEffect(1) }),
        new MinionCard(player + "0", "Ragnaros", 3, "at the end of your turn deal 4 damage to a random enemy", 2, 2, { endOfTurnEffect: new RandomMissileEffect(1, 4, new RandomEnemyResolver()) }),
        new MinionCard(player + "1", "DrawingWisp",  0, "battlecry: draw 1.",     1, 1, { battlecry: new DrawCardEffect(1) }),
        new MinionCard(player + "2", "Rushy River Croc",   2, "Snappy.", 2, 3, {rush: true, taunt: true}),
        new MinionCard(player + "3", "TauntMurloc", 1, "Taunt", 2, 2, {taunt: true}),
        new MinionCard(player + "5", "gros Thon poli", 3, "heal 2hp", 4, 5, {taunt: true, battlecry: new HealEffect(2, new AnyCharacterResolver())}),
        new MinionCard(player + "6", "Argus", 2, "buff neighbors +1/+1 taunt", 2, 2,
            {battlecry: new CombinedEffect([new BuffEffect(1, 1, new NeighboringMinionsResolver()), new AddEffectfEffect(true, "taunt", new NeighboringMinionsResolver())])}),
        new MinionCard(player + "7", "Mother Spider", 2, "deathrattle: summon 2 1/1 spider baby's", 1, 1, 
            {deathrattle: new SummonMinionEffect( [new MinionCard(player + "7.1", "baby spider", 0, "small and spidery", 1, 1), new MinionCard(player + "7.2", "baby spider", 0, "small and spidery", 1, 1)], 2)}),
        new MinionCard(player + "10", "GoblinFeeder", 3, "gives all friendly minions +1/+1", 2, 2, {battlecry: new BuffEffect(1, 1, new OtherAlliedMinionsResolver())}),
        new MinionCard(player + "11", "pyroblin", 3, "battlecry: deal 3 damage", 2, 2, {battlecry: new DamageEffect(3, new AnyCharacterResolver())}),
        new MinionCard(player + "12", "sousChef braillard", 3, "Deal 1 to all", 2, 3, {battlecry: new DamageEffect(1, new AllMinionsResolver())}),
        new SpellCard(player + "13", "ping", 1, "deals 1 damage", new DamageEffect(1, new AnyCharacterResolver())),
        new SpellCard(player + "14", "Lecture de texte anciens", 3, "pioche 2 cartes", new DrawCardEffect(2)),
        new SpellCard(player + "16", "Arcane missiles", 1, "Deal 1 damage to 3 random enemies", new RandomMissileEffect(3, 1, new RandomEnemyResolver()))
    ]);
}
