import { MinionCard, SpellCard } from "./card";
import { Board } from "./board";
import { Player } from "./player";
import { GameContext } from "./effect";
import { Targetable } from "./target";
import { Effect } from "./effect";
import { Hero } from "./hero";
import { SummonMinionEffect } from "./effect";

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
