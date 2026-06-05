export abstract class Card
{
    public readonly name:        string;
    public readonly manaCost:    number;
    public readonly description: string;

    constructor(name: string, manaCost: number, description: string)
    {
        this.name        = name;
        this.manaCost    = manaCost;
        this.description = description;
    }

    abstract getType(): string;

    PrintCard(): string
    {
        return "[" + this.getType() + "] " + this.name + " (" + this.manaCost + " mana) - " + this.description;
    }
}

export class MinionCard extends Card
{
    public readonly attack:    number;
    public readonly maxHealth: number;
    public currentHealth:      number;
    public canAttack:          boolean = false;

    constructor(name: string, manaCost: number, description: string, attack: number, maxHealth: number)
    {
        super(name, manaCost, description);
        this.attack      = attack;
        this.maxHealth   = maxHealth;
        this.currentHealth = maxHealth;
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

    PrintCard(): string
    {
        return "[Minion] " + this.name + " (" + this.manaCost + " mana) "
            + this.attack + "/" + this.currentHealth + " - " + this.description;
    }
}

export class SpellCard extends Card
{
    public readonly effect: (targets: any) => void; //any should change, placeholder for just not checking incoming type

    constructor(name: string, manaCost: number, description: string, effect: (targets: any) => void)
    {
        super(name, manaCost, description);
        this.effect = effect;
    }

    getType(): string
    {
        return "Spell";
    }
}
