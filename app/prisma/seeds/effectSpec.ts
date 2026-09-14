// Shape of the JSON stored in Card's battlecry/deathrattle/onAttack/etc. columns (schema.prisma),
// used here only to type-check tcg-collection.json while seeding. This is mirrored BY HAND from
// game_engine/srcs/cardImport/effectFactory.ts's ResolverSpec/EffectSpec — not imported from there
// directly, since the app image's Docker build context (./app) never includes game_engine/srcs (see
// game_engine/srcs/shared/protocol.ts for the same convention on the client/server wire protocol).
// A change to the effect spec shape on the game_engine side needs the same change made here.
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
