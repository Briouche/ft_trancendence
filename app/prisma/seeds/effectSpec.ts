// Shape of the effect JSON stored on Card rows. Hand-mirrored from
// game_engine/srcs/cardImport/effectFactory.ts; keep both in sync.
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
    | { kind: "summon"; tokens: unknown[]; amount: number }
    | { kind: "combined"; effects: EffectSpec[] }
    | { kind: "randomMissile"; amount: number; damage: number; resolver: ResolverSpec }
    | { kind: "triggerDeathrattle"; resolver: ResolverSpec }
    | { kind: "triggerEndOfTurn"; resolver: ResolverSpec }
    | { kind: "timmy"; resolver: ResolverSpec }
    | { kind: "archimed"; resolver: ResolverSpec }
    | { kind: "equalHealth" }
    | { kind: "cleave" }
    | { kind: "regeneration" }
