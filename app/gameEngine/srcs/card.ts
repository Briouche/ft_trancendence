import { Effect } from "./effect";
import { legendary } from "./legendary";

export abstract class Card
{
    public readonly name:        string;
    public readonly manaCost:    number;
    public readonly description: string;
    public readonly id: string;
    private legendaryPassive: legendary | undefined;

    constructor(name: string, manaCost: number, description: string, id: string, legendaryPassive?: legendary)
    {
        this.name = name;
        this.manaCost = manaCost;
        this.description = description;
        this.id = id;
        this.legendaryPassive = legendaryPassive;
    }

    getLeg(): legendary | undefined
    {
        return this.legendaryPassive;
    }

    abstract getType(): string;

    toString(): string
    {
        return "[" + this.getType() + "] " + this.name + " (" + this.manaCost + " mana) - " + this.description;
    }

    //-----

    abstract cloneCopy(): Card;
}

//effects added on minions, all null if not added
interface MinionEffects
{
    battlecry?: Effect;
    deathrattle?: Effect;
    //onDamage?: Effect;
    //onMinionDamage?: Effect;
    //onAttack?: Effect;
}

//effects added on minions, all null if not added
interface Keywords
{
    battlecry?: Effect;
    deathrattle?: Effect;
    rush?: boolean;
    taunt?: boolean;
    onAttack?: Effect;
    endOfTurnEffect?: Effect;
    startOfTurnEffect?: Effect;
    archi?: boolean;
    onDamage?: Effect;
    //onMinionDamage?: Effect;
}

let nextTokenId: number = 0;

export class MinionCard extends Card
{
    public attack:    number;
    public maxHealth: number;
    public currentHealth:      number;
    public canAttack:          boolean = false;
    public effects:            Keywords = {};
    public jeffeBuff: boolean = false;

    constructor(id: string = "", name: string, manaCost: number,
                description: string, attack: number,
                maxHealth: number, effects: Keywords = {}, legendaryPassive?: legendary)
    {
        super(name, manaCost, description, id, legendaryPassive);
        this.attack      = attack;
        this.maxHealth   = maxHealth;
        this.currentHealth = maxHealth;
        this.effects = effects;
    }

    getType(): string
    {
        return "Minion";
    }

    clone(): MinionCard
    {
        return new MinionCard(this.id + nextTokenId++, this.name, this.manaCost,
            this.description, this.attack, this.maxHealth, { ...this.effects }, this.getLeg());
    }

    isAlive(): boolean
    {
        return this.currentHealth > 0;
    }

    takeDamage(amount: number): void
    {
        this.currentHealth -= amount;
    }

	heal(amount: number): void
	{
		this.currentHealth += amount;
		if (this.currentHealth > this.maxHealth)
			this.currentHealth = this.maxHealth;
	}

    toString(): string
    {
        return "[Minion] " + this.name + " (" + this.manaCost + " mana) "
            + this.attack + "/" + this.currentHealth + " - " + this.description;
    }

    //-----

    cloneCopy(): MinionCard
    {
        const copy = new MinionCard(this.id, this.name, this.manaCost, this.description,
                                    this.attack, this.maxHealth, this.effects);
        copy.currentHealth = this.currentHealth;
        copy.canAttack     = this.canAttack;
        return copy;
    }
}

export class SpellCard extends Card
{
    public readonly effect: Effect;

    constructor(id: string = "", name: string, manaCost: number, description: string, effect: Effect, legendaryPassive?: legendary)
    {
        super(name, manaCost, description, id, legendaryPassive);
        this.effect = effect;
    }

    getType(): string
    {
        return "Spell: " + this.description;
    }

    //-----

    cloneCopy(): SpellCard
    {
        return new SpellCard(this.id, this.name, this.manaCost, this.description, this.effect);
    }
}