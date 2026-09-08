import { Effect } from "./effect";
import { legendary } from "./legendary";

// Card hierarchy: abstract Card holds identity (id/name/mana/description/rarity) shared by both
// concrete kinds — MinionCard (attack/health plus a Keywords bag of hooks: battlecry, deathrattle,
// onAttack, startOfTurnEffect, etc., each an Effect from effect.ts) and SpellCard (a single Effect
// fired on play). Cards are built once from DB rows (cardImport/cardLoader.ts) and then cloned per
// game instance/simulation — see clone() vs cloneCopy() below, which differ in whether the id is
// preserved.
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

    abstract getType(): string;

    toString(): string
    {
        return "[" + this.getType() + "] " + this.name + " (" + this.manaCost + " mana) - " + this.description;
    }

    //-----

    abstract cloneCopy(): Card;
}

//effects added on minions, all null if not added
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
    //onMinionDamage?: Effect;
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

    getType(): string
    {
        return "Minion";
    }

    // Mints a fresh id (module-level counter) instead of keeping the original — needed since
    // SummonMinionEffect clones the same token MinionCard template on every fire (e.g. each
    // Mother Spider death), and Board.clone() uses this (not cloneCopy()) when GameEngine.clone()
    // snapshots the board for an MCTS branch. Each copy needs its own id to stay independently
    // targetable.
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

    toString(): string
    {
        return "[Minion] " + this.name + " (" + this.manaCost + " mana) "
            + this.attack + "/" + this.currentHealth + " - " + this.description;
    }

    //-----

    // Keeps the original id, unlike clone() above — used for Deck/Hand cards, whose identity
    // (e.g. "the card the client says it's playing, looked up by id") must survive Deck.clone()/
    // Hand.clone() and Player.clone().
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

    getType(): string
    {
        return "Spell: " + this.description;
    }

    //-----

    cloneCopy(): SpellCard
    {
        return new SpellCard(this.id, this.name, this.manaCost, this.description, this.effect, undefined, this.assetKey, this.rarity);
    }
}