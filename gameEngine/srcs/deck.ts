import { Card, MinionCard, SpellCard } from "./card";
import { DamageEffect, DrawCardEffect } from "./effect";
import { AnyCharacterResolver } from "./target";

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
        new MinionCard("Murloc",       1, "Deathrattle: draw 2.",   2, 1, { deathrattle: new DrawCardEffect(2) }),
        new MinionCard("Rushy River Croc",   2, "Snappy.", 2, 3, {rush: true}),
        new MinionCard("TauntMurloc", 1, "Taunt", 2, 2, {taunt: true}),
        new MinionCard("TauntMurloc", 1, "Taunt", 2, 2, {taunt: true}),
        new MinionCard("pyroblin", 3, "battlecry: deal 3 damage", 2, 2, {battlecry: new DamageEffect(3, new AnyCharacterResolver())}),
        new SpellCard("ping", 1, "deals 1 damage", new DamageEffect(1, new AnyCharacterResolver())),
        new SpellCard("ping", 1, "deals 1 damage", new DamageEffect(1, new AnyCharacterResolver())),
        new SpellCard("Lecture de texte anciens", 3, "pioche 2 cartes", new DrawCardEffect(2))
    ]);
}
