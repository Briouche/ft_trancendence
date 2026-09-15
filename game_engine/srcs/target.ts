import { MinionCard } from "./card";
import { Hero }       from "./hero";
import { GameContext } from "./effect";

// Anything that can be damaged or healed: minions and heroes.
export interface Targetable
{
    isAlive(): boolean;
    takeDamage(amount: number): void;
    heal(amount: number): number;
    currentHealth:   number;
    readonly name:   string;
    readonly id: string;
}

// Picks the targets of an effect. requiresInput: the player chooses one from the list.
export abstract class TargetResolver
{
    public readonly requiresInput: boolean;

    constructor(requiresInput: boolean)
    {
        this.requiresInput = requiresInput;
    }

    abstract resolve(context: GameContext): Targetable[];

    protected tauntFilter(targets: Targetable[], enemyMinions: MinionCard[]): Targetable[]
    {
        const tauntMinions: MinionCard[] = enemyMinions.filter(m => m.effects && m.effects.taunt);
        if (tauntMinions.length > 0)
            return tauntMinions;
        return targets;
    }

    protected opponentIndex(context: GameContext): 0 | 1
    {
        return context.owner.index === 0 ? 1 : 0;
    }
}

// ---- player picks one target ----

// any character, ignores taunt
export class AnyCharacterResolver extends TargetResolver
{
    constructor()
    {
        super(true);
    }

    resolve(context: GameContext) : Targetable[]
    {
        let targets: Targetable[] = [];

        targets.push(...context.engine.board.getMinions(0));
        targets.push(...context.engine.board.getMinions(1));
        targets.push(context.engine.players[0].hero);
        targets.push(context.engine.players[1].hero);

        return targets;
    }
}

// any enemy, respects taunt; a rush attacker can't target the hero
export class EnemyCharacterResolver extends TargetResolver
{
    constructor()
    {
        super(true);
    }

    resolve(context: GameContext): Targetable[]
    {
        const oppIdx: 0 | 1        = this.opponentIndex(context);
        const enemyMinions: MinionCard[] = context.engine.board.getMinions(oppIdx);
        const enemyHero: Hero      = context.engine.players[oppIdx].hero;

        const isRushMinion = context.source instanceof MinionCard && !!context.source.effects.rush;

        let targets: Targetable[];
        if (isRushMinion)
            targets = [...enemyMinions];
        else
            targets = [...enemyMinions, enemyHero];

        return this.tauntFilter(targets, enemyMinions);
    }
}

// enemy minions, respects taunt
export class EnemyMinionResolver extends TargetResolver
{
    constructor()
    {
        super(true);
    }

    resolve(context: GameContext): Targetable[]
    {
        const oppIdx: 0 | 1        = this.opponentIndex(context);
        const enemyMinions: MinionCard[] = context.engine.board.getMinions(oppIdx);
        return this.tauntFilter([...enemyMinions], enemyMinions);
    }
}

// any minion, ignores taunt
export class AnyMinionResolver extends TargetResolver
{
    constructor()
    {
        super(true);
    }

    resolve(context: GameContext): Targetable[]
    {
        return [...context.engine.board.getMinions(0), ...context.engine.board.getMinions(1)];
    }
}

// one allied minion
export class AllyMinionResolver extends TargetResolver
{
    constructor()
    {
        super(true);
    }

    resolve(context: GameContext): Targetable[]
    {
        return [...context.engine.board.getMinions(context.owner.index)];
    }
}

// ---- no choice ----

export class EnemyHeroResolver extends TargetResolver
{
    constructor()
    {
        super(false);
    }

    resolve(context: GameContext): Targetable[]
    {
        const oppIdx: 0 | 1        = this.opponentIndex(context);
        return [context.engine.players[oppIdx].hero];
    }
}

export class AllCharactersResolver extends TargetResolver
{
    constructor()
    {
        super(false);
    }

    resolve(context: GameContext): Targetable[]
    {
        return [
            ...context.engine.board.getMinions(0),
            ...context.engine.board.getMinions(1),
            context.engine.players[0].hero,
            context.engine.players[1].hero];
    }
}

