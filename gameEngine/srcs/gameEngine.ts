import { MinionCard, SpellCard } from "./card";
import { Board } from "./board";
import { Player } from "./player";
import { GameContext } from "./effect";
import { Targetable } from "./target";
import { Effect } from "./effect";
import { Hero } from "./hero";

export interface DamageRecord
{
    target: Targetable;
    amount: number;
}

export interface effectTrigger
{
    sourceId: string;
    trigger: "passive" | "battlecry" | "deathrattle";
}

export interface ActionResult
{
    succes: boolean;
    damageEvents: DamageRecord[];
    effectEvents: effectTrigger[];
}

export class GameEngine
{
    public readonly players: [Player, Player];
    public board: Board;
    public currentTurn: 0 | 1;
    private damageEvents: DamageRecord[] = [];
    private effectEvents: effectTrigger[] = [];

    constructor(players: [Player, Player])
    {
        this.players = players;
        this.board = new Board();
        this.currentTurn = 0;
    }

    startGame(): void
    {
        for (let i = 0; i < 2; i++)
        {
            this.players[i].deck.shuffle();
            for (let j = 0; j < 3; j++)
                this.players[i].drawCard();
        }
        this.startTurn();
    }

    startTurn(): ActionResult
    {
        const player: Player = this.activePlayer();
        player.gainMana();
        player.drawCard();

        const minions: MinionCard[] = this.board.getMinions(this.currentTurn);
        for (const minion of minions)
        {
            minion.canAttack = true;
            if (minion.effects.rush && minion.effects.rush == true)
                minion.effects.rush = false;
            if (minion.effects.startOfTurnEffect !== undefined)
            {
                let context: GameContext = { engine: this, owner: this.activePlayer(), source: minion, target: undefined };
                minion.effects.startOfTurnEffect.execute(context);
                this.effectEvents.push({ sourceId: minion.id, trigger: "passive" });
                this.processDeaths();
            }
        }
        return {succes: true, damageEvents: this.damageEvents, effectEvents: this.effectEvents};
    }

    endTurn(): ActionResult
    {
        this.damageEvents = [];
        this.effectEvents = [];
        const minions: MinionCard[] = this.board.getMinions(this.currentTurn);
        for (const minion of minions)
        {
            if (minion.effects.endOfTurnEffect !== undefined)
            {
                let context: GameContext = { engine: this, owner: this.activePlayer(), source: minion, target: undefined };
                minion.effects.endOfTurnEffect.execute(context);
                this.effectEvents.push({ sourceId: minion.id, trigger: "passive" });
                this.processDeaths();
            }
        }
        this.currentTurn = this.currentTurn === 0 ? 1 : 0;
        this.startTurn(); // effects and events caused by start turn are ignored right now
        return {succes: true, damageEvents: this.damageEvents, effectEvents: this.effectEvents};
    }

    playCard(cardIndex: number, targets: Map<Effect, Targetable | null>, boardIndex?: number): ActionResult
    {
        this.damageEvents = [];
        this.effectEvents = [];
        const player = this.activePlayer();
        const card = player.hand.getCards()[cardIndex];

        if (!card || card.manaCost > player.currentMana)
            return { succes: false, damageEvents: [], effectEvents: [] };

        player.hand.play(cardIndex);
        player.spendMana(card.manaCost);

        if (card instanceof MinionCard)
        {
            if (boardIndex !== undefined)
                this.board.playMinion(this.currentTurn, card, boardIndex);
            else
                this.board.playMinion(this.currentTurn, card);
            if (card.effects.battlecry)
            {
                let context: GameContext = {engine: this, owner: this.activePlayer(), source: card, target: targets.get(card.effects.battlecry) ?? undefined};
                card.effects.battlecry.execute(context);
                this.effectEvents.push({ sourceId: card.id, trigger: "battlecry" });
            }
            else if (card.effects.rush)
                card.canAttack = true;
        }
        else if (card instanceof SpellCard)
        {
            let context: GameContext = {engine: this, owner: this.players[this.currentTurn], source: card, target: targets.get(card.effect) ?? undefined};
            card.effect.execute(context);
        }
        this.processDeaths();
        return { succes: true, damageEvents: this.damageEvents, effectEvents: this.effectEvents };
    }

    attackWithMinion(attackerIndex: number, target: Targetable): ActionResult
    {
        this.effectEvents = [];
        this.damageEvents = [];
        const opponentIndex: 0 | 1 = this.currentTurn === 0 ? 1 : 0;
        const attacker: MinionCard = this.board.getMinions(this.currentTurn)[attackerIndex];

        if (!attacker || !attacker.canAttack)
            return { succes: false, damageEvents: [], effectEvents: [] };

        attacker.canAttack = false;

        if (attacker.effects.onAttack && attacker.effects.onAttack.resolver && !attacker.effects.onAttack.resolver.requiresInput)
        {
            let context: GameContext = { engine: this, owner: this.players[this.currentTurn], source: attacker };
            attacker.effects.onAttack.execute(context);
            this.effectEvents.push({ sourceId: attacker.id, trigger: "passive" });
        }
        if (target instanceof Hero)
        {
            this.players[opponentIndex].hero.takeDamage(attacker.attack);
            this.recordDamage(this.players[opponentIndex].hero, attacker.attack);
        }

        else if (target instanceof MinionCard)
        {
            attacker.takeDamage(target.attack);
            this.recordDamage(target, attacker.attack);
            target.takeDamage(attacker.attack);
            this.recordDamage(attacker, target.attack);
        }

        this.processDeaths();
        this.checkWinCondition();
        return { succes: true, damageEvents: this.damageEvents, effectEvents: this.effectEvents };
    }

    activePlayer(): Player
    {
        return this.players[this.currentTurn];
    }

    checkWinCondition(): boolean
    {
        for (const player of this.players)
        {
            if (!player.hero.isAlive())
            {
                return true;
            }        
        }
        return false;
    }

    processDeaths(): void
    {
        const opponentIndex: 0 | 1 = this.currentTurn === 0 ? 1 : 0;

        while (true)
        {
            const deadCurrent: MinionCard[] = this.board.collectDead(this.currentTurn);
            const deadOpponent: MinionCard[] = this.board.collectDead(opponentIndex);

            if (deadCurrent.length === 0 && deadOpponent.length === 0)
                break;

            this.board.clearDead(this.currentTurn);
            this.board.clearDead(opponentIndex);

            for (const minion of deadCurrent)
            {
                if (minion.effects.deathrattle)
                {
                    const context: GameContext = { engine: this, owner: this.players[this.currentTurn], source: minion };
                    minion.effects.deathrattle.execute(context);
                    this.effectEvents.push({ sourceId: minion.id, trigger: "deathrattle" });
                }
            }
            for (const minion of deadOpponent)
            {
                if (minion.effects.deathrattle)
                {
                    const ctx: GameContext = { engine: this, owner: this.players[opponentIndex], source: minion };
                    minion.effects.deathrattle.execute(ctx);
                    this.effectEvents.push({ sourceId: minion.id, trigger: "deathrattle" });
                }
            }
        }
    }

    recordDamage(target: Targetable, amount: number)
    {
        this.damageEvents.push({ target, amount });
    }

    toString(): string
    {
        return this.players[0].toString() + "\n"
             + this.players[1].toString() + "\n"
             + "---\n"
             + this.board.toString();
    }
}
