
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

    heal(amount: number): void
    {
        if (this.currentHealth + amount > this.maxHealth)
            this.currentHealth = this.maxHealth;
        else
            this.currentHealth += amount;
    }

    isAlive(): boolean
    {
        return this.currentHealth > 0;
    }

    toString(): string
    {
        return this.name + " (" + this.currentHealth + "/" + this.maxHealth + " HP)";
    }

    //-----

    clone(): Hero
    {
        const copy = new Hero(this.name);
        copy.currentHealth = this.currentHealth;
        return copy;
    }
}
