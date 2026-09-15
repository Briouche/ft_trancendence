import { MinionCard } from "./card";
import { Player } from "./player";
import { GameContext, SummonMinionEffect } from "./effect";

// Legendary passives, keyed by Player.legPassive and called from gameEngine.ts at the matching
// trigger. roidesrats / gertrude / archimede are counters handled inline there.
export type legendary = "jeffe" | "timmy" | "archimede" | "freddy" | "roidesrats" | "gertrude";

// Jeffe: a damaged minion gets +1 attack until healed back to full.
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

// Timmy: starts at 25 HP with no health cap.
export function timmyPassive(player: Player)
{
    player.hero.maxHealth = 999999;
    player.hero.currentHealth = 25;
}

// Freddy: summons a 1/1 skeleton.
export function freddyPassive(context: GameContext, number: number)
{
    let summon: SummonMinionEffect = new SummonMinionEffect([new MinionCard("freddyToken" + number, "Skeleton", 0, "Bleuuuuuuurrghhhh...", 1, 1)], 1);
    summon.execute(context);
}
