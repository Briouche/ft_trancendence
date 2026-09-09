import { MinionCard, SpellCard } from "./card";
import { Board } from "./board";
import { Player } from "./player";
import { GameContext } from "./effect";
import { Targetable } from "./target";
import { Effect } from "./effect";
import { Hero } from "./hero";
import { SummonMinionEffect } from "./effect";

// Passive abilities for the six legendary characters. Unlike battlecry/deathrattle/etc., these
// aren't Effect objects wired through a card's Keywords — they're plain functions called directly
// from the spots in gameEngine.ts (and deck.ts at game start) where the matching trigger happens,
// keyed off Player.legPassive (set once per game in Player.checkDeckForLeg — a deck can only run
// one legendary, so a player has at most one of these active). roidesrats and gertrude have no
// function here because their "every Nth trigger" logic lives inline in gameEngine.ts instead.
export type legendary = "jeffe" | "timmy" | "archimede" | "freddy" | "roidesrats" | "gertrude";

export function jeffePassive(minion: MinionCard)
{
    if (minion.currentHealth < minion.maxHealth && minion.jeffeBuff === false)
    {
        minion.attack++;
        minion.jeffeBuff = true;
    }
    else if (minion.currentHealth === minion.maxHealth && minion.jeffeBuff === true)
    {
        minion.attack--;
        minion.jeffeBuff = false;
    }
}

export function timmyPassive(player: Player)
{
    player.hero.maxHealth = 999999;
    player.hero.currentHealth = 25;
}

export function freddyPassive(context: GameContext, number: number)
{
    let summon: SummonMinionEffect = new SummonMinionEffect([new MinionCard("freddyToken" + number, "Skeleton", 0, "Bleuuuuuuurrghhhh...", 1, 1)], 1);
    summon.execute(context);
}
