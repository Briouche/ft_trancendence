// A player's health pool; a Targetable like minions (see target.ts).
export class Hero
{
    public readonly name: string;
    public maxHealth: number = 20;
    public currentHealth: number;
    public readonly id: string = "";

    constructor(name: string, id: string = "")
    {
        this.name = name;
        this.id = id;
        this.currentHealth = this.maxHealth;
    }

    takeDamage(amount: number): void
    {
        this.currentHealth -= amount;
    }

    heal(amount: number): number
    {
        const before = this.currentHealth;
        if (this.currentHealth + amount > this.maxHealth)
            this.currentHealth = this.maxHealth;
        else
            this.currentHealth += amount;
        return this.currentHealth - before;
    }

    isAlive(): boolean
    {
        return this.currentHealth > 0;
    }

    // Keeps the id (targets are matched by id) and maxHealth (Timmy's passive raises it).
    clone(): Hero
    {
        const copy = new Hero(this.name, this.id);
        copy.maxHealth = this.maxHealth;
        copy.currentHealth = this.currentHealth;
        return copy;
    }
}
