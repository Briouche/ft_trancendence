import { Card, MinionCard, SpellCard } from "./card";
import { DrawCardEffect } from "./effect";

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
        new MinionCard("DrawingWisp",  0, "battlecry: draw 1.",     1, 1,
                        { battlecry: new DrawCardEffect(1) }),
        new MinionCard("Murloc",       1, "Deathrattle: draw 2.",   2, 1,
                        { deathrattle: new DrawCardEffect(2) }),
        new MinionCard("River Croc",   2, "Snappy.",                2, 3),
        new MinionCard("Orc Warrior",  3, "For the Horde!",         3, 4),
        new MinionCard("Tauren",       4, "Big and sturdy.",        2, 7),
        new MinionCard("Stone Golem",  5, "Slow but sturdy.",       4, 8),
        new MinionCard("Fire Drake",   6, "Breathes fire.",         6, 5),
        new MinionCard("Wisp",         0, "A 1/1 for free.",        1, 1),
        new MinionCard("Murloc",       1, "Slippery.",              2, 1),
        new MinionCard("River Croc",   2, "Snappy.",                2, 3),
        new MinionCard("Orc Warrior",  3, "For the Horde!",         3, 4),
        new MinionCard("Tauren",       4, "Big and sturdy.",        2, 7),
        new SpellCard("Lecture de texte anciens", 3, "pioche 2 cartes", new DrawCardEffect(2)),
        new SpellCard("Lecture de texte anciens", 3, "pioche 2 cartes", new DrawCardEffect(2))
    ]);
}
