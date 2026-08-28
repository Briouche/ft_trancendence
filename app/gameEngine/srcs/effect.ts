import { Card, MinionCard } from "./card";
import { GameEngine } from "./gameEngine";
import { Player } from "./player";
import { EnemyHeroResolver, PlayerHeroResolver, Targetable, TargetResolver } from "./target";
import { Hero } from "./hero";

export interface GameContext
{
    engine: GameEngine;
    owner: Player;
    source: Card;
    target?: Targetable;
}

//base effect class, holds a Targetresolver that determines which targets the effect aims at
export abstract class Effect
{
    public resolver: TargetResolver | null;

    constructor(resolver: TargetResolver | null = null)
    {
        this.resolver = resolver;
    }

    abstract execute(context: GameContext): void;
}


// effects:
// ----------------

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
            {
                context.target.takeDamage(this._amount);
                context.engine.recordDamage(context.target, this._amount, context.engine.findOwnerById(context.target.id));
            }
        }
        else if (this.resolver)
        {
            const targets = this.resolver.resolve(context);
            for (let target of targets)
            {
                target.takeDamage(this._amount);
                context.engine.recordDamage(target, this._amount, context.engine.findOwnerById(target.id));
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

export class BuffEffect extends Effect
{
    private _attackBuff: number;
    private _healthBuff: number;

    constructor(attackBuff: number, healthBuff: number, resolver: TargetResolver | null)
    {
        super(resolver);
        this._attackBuff = attackBuff;
        this._healthBuff = healthBuff;
    }

    execute(context: GameContext): void
    {
        if (this.resolver && this.resolver.requiresInput)
        {
            if (context.target && context.target instanceof MinionCard)
            {
                context.target.currentHealth += this._healthBuff;
                context.target.maxHealth += this._healthBuff;
                context.target.attack += this._attackBuff;
                if (context.target.attack < 0)
                    context.target.attack = 0;
            }
            else if (context.target && context.target instanceof Hero)
            {
                context.target.currentHealth += this._healthBuff;
                context.target.maxHealth += this._healthBuff;
            }
        }
        else if (this.resolver)
        {
            const targets: Targetable[] = this.resolver.resolve(context);
            for (const target of targets)
            {
                if (target && target instanceof MinionCard)
                {
                    target.currentHealth += this._healthBuff;
                    target.maxHealth += this._healthBuff;
                    target.attack += this._attackBuff;
                    if (target.attack < 0)
                        target.attack = 0;
                }
                else if (target && target instanceof Hero)
                {
                    target.currentHealth += this._healthBuff;
                    target.maxHealth += this._healthBuff;
                }
            }
        }
    }
}

export class AddEffectfEffect extends Effect
{
    private _addedKeyword: Effect | boolean;
    private _keywordType: 'battlecry' | 'deathrattle' | 'onAttack' | 'taunt' | 'rush';

    constructor(keyword: Effect | boolean, keywordType: 'battlecry' | 'deathrattle' | 'onAttack' | 'taunt' | 'rush', resolver: TargetResolver | null)
    {
        super(resolver);
        this._addedKeyword = keyword;
        this._keywordType = keywordType;
    }

    private addKeywordToMinion(minion: MinionCard): void
    {
        if (this._keywordType === 'taunt' || this._keywordType === 'rush')
        {
            minion.effects[this._keywordType] = this._addedKeyword as boolean;
        }
        else
        {
            minion.effects[this._keywordType] = this._addedKeyword as Effect;
        }
    }

    execute(context: GameContext): void
    {
        if (this.resolver && this.resolver.requiresInput)
        {
            if (context.target && context.target instanceof MinionCard)
            {
                this.addKeywordToMinion(context.target);
            }
        }
        else if (this.resolver)
        {
            const targets: Targetable[] = this.resolver.resolve(context);
            for (const target of targets)
            {
                if (target instanceof MinionCard)
                {
                    this.addKeywordToMinion(target);
                }
            }
        }
    }
}

export class silenceEffect extends Effect
{
    constructor(resolver: TargetResolver)
    {
        super(resolver);
    }

    execute(context: GameContext): void
    {
        if (this.resolver && this.resolver.requiresInput)
        {
            if (context.target && context.target instanceof MinionCard)
            {
                context.target.effects = {};
            }
        }
        else if (this.resolver && !this.resolver.requiresInput)
        {
            const targets: Targetable[] = this.resolver.resolve(context);
            for (let target of targets)
            {
                if (target instanceof MinionCard)
                    target.effects = {};
            }
        }
    }
}

export class SummonMinionEffect extends Effect
{
    private _tokens: MinionCard[];
    private _amount: number;

    constructor(token: MinionCard[], amount: number)
    {
        super();
        this._amount = amount;
        this._tokens = token;
    }

    execute(context: GameContext): void
    {
        for (let i = 0; i < this._amount; i++)
        {
            if (this._tokens[i])
                context.engine.board.playMinion(context.owner.index, this._tokens[i].clone());
        }
    }
}

export class CombinedEffect extends Effect
{
    private effects: Effect[];

    constructor(effects: Effect[])
    {
        const firstResolver: TargetResolver | null = effects[0]?.resolver ?? null;
        let resolver: TargetResolver | null = null;
        if (firstResolver && firstResolver.requiresInput)
            resolver = firstResolver;
        super(resolver);
        this.effects = effects;
    }

    execute(context: GameContext): void
    {
        for (const effect of this.effects)
            effect.execute(context);
    }
}

export class RandomMissileEffect extends Effect
{
    private _amount: number;
    private _damage: number;

    constructor(amount: number, damage: number, resolver: TargetResolver)
    {
        super(resolver);
        this._amount = amount;
        this._damage = damage;
    }

    execute(context: GameContext): void
    {
        for (let i = 0; i < this._amount; i++)
        {
            if (this.resolver && !this.resolver.requiresInput)
            {
                let target = this.resolver.resolve(context);
                if (target.length === 0)
                    break;
                if (target[0].isAlive())
                {
                    target[0].takeDamage(this._damage);
                    context.engine.recordDamage(target[0], this._damage, context.engine.findOwnerById(target[0].id));
                }
                else
                    i--;
            }
        }
    }
}

export class triggerDeathrattleEffect extends Effect
{
    constructor(resolver: TargetResolver)
    {
        super(resolver);
    }

    execute(context: GameContext): void
    {
        if (this.resolver && this.resolver.requiresInput)
        {
            if (context.target && context.target instanceof MinionCard)
            {
                if (context.target.effects.deathrattle)
                    context.target.effects.deathrattle.execute(context);
            }
        }
        else if (this.resolver && !this.resolver.requiresInput)
        {
            let targets = this.resolver.resolve(context);
            for (let target of targets)
            {
                if (target instanceof MinionCard && target.effects.deathrattle)
                    target.effects.deathrattle.execute(context);
            }
        }
    }
}

export class timmyDamageEffect extends Effect
{
    constructor(resolver: TargetResolver)
    {
        super(resolver);
    }

    execute(context: GameContext): void
    {
        let damage: number = context.owner.hero.currentHealth - 20;

        if (damage < 0)
            damage = 0;
        let effect = new DamageEffect(damage, this.resolver);
        effect.execute(context);    
    }
}

export class archiDamageEffect extends Effect
{
    constructor(resolver: TargetResolver)
    {
        super(resolver);
    }

    execute(context: GameContext): void
    {
        if (context.owner.archimedeCount >= 6)
        {
            let effect = new DamageEffect(50, this.resolver)
            effect.execute(context);
        }
    }
}

export class lifestealEffect extends Effect
{
    constructor()
    {
        super();
    }
    execute(context: GameContext): void
    {
        if (context.source instanceof MinionCard)
        {
            let healEffect = new HealEffect(context.source.attack, new PlayerHeroResolver());
            healEffect.execute(context);
        }
    }
}

export class destroyEffect extends Effect
{
    constructor(resolver: TargetResolver)
    {
        super(resolver);
    }

    execute(context: GameContext): void
    {
        if (this.resolver && this.resolver.requiresInput)
        {
            if (context.target && context.target instanceof MinionCard)
            {
                let amount = context.target.currentHealth;
                let effect = new DamageEffect(amount, this.resolver);
                effect.execute(context);
            }
        }
        else if (this.resolver && !this.resolver.requiresInput)
        {
            let targets = this.resolver.resolve(context);
            for (let target of targets)
            {
                if (target.isAlive())
                {
                    let amount = target.currentHealth;
                    let effect = new DamageEffect(amount, this.resolver);
                    effect.execute(context);
                }
            }
        }
    }
}

