import { Card, MinionCard, SpellCard } from "./card";
import { GameEngine } from "./gameEngine";
import { Player } from "./player";
import { PlayerHeroResolver, Targetable, TargetResolver } from "./target";
import { Hero } from "./hero";

// Everything an effect needs when it runs. `target` is the player's validated choice when the
// resolver requires input; `bonusDamage` is the caster's spellpower.
export interface GameContext
{
    engine: GameEngine;
    owner: Player;
    source: Card;
    target?: Targetable;
    bonusDamage?: number;
}

// Base of every card effect. Pattern shared by most subclasses: with an input resolver act on
// context.target, otherwise act on every target the resolver returns. Effects report what they
// did through engine.record*() so the client can animate it.
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
        const amount = this._amount + (context.bonusDamage ?? 0);

        if (this.resolver && this.resolver.requiresInput)
        {
            if (context.target)
            {
                context.target.takeDamage(amount);
                context.engine.recordDamage(context.target, amount, context.engine.findOwnerById(context.target.id));
            }
        }
        else if (this.resolver)
        {
            const targets = this.resolver.resolve(context);
            for (let target of targets)
            {
                target.takeDamage(amount);
                context.engine.recordDamage(target, amount, context.engine.findOwnerById(target.id));
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
            {
                const healed = context.target.heal(this._amount);
                if (healed > 0)
                    context.engine.recordHeal(context.target, healed);
            }
        }
        else if (this.resolver)
        {
            const targets = this.resolver.resolve(context);
            for (let target of targets)
            {
                const healed = target.heal(this._amount);
                if (healed > 0)
                    context.engine.recordHeal(target, healed);
            }
        }
    }
}

// +atk/+health on minions; heroes only get the health part.
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

    private apply(context: GameContext, target: Targetable): void
    {
        const shouldRecord = this._attackBuff !== 0 || this._healthBuff !== 0;

        if (target instanceof MinionCard)
        {
            target.currentHealth += this._healthBuff;
            target.maxHealth += this._healthBuff;
            target.attack += this._attackBuff;
            if (target.attack < 0)
                target.attack = 0;
            if (shouldRecord)
                context.engine.recordBuff(target, this._attackBuff, this._healthBuff);
        }
        else if (target instanceof Hero)
        {
            target.currentHealth += this._healthBuff;
            target.maxHealth += this._healthBuff;
            if (shouldRecord)
                context.engine.recordBuff(target, 0, this._healthBuff);
        }
    }

    execute(context: GameContext): void
    {
        if (this.resolver && this.resolver.requiresInput)
        {
            if (context.target)
                this.apply(context, context.target);
        }
        else if (this.resolver)
        {
            for (const target of this.resolver.resolve(context))
                this.apply(context, target);
        }
    }
}

// Buff scaled by how many targets countResolver finds.
export class CountScaledBuffEffect extends Effect
{
    private _perAtk: number;
    private _perHealth: number;
    private _countResolver: TargetResolver;

    constructor(perAtk: number, perHealth: number, countResolver: TargetResolver, targetResolver: TargetResolver)
    {
        super(targetResolver);
        this._perAtk = perAtk;
        this._perHealth = perHealth;
        this._countResolver = countResolver;
    }

    execute(context: GameContext): void
    {
        const count = this._countResolver.resolve(context).length;
        new BuffEffect(this._perAtk * count, this._perHealth * count, this.resolver).execute(context);
    }
}

type AddableKeyword = 'battlecry' | 'deathrattle' | 'onAttack' | 'taunt' | 'rush' | 'endOfTurnEffect';

// Gives minions a keyword (boolean) or a hook (Effect).
export class AddEffectfEffect extends Effect
{
    private _addedKeyword: Effect | boolean;
    private _keywordType: AddableKeyword;

    constructor(keyword: Effect | boolean, keywordType: AddableKeyword, resolver: TargetResolver | null)
    {
        super(resolver);
        this._addedKeyword = keyword;
        this._keywordType = keywordType;
    }

    private addKeywordToMinion(minion: MinionCard): void
    {
        if (this._keywordType === 'taunt' || this._keywordType === 'rush')
            minion.effects[this._keywordType] = this._addedKeyword as boolean;
        else
            minion.effects[this._keywordType] = this._addedKeyword as Effect;
    }

    execute(context: GameContext): void
    {
        if (this.resolver && this.resolver.requiresInput)
        {
            if (context.target && context.target instanceof MinionCard)
                this.addKeywordToMinion(context.target);
        }
        else if (this.resolver)
        {
            for (const target of this.resolver.resolve(context))
            {
                if (target instanceof MinionCard)
                    this.addKeywordToMinion(target);
            }
        }
    }
}

// Removes all keywords and resets stats to the printed values.
export class silenceEffect extends Effect
{
    constructor(resolver: TargetResolver)
    {
        super(resolver);
    }

    private resetStats(target: MinionCard): void
    {
        target.attack = target.baseAttack;
        if (target.maxHealth > target.baseMaxHealth)
        {
            const excess = target.maxHealth - target.baseMaxHealth;
            target.maxHealth = target.baseMaxHealth;
            target.currentHealth -= excess;
        }

        // A silenced cannotAttack minion may attack right away.
        const wasCannotAttack = !!target.effects.cannotAttack;

        target.effects = {};

        if (wasCannotAttack)
            target.canAttack = true;
    }

