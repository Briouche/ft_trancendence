import {
    Effect, DamageEffect, HealEffect, BuffEffect, DrawCardEffect, AddEffectfEffect,
    SummonMinionEffect, CombinedEffect, RandomMissileEffect, silenceEffect,
} from '../effect'
import { AnyMinionResolver, NeighboringMinionsResolver, EnemyHeroResolver, PlayerHeroResolver, RandomEnemyResolver } from '../target'
import { MinionCard } from '../card'

// Id of "Archimede la maudite" (Card seed table): the 6 "(archi card)" creatures (Haku, Neo, Po,
// Reborn, Ribgy, Zurg) share this legendId as a FAMILY reference, not as their own legendary
// passive (see the resolveLegendaryPassive comment in cardLoader.ts) — this is what makes them
// count toward archimedeCount (gameEngine.ts, triggers archiDamageEffect once it reaches 6).
export const ARCHIMEDE_ID = 'mqi2mtc3'

// An effect that does nothing: a safety net for spells with no scripted effect below — the card
// stays playable (mana paid, goes to the graveyard) without crashing, until someone scripts it.
export class NoOpEffect extends Effect
{
    execute(): void {}
}

function token(name: string, atk: number, hp: number, desc = ''): MinionCard
{
    return new MinionCard('', name, 0, desc, atk, hp)
}

// Zombie summoned by "Soulevement de tombes": has its own deathrattle (summons a single plain
// 1/1 zombie, no infinite chaining) — matches its card text: "summon 2 1/1 zombies with
// deathrattle: summon a 1/1 zombie".
function zombieToken(): MinionCard
{
    const zombie = token('Zombie', 1, 1)
    zombie.effects = { deathrattle: new SummonMinionEffect([token('Zombie', 1, 1)], 1) }
    return zombie
}

// Hand-scripted effects for cards whose keyword (CRI_DE_GUERRE/battlecry, RALE_DAGONIE/
// deathrattle, SILENCE, SOIGNE/heal) implies a real effect, not just a boolean trait —
// taunt/rush/archi/lifesteal are still derived generically from `keywords`/`legendId` in
// cardLoader.ts, no entry needed here for those. Key = Card.id (seed data): stable as long as the
// table isn't reseeded with new ids. The rest of the 76 cards (no keyword) currently have no
// structured signal to work from — desc is free text, not JSON — so they stay on "vanilla" stats
// (playable, but without their flavor-text effect) until someone scripts them here by hand.
export const BATTLECRY_OVERRIDES: Record<string, () => Effect> = {
    // allie peureux ("scared ally") — battlecry: give +1/+1 and taunt to adjacent creatures
    mqi2qm6a: () => new CombinedEffect([
        new BuffEffect(1, 1, new NeighboringMinionsResolver()),
        new AddEffectfEffect(true, 'taunt', new NeighboringMinionsResolver()),
    ]),
    // Bibliothequaire ("librarian") — battlecry: silence a creature
    mqi87m6k: () => new silenceEffect(new AnyMinionResolver()),
    // Ribgy (archi card) — battlecry: heal 3 HP (no target specified in the card text: its own hero)
    mqi2kthv: () => new HealEffect(3, new PlayerHeroResolver()),
    // Haku (archi card) — battlecry: draw a card
    mqib6m3f: () => new DrawCardEffect(1),
    // Reborn (archi card) — battlecry: give +1/+1 to another creature
    mqi2jqa4: () => new BuffEffect(1, 1, new AnyMinionResolver()),
}

export const DEATHRATTLE_OVERRIDES: Record<string, () => Effect> = {
    // Goblinmikaze — deathrattle: deal 2 damage to 2 random enemies
    mqi2w8de: () => new RandomMissileEffect(2, 2, new RandomEnemyResolver()),
    // Hyperactive cousin — deathrattle: summon a 1/1 Hyperactive Little Cousin
    mpzr3mcy: () => new SummonMinionEffect([token('Hyperactive Little Cousin', 1, 1)], 1),
    // Le Phoenix (base stats 4/4) — deathrattle: summon a Phoenix with -1/-1 stats
    mqi33jfs: () => new SummonMinionEffect([token('Phoenix', 3, 3)], 1),
    // Zurg (archi card) — deathrattle: summon 2 1/1 aliens
    mqibfh9p: () => new SummonMinionEffect([token('Alien', 1, 1), token('Alien', 1, 1)], 2),
    // le croupier ("the dealer") — deathrattle: draw a card
    mqi39fwn: () => new DrawCardEffect(1),
    // mere pondeuse ("egg-laying mother") — deathrattle: summon 3 1/1 spiders
    mqi2rye2: () => new SummonMinionEffect(
        [token('Araignée', 1, 1), token('Araignée', 1, 1), token('Araignée', 1, 1)], 3,
    ),
    // slime degoutant ("disgusting slime") — deathrattle: deal 2 damage to the enemy hero
    mqi35y1s: () => new DamageEffect(2, new EnemyHeroResolver()),
}

// Effects for "Spell"-type cards (SpellCard.effect isn't optional — NoOpEffect is the fallback
// for any spell not yet scripted, see above).
export const SPELL_EFFECT_OVERRIDES: Record<string, () => Effect> = {
    // TIG — silence a creature
    mqi2odxf: () => new silenceEffect(new AnyMinionResolver()),
    // soulevement de tombes ("raise the dead") — summon 2 1/1 zombies, each with deathrattle:
    // summon a 1/1 zombie
    mqi313ey: () => new SummonMinionEffect([zombieToken(), zombieToken()], 2),
}
