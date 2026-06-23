const STARTING_HEALTH: number = 20;

export class Hero
{
    public readonly name:  string;
    public currentHealth:  number;

    constructor(name: string)
    {
        this.name          = name;
        this.currentHealth = STARTING_HEALTH;
    }

    takeDamage(amount: number): void
    {
        this.currentHealth -= amount;
    }

    heal(amount: number): void
    {
        if (this.currentHealth + amount > STARTING_HEALTH)
            this.currentHealth = STARTING_HEALTH;
        else
            this.currentHealth += amount;
    }

    isAlive(): boolean
    {
        return this.currentHealth > 0;
    }

    toString(): string
    {
        return this.name + " (" + this.currentHealth + "/" + STARTING_HEALTH + " HP)";
    }
}
