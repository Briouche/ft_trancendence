import { MinionCard } from "./card";
import { Hero }       from "./hero";
import { Player }     from "./player";
import { GameEngine } from "./gameEngine";
import { GameContext } from "./effect";

//make object for a target that accepts both minion and hero,
export interface Targetable
{
    isAlive(): boolean;
    takeDamage(amount: number): void;
    heal(amount: number): void;
    currentHealth:   number;
    readonly name:   string;
    readonly id: string;
}


//base targetresolver class with tauntfilter and resolver that returns all avaiable targets
//construct with true if player needs to pick a target
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

    protected opponentIndex(engine: GameEngine): 0 | 1
    {
        return engine.currentTurn === 0 ? 1 : 0;
    }
}



//      actual resolvers :

//player chooses target out of returned array

// any charachter, ignores taunt
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

// any enemy, respects taunt and rush
export class EnemyCharacterResolver extends TargetResolver
{
    constructor()
    {
        super(true);
    }

    resolve(context: GameContext): Targetable[]
    {
        const oppIdx: 0 | 1        = this.opponentIndex(context.engine);
        const enemyMinions: MinionCard[] = context.engine.board.getMinions(oppIdx);
        const enemyHero: Hero      = context.engine.players[oppIdx].hero;

        const isRushMinion = context.source instanceof MinionCard && !!context.source.effects.rush;

        // rush minions can't target the hero
        let targets: Targetable[];
        if (isRushMinion)
            targets = [...enemyMinions];
        else
            targets = [...enemyMinions, enemyHero];

        return this.tauntFilter(targets, enemyMinions);
    }
}

// only enemy minions, respects taunt
export class EnemyMinionResolver extends TargetResolver
{
    constructor()
    {
        super(true);
    }

    resolve(context: GameContext): Targetable[]
    {
        const oppIdx: 0 | 1        = this.opponentIndex(context.engine);
        const enemyMinions: MinionCard[] = context.engine.board.getMinions(oppIdx);
        return this.tauntFilter([...enemyMinions], enemyMinions);
    }
}

// any minion on either side of the board, ignores taunt
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


//no choice resolvers (no need to target by player)

// only enemy hero
export class EnemyHeroResolver extends TargetResolver
{
    constructor()
    {
        super(false);
    }

    resolve(context: GameContext): Targetable[]
    {
        const oppIdx: 0 | 1        = this.opponentIndex(context.engine);
        return [context.engine.players[oppIdx].hero];
    }
}

// all characters
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

// all minions on both sides
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
        const oppIdx: 0 | 1 = this.opponentIndex(context.engine);
        return [...context.engine.board.getMinions(oppIdx)];
    }
}

//all enemy minions + enemy hero
export class AllEnemiesResolver extends TargetResolver
{
    constructor()
    {
        super(false);
    }

    resolve(context: GameContext): Targetable[]
    {
        const oppIdx: 0 | 1 = this.opponentIndex(context.engine);
        return [...context.engine.board.getMinions(oppIdx), context.engine.players[oppIdx].hero];
    }
}

// both heroes
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

// own hero
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

// all allied minions
export class AlliedMinionsResolver extends TargetResolver
{
    constructor()
    {
        super(false);
    }

    resolve(context: GameContext): Targetable[]
    {
        return [...context.engine.board.getMinions(context.engine.currentTurn)];
    }
}

// all allied minions but the source
export class OtherAlliedMinionsResolver extends TargetResolver
{
    constructor()
    {
        super(false);
    }

    resolve(context: GameContext): Targetable[]
    {
        let targets: Targetable[] = [];

        for (const minion of context.engine.board.getMinions(context.engine.currentTurn))
        {
            if (minion != context.source)
                targets.push(minion);
        }
        return targets;
    }
}

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
        else if (context.owner instanceof Hero)
            return [context.owner];
        return [];
    }
}

// one random enemy
export class RandomEnemyResolver extends TargetResolver
{
    constructor()
    {
        super(false);
    }

    resolve(context: GameContext): Targetable[]
    {
        const oppIdx: 0 | 1  = this.opponentIndex(context.engine);
        const enemies: Targetable[] = [...context.engine.board.getMinions(oppIdx), context.engine.players[oppIdx].hero];

        if (enemies.length === 0)
            return [];
        const randomIndex: number = Math.floor(Math.random() * enemies.length);
        return [enemies[randomIndex]];
    }
}

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
            let board = context.engine.board.getMinions(context.owner.index);
            let boardIndex = -1;
            let i = 0;
            for (const minion of board)
            {
                if (minion == context.source)
                    boardIndex = i;
                i++;
            }
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
