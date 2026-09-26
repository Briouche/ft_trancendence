import { MinionCard, SpellCard, Card } from "../srcs/card";
import { Deck } from "../srcs/deck";
import { Hero } from "../srcs/hero";
import { Player } from "../srcs/player";
import { GameEngine } from "../srcs/gameEngine";
import { DamageEffect } from "../srcs/effect";
import { AnyCharacterResolver } from "../srcs/target";

// Small factories for building deterministic game states in tests.

let nextId = 0;

/** A vanilla minion with the given stats and keywords. */
export function minion(attack: number, health: number, cost = 1, keywords: ConstructorParameters<typeof MinionCard>[6] = {}): MinionCard
{
    return new MinionCard(`m${nextId++}`, "Test minion", cost, "", attack, health, keywords);
}

/** "Deal `amount` damage to any character" spell. */
export function damageSpell(amount: number, cost = 1): SpellCard
{
    return new SpellCard(`s${nextId++}`, "Test spell", cost, "", new DamageEffect(amount, new AnyCharacterResolver()));
}

/** Two players with the given decks (default: 10 vanilla 1/1s each), game not started. */
export function newEngine(deck0: Card[] = filler(10), deck1: Card[] = filler(10)): GameEngine
{
    const p0 = new Player(new Hero("P0", "hero-0"), new Deck(deck0), "hero-0", 0);
    const p1 = new Player(new Hero("P1", "hero-1"), new Deck(deck1), "hero-1", 1);
    return new GameEngine([p0, p1]);
}

/** `n` vanilla 1/1 minions. */
export function filler(n: number): Card[]
{
    return Array.from({ length: n }, () => minion(1, 1));
}
