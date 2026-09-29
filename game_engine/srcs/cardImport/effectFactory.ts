import { Effect, DamageEffect, HealEffect, BuffEffect, CountScaledBuffEffect, DrawCardEffect, AddEffectfEffect, SummonMinionEffect, CombinedEffect, RandomMissileEffect, silenceEffect, triggerDeathrattleEffect, triggerEndOfTurnEffect, timmyDamageEffect, archiDamageEffect, lifestealEffect, destroyEffect, equalHealthEffect, cleaveEffect, regenerationEffect } from '../effect'
import { TargetResolver, AnyCharacterResolver, AllMinionsResolver, NeighboringMinionsResolver, OtherAlliedMinionsResolver, DamagedAlliedMinionsResolver, RandomEnemyResolver, EnemyMinionResolver, EnemyHeroResolver, EnemyCharacterResolver, AllCharactersResolver, AlliedMinionsResolver, AllyMinionResolver, AnyMinionResolver, AllEnemyMinionsResolver, BothHeroesResolver, PlayerHeroResolver, SourceResolver, AllEnemiesResolver } from '../target'
import { RawCard, rawToMinionCard } from './cardLoader'

// JSON effect definitions stored on Card rows (schema.prisma) → Effect / TargetResolver instances.

export type ResolverSpec =
    | { kind: "anyCharacter" }
    | { kind: "enemyCharacter" }
    | { kind: "enemyMinion" }
    | { kind: "enemyHero" }
    | { kind: "allCharacters" }
    | { kind: "allEnemies" }
    | { kind: "allMinions" }
    | { kind: "alliedMinions" }
    | { kind: "otherAlliedMinions" }
    | { kind: "damagedAlliedMinions" }
    | { kind: "neighboringMinions" }
    | { kind: "randomEnemy" }
    | { kind: "anyMinion" }
    | { kind: "allEnemyMinions" }
    | { kind: "bothHeroes" }
    | { kind: "playerHero" }
    | { kind: "source" }
    | { kind: "allyMinion" }

export type EffectSpec =
    | { kind: "damage"; amount: number; resolver: ResolverSpec }
    | { kind: "heal"; amount: number; resolver: ResolverSpec }
    | { kind: "lifesteal"; amount?: number }
    | { kind: "buff"; atk: number; health: number; resolver: ResolverSpec }
    | { kind: "countBuff"; atk: number; health: number; countResolver: ResolverSpec; resolver: ResolverSpec }
    | { kind: "draw"; amount: number }
    | { kind: "addKeyword"; value: boolean | EffectSpec; keywordType: string; resolver: ResolverSpec }
    | { kind: "silence"; resolver: ResolverSpec }
    | { kind: "destroy"; resolver: ResolverSpec }
    | { kind: "summon"; tokens: RawCard[]; amount: number }
    | { kind: "combined"; effects: EffectSpec[] }
    | { kind: "randomMissile"; amount: number; damage: number; resolver: ResolverSpec }
    | { kind: "triggerDeathrattle"; resolver: ResolverSpec }
    | { kind: "triggerEndOfTurn"; resolver: ResolverSpec }
    | { kind: "timmy"; resolver: ResolverSpec }
    | { kind: "archimede"; resolver: ResolverSpec }
    | { kind: "equalHealth" }
    | { kind: "cleave" }
    | { kind: "regeneration" }

function buildResolver(spec: ResolverSpec): TargetResolver
{
    switch (spec.kind)
    {
        case "anyCharacter":        return new AnyCharacterResolver()
        case "enemyMinion":         return new EnemyMinionResolver()
        case "enemyHero":           return new EnemyHeroResolver()
        case "enemyCharacter":      return new EnemyCharacterResolver()
        case "allCharacters":       return new AllCharactersResolver()
        case "allEnemies":          return new AllEnemiesResolver()
        case "alliedMinions":       return new AlliedMinionsResolver()
        case "allMinions":          return new AllMinionsResolver()
        case "neighboringMinions":  return new NeighboringMinionsResolver()
        case "otherAlliedMinions":  return new OtherAlliedMinionsResolver()
        case "damagedAlliedMinions": return new DamagedAlliedMinionsResolver()
        case "randomEnemy":         return new RandomEnemyResolver()
        case "anyMinion":           return new AnyMinionResolver()
        case "allEnemyMinions":     return new AllEnemyMinionsResolver()
        case "bothHeroes":          return new BothHeroesResolver()
        case "playerHero":          return new PlayerHeroResolver()
        case "source":              return new SourceResolver()
        case "allyMinion":          return new AllyMinionResolver()
        default:
            return new AnyCharacterResolver();
    }
}

export function buildEffect(spec: EffectSpec | null | undefined): Effect | undefined
{
    if (!spec)
        return undefined

    switch (spec.kind)
    {
        case "silence":
            return new silenceEffect(buildResolver(spec.resolver))
        case "damage":
            return new DamageEffect(spec.amount, buildResolver(spec.resolver))
        case "heal":
            return new HealEffect(spec.amount, buildResolver(spec.resolver))
        case "lifesteal":
            return new lifestealEffect(spec.amount ?? 0)
        case "buff":
            return new BuffEffect(spec.atk, spec.health, buildResolver(spec.resolver))
        case "countBuff":
            return new CountScaledBuffEffect(spec.atk, spec.health, buildResolver(spec.countResolver), buildResolver(spec.resolver))
        case "destroy":
            return new destroyEffect(buildResolver(spec.resolver));
        case "draw":
            return new DrawCardEffect(spec.amount)
        case "addKeyword":
        {
            const keywordType = spec.keywordType as "battlecry" | "deathrattle" | "onAttack" | "taunt" | "rush" | "endOfTurnEffect"
            const value: boolean | Effect = (keywordType === "taunt" || keywordType === "rush")
                ? spec.value as boolean
                : buildEffect(spec.value as EffectSpec)!
            return new AddEffectfEffect(value, keywordType, buildResolver(spec.resolver))
        }
        case "summon":
            return new SummonMinionEffect(spec.tokens.map(t => rawToMinionCard(t)), spec.amount)
        case "combined":
            return new CombinedEffect(spec.effects.map(e => buildEffect(e)!))
        case "randomMissile":
            return new RandomMissileEffect(spec.amount, spec.damage, buildResolver(spec.resolver))
        case "triggerDeathrattle":
            return new triggerDeathrattleEffect(buildResolver(spec.resolver))
        case "triggerEndOfTurn":
            return new triggerEndOfTurnEffect(buildResolver(spec.resolver))
        case "timmy":
            return new timmyDamageEffect(buildResolver(spec.resolver))
        case "archimede":
            return new archiDamageEffect(buildResolver(spec.resolver))
        case "equalHealth":
            return new equalHealthEffect()
        case "cleave":
            return new cleaveEffect()
        case "regeneration":
            return new regenerationEffect()
        default:
            return undefined;
    }
}
