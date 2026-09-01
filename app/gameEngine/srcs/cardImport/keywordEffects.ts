import {
    Effect, DamageEffect, HealEffect, BuffEffect, DrawCardEffect, AddEffectfEffect,
    SummonMinionEffect, CombinedEffect, RandomMissileEffect, silenceEffect,
} from '../effect'
import { AnyMinionResolver, NeighboringMinionsResolver, EnemyHeroResolver, PlayerHeroResolver, RandomEnemyResolver } from '../target'
import { MinionCard } from '../card'

// Id de "Archimed la maudite" (table Card du seed) : les 6 créatures "(archi card)" (Haku, Neo,
// Po, Reborn, Ribgy, Zurg) partagent ce legendId comme référence de FAMILLE, pas comme
// légendaire elles-mêmes (voir le commentaire de resolveLegendaryPassive dans cardLoader.ts) —
// c'est ce qui les fait compter dans archimedeCount (gameEngine.ts, déclenche archiDamageEffect
// une fois 6 atteintes).
export const ARCHIMEDE_ID = 'mqi2mtc3'

// Effet qui ne fait rien : filet de sécurité pour les sorts sans effet scripté ci-dessous — la
// carte reste jouable (coût payé, va au cimetière) sans planter, en attendant d'être scriptée.
export class NoOpEffect extends Effect
{
    execute(): void {}
}

function token(name: string, atk: number, hp: number, desc = ''): MinionCard
{
    return new MinionCard('', name, 0, desc, atk, hp)
}

// Zombie invoqué par "soulevement de tombes" : a lui-même un râle d'agonie (invoque 1 zombie
// 1-1 simple, sans chaîner à l'infini) — voir son texte : "invoque 2 zombie 1-1 avec rale
// d'agonie : invoque un zombie 1-1".
function zombieToken(): MinionCard
{
    const zombie = token('Zombie', 1, 1)
    zombie.effects = { deathrattle: new SummonMinionEffect([token('Zombie', 1, 1)], 1) }
    return zombie
}

// Effets scriptés à la main pour les cartes dont le mot-clé (CRI_DE_GUERRE / RALE_DAGONIE /
// SILENCE / SOIGNE) implique un vrai effet, pas juste un trait booléen — taunt/rush/archi/
// vol de vie restent dérivés génériquement de `keywords`/`legendId` dans cardLoader.ts, pas
// besoin d'entrée ici pour ces cas-là. Clé = Card.id (seed data) : stable tant que la table
// n'est pas re-seedée avec de nouveaux ids. Le reste des 76 cartes (sans mot-clé) n'a pour
// l'instant aucun signal structuré exploitable — desc est du texte libre, pas du JSON — et reste
// donc en stats "vanille" (jouable, mais sans son texte gris) tant que personne ne les script à
// la main ici.
export const BATTLECRY_OVERRIDES: Record<string, () => Effect> = {
    // allie peureux — "CdG : donne +1/+1 et taunt aux creatures adjacente"
    mqi2qm6a: () => new CombinedEffect([
        new BuffEffect(1, 1, new NeighboringMinionsResolver()),
        new AddEffectfEffect(true, 'taunt', new NeighboringMinionsResolver()),
    ]),
    // Bibliothequaire — "Silence une creature"
    mqi87m6k: () => new silenceEffect(new AnyMinionResolver()),
    // Ribgy (Archi card) — "soigne 3 PV" (pas de cible précisée dans le texte : son propre héros)
    mqi2kthv: () => new HealEffect(3, new PlayerHeroResolver()),
    // Haku (archi card) — "pioche une carte"
    mqib6m3f: () => new DrawCardEffect(1),
    // Reborn (Archi card) — "donne +1/+1 a une autre creature"
    mqi2jqa4: () => new BuffEffect(1, 1, new AnyMinionResolver()),
}

export const DEATHRATTLE_OVERRIDES: Record<string, () => Effect> = {
    // Goblinmikaze — "rale d'agonie : inflige 2 dmg a 2 adversaire aleatoire"
    mqi2w8de: () => new RandomMissileEffect(2, 2, new RandomEnemyResolver()),
    // Hyperactive cousin — "Rale d'agonie : invouque hyperactive little cousin 1-1"
    mpzr3mcy: () => new SummonMinionEffect([token('Hyperactive Little Cousin', 1, 1)], 1),
    // Le Phoenix (4/4 de base) — "rale d'agonie : invoque un phoenix avec des stats -1/-1"
    mqi33jfs: () => new SummonMinionEffect([token('Phoenix', 3, 3)], 1),
    // Zurg (archi card) — "Rale d'agonie : invoque 2 alien 1-1"
    mqibfh9p: () => new SummonMinionEffect([token('Alien', 1, 1), token('Alien', 1, 1)], 2),
    // le croupier — "rale d'agonie : pioche une carte"
    mqi39fwn: () => new DrawCardEffect(1),
    // mere pondeuse — "Rale agonie : invoaue 3 araignee 1-1"
    mqi2rye2: () => new SummonMinionEffect(
        [token('Araignée', 1, 1), token('Araignée', 1, 1), token('Araignée', 1, 1)], 3,
    ),
    // slime degoutant — "rale d'agonie : inflige 2 dmg au hero adverse"
    mqi35y1s: () => new DamageEffect(2, new EnemyHeroResolver()),
}

// Effets pour les cartes de type "Spell" (SpellCard.effect n'est pas optionnel — NoOpEffect sert
// de filet pour tous les sorts non encore scriptés, voir plus haut).
export const SPELL_EFFECT_OVERRIDES: Record<string, () => Effect> = {
    // TIG — "Silence une creature"
    mqi2odxf: () => new silenceEffect(new AnyMinionResolver()),
    // soulevement de tombes — "invoque 2 zombie 1-1 avec rale d'agonie : invoque un zombie 1-1"
    mqi313ey: () => new SummonMinionEffect([zombieToken(), zombieToken()], 2),
}