    execute(context: GameContext): void
    {
        if (this.resolver && this.resolver.requiresInput)
        {
            if (context.target && context.target instanceof MinionCard)
                this.resetStats(context.target);
        }
        else if (this.resolver)
        {
            for (let target of this.resolver.resolve(context))
            {
                if (target instanceof MinionCard)
                    this.resetStats(target);
            }
        }
    }
}

// Summons clones of the token templates while the board has room.
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
            if (this._tokens[i] && context.engine.board.getMinions(context.owner.index).length < 6)
            {
                const summoned: MinionCard = this._tokens[i].clone();
                context.engine.board.playMinion(context.owner.index, summoned);
                context.engine.recordAnimationChain({ kind: "summon", minion: summoned, playerIndex: context.owner.index });
                if (summoned.effects.rush && !summoned.effects.cannotAttack)
                    summoned.canAttack = true;
            }
        }
    }
}

// Runs several effects in order. At most one of them may require a target.
export class CombinedEffect extends Effect
{
    private effects: Effect[];

    constructor(effects: Effect[])
    {
        const inputResolver: TargetResolver | null =
            effects.find(e => e.resolver && e.resolver.requiresInput)?.resolver ?? null;
        super(inputResolver);
        this.effects = effects;
    }

    execute(context: GameContext): void
    {
        for (const effect of this.effects)
            effect.execute(context);
    }
}

// `amount` hits of `damage`, each on a fresh pick from the resolver.
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
        const damage = this._damage + (context.bonusDamage ?? 0);

        for (let i = 0; i < this._amount; i++)
        {
            if (this.resolver && !this.resolver.requiresInput)
            {
                let target = this.resolver.resolve(context);
                if (target.length === 0)
                    break;
                if (target[0].isAlive())
                {
                    target[0].takeDamage(damage);
                    context.engine.recordDamage(target[0], damage, context.engine.findOwnerById(target[0].id));
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
                    context.target.effects.deathrattle.execute({ ...context, source: context.target });
            }
        }
        else if (this.resolver)
        {
            for (let target of this.resolver.resolve(context))
            {
                if (target instanceof MinionCard && target.effects.deathrattle)
                    target.effects.deathrattle.execute({ ...context, source: target });
            }
        }
    }
}

export class triggerEndOfTurnEffect extends Effect
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
                context.engine.triggerMinionEndOfTurnEffect(context.owner.index, context.target);
        }
        else if (this.resolver)
        {
            for (let target of this.resolver.resolve(context))
            {
                if (target instanceof MinionCard)
                    context.engine.triggerMinionEndOfTurnEffect(context.owner.index, target);
            }
        }
    }
}

// Timmy's battlecry: damage equal to the hero's health above 20.
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

// Archimede's battlecry: 50 damage once 6 "archi" cards have been played.
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

// Minion: heals the hero for its attack. Spell: heals `amount` per minion on the board.
export class lifestealEffect extends Effect
{
    amount: number;

    constructor(amount: number = 0)
    {
        super();
        this.amount = amount;
    }

    execute(context: GameContext): void
    {
        if (context.source instanceof MinionCard)
        {
            let healEffect = new HealEffect(context.source.attack, new PlayerHeroResolver());
            healEffect.execute(context);
        }
        else if (context.source instanceof SpellCard)
        {
            let boardMinions = [...context.engine.board.getMinions(0), ...context.engine.board.getMinions(1)]
            let total = this.amount * boardMinions.length;
            new HealEffect(total, new PlayerHeroResolver()).execute(context);
        }
    }
}

// Deals damage equal to the target's remaining health.
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
        else if (this.resolver)
        {
            for (let target of this.resolver.resolve(context))
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

// Sets the lower hero's health to the higher one's; both players draw.
export class equalHealthEffect extends Effect
{
    constructor()
    {
        super();
    }

    execute(context: GameContext): void
    {
        const heroA: Hero = context.engine.players[0].hero;
        const heroB: Hero = context.engine.players[1].hero;
        const higher: Hero = heroA.currentHealth >= heroB.currentHealth ? heroA : heroB;
        const lower:  Hero = higher === heroA ? heroB : heroA;

        lower.currentHealth = higher.currentHealth;

        context.engine.players[0].drawCard();
        context.engine.players[1].drawCard();
    }
}

// onAttack: also hits the neighbors of the attacked minion.
export class cleaveEffect extends Effect
{
    constructor()
    {
        super();
    }

    execute(context: GameContext): void
    {
        if (!(context.source instanceof MinionCard) || !(context.target instanceof MinionCard))
            return;

        const targetOwner: Player | undefined = context.engine.findOwnerById(context.target.id);
        if (!targetOwner)
            return;

        const board: MinionCard[] = context.engine.board.getMinions(targetOwner.index);
        const targetIndex: number = board.indexOf(context.target);
        if (targetIndex === -1)
            return;

        const amount: number = context.source.attack;
        for (const neighbor of [board[targetIndex - 1], board[targetIndex + 1]])
        {
            if (neighbor)
            {
                neighbor.takeDamage(amount);
                context.engine.recordDamage(neighbor, amount, targetOwner);
            }
        }
    }
}

// endOfTurn: heals the source back to full.
export class regenerationEffect extends Effect
{
    constructor()
    {
        super();
    }

    execute(context: GameContext): void
    {
        if (context.source instanceof MinionCard)
        {
            const healed = context.source.heal(context.source.maxHealth);
            if (healed > 0)
                context.engine.recordHeal(context.source, healed);
        }
    }
}
