import { Card } from "./card";
import { GameEngine } from "./gameEngine";
import { Player } from "./player";
import { Targetable, TargetResolver } from "./target";

export interface GameContext
{
    engine: GameEngine;
    owner: Player;
    source: Card;
    target?: Targetable;
}

export abstract class Effect
{
    public resolver: TargetResolver | null;

    constructor(resolver: TargetResolver | null = null)
    {
        this.resolver = resolver;
    }

    abstract execute(context: GameContext): void;
}

export class DrawCardEffect extends Effect
{
    private _amount: number;

    constructor(amount: number)
    {
        super();
        this._amount = amount;
    }

    execute(context: GameContext): void 
    {
        for (let i = 0; i < this._amount; i++)
            context.owner.drawCard();
    }
}

export class DamageEffect extends Effect
{
    private _amount: number;

    constructor(amount: number, resolver: TargetResolver | null)
    {
        super(resolver);
        this._amount = amount;
    }

    execute(context: GameContext): void
    {
        if (this.resolver && this.resolver.requiresInput)
        {
            if (context.target)
                context.target.takeDamage(this._amount);
        }
        else if (this.resolver)
        {
            const targets = this.resolver.resolve(context);
            for (let target of targets)
            {
                target.takeDamage(this._amount);
            }
        }
    }
}

export class HealEffect extends Effect
{
    private _amount: number;

    constructor(amount: number, resolver: TargetResolver | null)
    {
        super(resolver);
        this._amount = amount;
    }

    execute(context: GameContext): void
    {
        if (this.resolver && this.resolver.requiresInput)
        {
            if (context.target)
                context.target.heal(this._amount);
        }
        else if (this.resolver)
        {
            const targets = this.resolver.resolve(context);
            for (let target of targets)
            {
                target.heal(this._amount);
            }
        }
    }
}
