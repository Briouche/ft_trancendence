import { Card, MinionCard, SpellCard } from "./card";
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

export function makeBasicDeck() : Deck
{
    return new Deck ([
        new MinionCard("DrawingWisp",  0, "battlecry: draw 1.",     1, 1, { battlecry: new DrawCardEffect(1) }),
        new MinionCard("Rushy River Croc",   2, "Snappy.", 2, 3, {rush: true, taunt: true}),
        new MinionCard("TauntMurloc", 1, "Taunt", 2, 2, {taunt: true}),
        new MinionCard("TauntMurloc", 1, "Taunt", 2, 2, {taunt: true}),
        new MinionCard("gros Thon poli", 3, "heal 2hp", 4, 5, {taunt: true, battlecry: new HealEffect(2, new AnyCharacterResolver())}),
        new MinionCard("Argus", 2, "buff neighbors +1/+1 taunt", 2, 2,
            {battlecry: new CombinedEffect([new BuffEffect(1, 1, new NeighboringMinionsResolver()), new AddEffectfEffect(true, "taunt", new NeighboringMinionsResolver())])}),
        new MinionCard("Mother Spider", 2, "deathrattle: summon 2 1/1 spider baby's", 1, 1, 
            {deathrattle: new SummonMinionEffect( [new MinionCard("baby spider", 0, "small and spidery", 1, 1), new MinionCard("baby spider", 0, "small and spidery", 1, 1)], 2)}),
        new MinionCard("Mother Spider", 2, "deathrattle: summon 2 1/1 spider baby's", 1, 1, 
            {deathrattle: new SummonMinionEffect( [new MinionCard("baby spider", 0, "small and spidery", 1, 1), new MinionCard("baby spider", 0, "small and spidery", 1, 1)], 2)}),
        new MinionCard("GoblinFeeder", 3, "gives all friendly minions +1/+1", 2, 2, {battlecry: new BuffEffect(1, 1, new AlliedMinionsResolver())}),
        new MinionCard("GoblinFeeder", 3, "gives all friendly minions +1/+1", 2, 2, {battlecry: new BuffEffect(1, 1, new OtherAlliedMinionsResolver())}),
        new MinionCard("pyroblin", 3, "battlecry: deal 3 damage", 2, 2, {battlecry: new DamageEffect(3, new AnyCharacterResolver())}),
        new MinionCard("sousChef braillard", 3, "Deal 1 to all", 2, 3, {battlecry: new DamageEffect(1, new AllMinionsResolver())}),
        new SpellCard("ping", 1, "deals 1 damage", new DamageEffect(1, new AnyCharacterResolver())),
        new SpellCard("Lecture de texte anciens", 3, "pioche 2 cartes", new DrawCardEffect(2)),
        new SpellCard("Arcane missiles", 1, "Deal 2 damage to 3 random enemies", new RandomMissileEffect(3, 2, new RandomEnemyResolver())),
        new SpellCard("Arcane missiles", 1, "Deal 2 damage to 3 random enemies", new RandomMissileEffect(3, 2, new RandomEnemyResolver()))
    ]);
}
