import { Deck } from "./deck";
import { Hand } from "./hand";
import { Hero } from "./hero";
import { Card } from "./card";
import { legendary } from "./legendary";

const MAX_MANA: number = 7;

// One seat: hero, deck, hand, mana, fatigue and the legendary passive counters.
export class Player
{
    public hero:          Hero;
    public deck:          Deck;
    public hand:          Hand;
    public currentMana:   number;
    public maxMana:       number;
    public fatigue:       number;
    public id:            string;
    public index:         0 | 1;
    public legPassive: legendary | undefined;
    public freddyCount: number = 0;
    public archimedeCount: number = 0;
    public roiDesRatsCount: number = 0;
    public gertrudeCount: number = 0;
    // Cosmetic only; index into the card back catalog (app/lib/cardBacks.ts).
    public cardBack: number;

    constructor(hero: Hero, deck: Deck, id: string, index: 0 | 1, cardBack: number = 0)
    {
        this.hero = hero;
        this.deck = deck;
        this.id = id;
        this.index = index;
        this.cardBack = cardBack;
        this.hand = new Hand();
        this.currentMana = 0;
        this.maxMana = 0;
        this.fatigue = 1;
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

    // Empty deck: fatigue damage instead, increasing each time.
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

    // A deck holds at most one legendary; its passive is active for the whole game.
    checkDeckForLeg()
    {
        const deck: Card[] = this.deck.getCards();

        for (let i = 0; i < deck.length; i++)
        {
            const legPassive = deck[i].getLeg();
            if (legPassive !== undefined)
            {
                this.legPassive = legPassive;
                break ;
            }
        }
    }

    clone(): Player
    {
        const copy = new Player(this.hero.clone(), this.deck.clone(), this.id, this.index, this.cardBack);
        copy.hand        = this.hand.clone();
        copy.currentMana = this.currentMana;
        copy.maxMana     = this.maxMana;
        copy.fatigue     = this.fatigue;
        copy.legPassive       = this.legPassive;
        copy.freddyCount      = this.freddyCount;
        copy.archimedeCount   = this.archimedeCount;
        copy.roiDesRatsCount  = this.roiDesRatsCount;
        copy.gertrudeCount    = this.gertrudeCount;
        return copy;
    }
}
