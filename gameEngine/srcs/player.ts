import { Deck } from "./deck";
import { Hand } from "./hand";
import { Hero } from "./hero";
import { Card } from "./card";

const MAX_MANA: number = 7;

export class Player
{
    public hero:          Hero;
    public deck:          Deck;
    public hand:          Hand;
    public currentMana:   number;
    public maxMana:       number;
    public fatigue:       number;
    public id:            0 | 1;

    constructor(hero: Hero, deck: Deck, id: 0 | 1)
    {
        this.hero = hero;
        this.deck = deck;
        this.id = id;
        this.hand = new Hand();
        this.currentMana = 0;
        this.maxMana = 0;
        this.fatigue = 0;
    }

    gainMana(): void
    {
        if (this.maxMana < MAX_MANA)
            this.maxMana++;
        this.currentMana = this.maxMana;
    }

    spendMana(amount: number): boolean
    {
        if (amount > this.currentMana)
            return false;
        this.currentMana -= amount;
        return true;
    }

    drawCard(): boolean
    {
        if (this.deck.isEmpty())
        {
            this.hero.takeDamage(this.fatigue);
            this.fatigue++;
            return false;
        }
        const card: Card = this.deck.draw()!;
        this.hand.add(card);
        return true;
    }

    toString(): string
    {
        return this.hero.toString()
            + " | Mana: " + this.currentMana + "/" + this.maxMana
            + " | Deck: " + this.deck.size()
            + " | Hand: " + this.hand.size();
    }

    //-----

    clone(): Player
    {
        const copy = new Player(this.hero.clone(), this.deck.clone(), this.id);
        copy.hand        = this.hand.clone();
        copy.currentMana = this.currentMana;
        copy.maxMana     = this.maxMana;
        copy.fatigue     = this.fatigue;
        return copy;
    }
}