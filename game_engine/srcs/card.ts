import { Effect } from "./effect";
import { legendary } from "./legendary";

// Cards are built from DB rows (cardImport/cardLoader.ts) then cloned per game / simulation.
export abstract class Card
{
    public readonly name:        string;
    public readonly manaCost:    number;
    public readonly description: string;
    public readonly id: string;
    public readonly assetKey: string;
    public readonly rarity: string;
    private legendaryPassive: legendary | undefined;

    constructor(name: string, manaCost: number, description: string, id: string, legendaryPassive?: legendary, assetKey: string = "placeholder_card", rarity: string = "Commune")
    {
        this.name = name;
        this.manaCost = manaCost;
        this.description = description;
        this.id = id;
        this.legendaryPassive = legendaryPassive;
        this.assetKey = assetKey;
        this.rarity = rarity;
    }

    getLeg(): legendary | undefined
    {
        return this.legendaryPassive;
    }

    // Copy that keeps the id (deck/hand cards stay addressable by id).
    abstract cloneCopy(): Card;
}

// Minion hooks; undefined when the card doesn't have them.
interface Keywords
{
    battlecry?: Effect;
    deathrattle?: Effect;
    rush?: boolean;
    taunt?: boolean;
    cannotAttack?: boolean;
    onAttack?: Effect;
    endOfTurnEffect?: Effect;
    startOfTurnEffect?: Effect;
    archi?: boolean;
    onDamage?: Effect;
    spellpower?: number;
}

let nextTokenId: number = 0;

export class MinionCard extends Card
{
    public attack:    number;
    public maxHealth: number;
    public currentHealth:      number;
    public readonly baseAttack:    number;
    public readonly baseMaxHealth: number;
    public canAttack:          boolean = false;
    public effects:            Keywords = {};
    public jeffeBuff: boolean = false;

    constructor(id: string = "", name: string, manaCost: number,
                description: string, attack: number,
                maxHealth: number, effects: Keywords = {}, legendaryPassive?: legendary, assetKey: string = "placeholder_card",
                baseAttack: number = attack, baseMaxHealth: number = maxHealth, rarity: string = "Commune")
    {
        super(name, manaCost, description, id, legendaryPassive, assetKey, rarity);
        this.attack      = attack;
        this.maxHealth   = maxHealth;
        this.currentHealth = maxHealth;
        this.effects = effects;
        this.baseAttack = baseAttack;
        this.baseMaxHealth = baseMaxHealth;
    }

    // Copy with a fresh id: summoned tokens and board clones must stay independently targetable.
    clone(): MinionCard
    {
        const copy = new MinionCard(this.id + nextTokenId++, this.name, this.manaCost,
            this.description, this.attack, this.maxHealth, { ...this.effects }, this.getLeg(), this.assetKey,
            this.baseAttack, this.baseMaxHealth, this.rarity);
        copy.currentHealth = this.currentHealth;
        copy.canAttack     = this.canAttack;
        return copy;
    }

    isAlive(): boolean
    {
        return this.currentHealth > 0;
    }

    takeDamage(amount: number): void
    {
        this.currentHealth -= amount;
    }

    heal(amount: number): number
    {
        const before = this.currentHealth;
        this.currentHealth += amount;
        if (this.currentHealth > this.maxHealth)
            this.currentHealth = this.maxHealth;
        return this.currentHealth - before;
    }

    cloneCopy(): MinionCard
    {
        const copy = new MinionCard(this.id, this.name, this.manaCost, this.description,
                                    this.attack, this.maxHealth, this.effects, undefined, this.assetKey,
                                    this.baseAttack, this.baseMaxHealth, this.rarity);
        copy.currentHealth = this.currentHealth;
        copy.canAttack     = this.canAttack;
        return copy;
    }
}

export class SpellCard extends Card
{
    public readonly effect: Effect;

    constructor(id: string = "", name: string, manaCost: number, description: string, effect: Effect, legendaryPassive?: legendary, assetKey: string = "placeholder_card", rarity: string = "Commune")
    {
        super(name, manaCost, description, id, legendaryPassive, assetKey, rarity);
        this.effect = effect;
    }

    cloneCopy(): SpellCard
    {
        return new SpellCard(this.id, this.name, this.manaCost, this.description, this.effect, undefined, this.assetKey, this.rarity);
    }
}
