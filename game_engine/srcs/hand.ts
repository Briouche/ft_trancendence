import { Card } from "./card";

const MAX_HAND_SIZE: number = 10;

export class Hand
{
    private cards: Card[] = [];

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

    toString(): string
    {
        if (this.cards.length === 0)
            return "Hand is empty.";

        let result: string = "";
        for (let i = 0; i < this.cards.length; i++)
            result += "  [" + i + "] " + this.cards[i].toString() + "\n";
        return result;
    }

    //-----

    clone(): Hand
    {
        const copy = new Hand();
        for (const card of this.cards)
            copy.add(card.cloneCopy());
        return copy;
    }
}
