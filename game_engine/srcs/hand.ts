import { Card } from "./card";

const MAX_HAND_SIZE: number = 10;

/** A player's hand: at most 10 cards, extra draws are lost. */
export class Hand
{
    private cards: Card[] = [];

    // Returns false (card lost) when the hand is full.
    add(card: Card): boolean
    {
        if (this.cards.length >= MAX_HAND_SIZE)
            return false;
        this.cards.push(card);
        return true;
    }

    play(index: number): Card | null
    {
        if (index < 0 || index >= this.cards.length)
            return null;
        const card: Card = this.cards[index];
        this.cards.splice(index, 1);
        return card;
    }

    size(): number
    {
        return this.cards.length;
    }

    isEmpty(): boolean
    {
        return this.cards.length === 0;
    }

    getCards(): Card[]
    {
        return [...this.cards];
    }

    clone(): Hand
    {
        const copy = new Hand();
        for (const card of this.cards)
            copy.add(card.cloneCopy());
        return copy;
    }
}
