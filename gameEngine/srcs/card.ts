import { Effect } from "./effect";

export abstract class Card
{
    public readonly name:        string;
    public readonly manaCost:    number;
    public readonly description: string;
    public readonly id: string;

    constructor(name: string, manaCost: number, description: string, id: string)
    {
        this.name = name;
        this.manaCost = manaCost;
        this.description = description;
        this.id = id;
    }

    abstract getType(): string;

    toString(): string
    {
        return "[" + this.getType() + "] " + this.name + " (" + this.manaCost + " mana) - " + this.description;
    }
}

//effects added on minions, all null if not added
interface Keywords
{
    battlecry?: Effect;
    deathrattle?: Effect;
    rush?: boolean;
    taunt?: boolean;
    onAttack?: Effect;
    //onDamage?: Effect;
    //onMinionDamage?: Effect;
}

export class MinionCard extends Card
{
    public attack:    number;
    public maxHealth: number;
    public currentHealth:      number;
    public canAttack:          boolean = false;
    public effects:            Keywords = {};

    constructor(id: string = "", name: string, manaCost: number,
                description: string, attack: number,
                maxHealth: number, effects: Keywords = {})
    {
        super(name, manaCost, description, id);
        this.attack      = attack;
        this.maxHealth   = maxHealth;
        this.currentHealth = maxHealth;
        this.effects = effects;
    }

    getType(): string
    {
        return "Minion";
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
}

export class SpellCard extends Card
{
    public readonly effect: Effect;

    constructor(id: string = "", name: string, manaCost: number, description: string, effect: Effect)
    {
        super(name, manaCost, description, id);
        this.effect = effect;
    }

    getType(): string
    {
        return "Spell: " + this.description;
    }
}