export class AllMinionsResolver extends TargetResolver
{
    constructor()
    {
        super(false);
    }

    resolve(context: GameContext): Targetable[]
    {
        return [...context.engine.board.getMinions(0), ...context.engine.board.getMinions(1)];
    }
}

// all enemy minions, ignores taunt
export class AllEnemyMinionsResolver extends TargetResolver
{
    constructor()
    {
        super(false);
    }

    resolve(context: GameContext): Targetable[]
    {
        const oppIdx: 0 | 1 = this.opponentIndex(context);
        return [...context.engine.board.getMinions(oppIdx)];
    }
}

// all enemy minions + enemy hero
export class AllEnemiesResolver extends TargetResolver
{
    constructor()
    {
        super(false);
    }

    resolve(context: GameContext): Targetable[]
    {
        const oppIdx: 0 | 1 = this.opponentIndex(context);
        return [...context.engine.board.getMinions(oppIdx), context.engine.players[oppIdx].hero];
    }
}

export class BothHeroesResolver extends TargetResolver
{
    constructor()
    {
        super(false);
    }

    resolve(context: GameContext): Targetable[]
    {
        return [context.engine.players[0].hero, context.engine.players[1].hero];
    }
}

export class PlayerHeroResolver extends TargetResolver
{
    constructor()
    {
        super(false);
    }

    resolve(context: GameContext): Targetable[]
    {
        return [context.owner.hero];
    }
}

export class AlliedMinionsResolver extends TargetResolver
{
    constructor()
    {
        super(false);
    }

    resolve(context: GameContext): Targetable[]
    {
        return [...context.engine.board.getMinions(context.owner.index)];
    }
}

// allied minions except the source
export class OtherAlliedMinionsResolver extends TargetResolver
{
    constructor()
    {
        super(false);
    }

    resolve(context: GameContext): Targetable[]
    {
        let targets: Targetable[] = [];

        for (const minion of context.engine.board.getMinions(context.owner.index))
        {
            if (minion != context.source)
                targets.push(minion);
        }
        return targets;
    }
}

export class DamagedAlliedMinionsResolver extends TargetResolver
{
    constructor()
    {
        super(false);
    }

    resolve(context: GameContext): Targetable[]
    {
        return context.engine.board.getMinions(context.owner.index)
            .filter(m => m.currentHealth < m.maxHealth);
    }
}

// the minion carrying the effect
export class SourceResolver extends TargetResolver
{
    constructor()
    {
        super(false);
    }

    resolve(context: GameContext): Targetable[]
    {
        if (context.source instanceof MinionCard)
            return [context.source];
        return [];
    }
}

// one random living enemy (minion or hero)
export class RandomEnemyResolver extends TargetResolver
{
    constructor()
    {
        super(false);
    }

    resolve(context: GameContext): Targetable[]
    {
        const oppIdx: 0 | 1  = this.opponentIndex(context);
        const enemies: Targetable[] = [...context.engine.board.getMinions(oppIdx), context.engine.players[oppIdx].hero]
            .filter((e: Targetable) => e.isAlive());

        if (enemies.length === 0)
            return [];
        const randomIndex: number = Math.floor(Math.random() * enemies.length);
        return [enemies[randomIndex]];
    }
}

// the minions left and right of the source
export class NeighboringMinionsResolver extends TargetResolver
{
    constructor()
    {
        super(false);
    }

    resolve(context: GameContext): Targetable[]
    {
        let neighbors: Targetable[] = [];
        if (context.source instanceof MinionCard)
        {
            const board = context.engine.board.getMinions(context.owner.index);
            const boardIndex = board.indexOf(context.source);
            if (boardIndex == -1)
                return neighbors;
            if (board[boardIndex - 1])
                neighbors.push(board[boardIndex - 1]);
            if (board[boardIndex + 1])
                neighbors.push(board[boardIndex + 1]);
        }
        return neighbors;
    }
}
