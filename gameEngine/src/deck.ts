import { Card } from "./card";

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
