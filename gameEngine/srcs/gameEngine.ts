import { MinionCard, SpellCard } from "./card";
import { Board } from "./board";
import { Player } from "./player";
import { GameContext } from "./effect";
import { Targetable } from "./target";
import { Effect } from "./effect";
import { Hero } from "./hero";

export type Action =
    | { type: "playCard"; cardIndex: number }
    | { type: "attack"; attackerIndex: number; targetIndex: number }
    | { type: "endTurn" };


export class GameEngine
{
    public readonly players: [Player, Player];
    public board: Board;
    public currentTurn: 0 | 1;

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

    startTurn(): void
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
        }
    }

    endTurn(): void
    {
        this.currentTurn = this.currentTurn === 0 ? 1 : 0;
        this.startTurn();
    }

    playCard(cardIndex: number, targets: Map<Effect, Targetable | null>, boardIndex?: number): boolean
    {
        const player = this.activePlayer();
        const card = player.hand.getCards()[cardIndex];

        if (!card || card.manaCost > player.currentMana)
            return false;

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
        return true;
    }

    attackWithMinion(attackerIndex: number, target: Targetable): boolean
    {
        const opponentIndex: 0 | 1 = this.currentTurn === 0 ? 1 : 0;
        const attacker: MinionCard = this.board.getMinions(this.currentTurn)[attackerIndex];

        if (!attacker || !attacker.canAttack)
            return false;

        attacker.canAttack = false;

        if (attacker.effects.onAttack && attacker.effects.onAttack.resolver && !attacker.effects.onAttack.resolver.requiresInput)
        {
            let context: GameContext = { engine: this, owner: this.players[this.currentTurn], source: attacker };
            attacker.effects.onAttack.execute(context);
        }
        if (target instanceof Hero)
            this.players[opponentIndex].hero.takeDamage(attacker.attack);

        else if (target instanceof MinionCard)
        {
            attacker.takeDamage(target.attack);
            target.takeDamage(attacker.attack);
        }

        this.processDeaths();
        this.checkWinCondition();
        return true;
    }

    activePlayer(): Player
    {
        return this.players[this.currentTurn];
    }

    checkWinCondition(): void
    {
        for (const player of this.players)
        {
            if (!player.hero.isAlive())
            {
                //console.log("\n=== " + player.hero.name + " has been defeated! Game over. ===");
            }        
        }
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
                }
            }
            for (const minion of deadOpponent)
            {
                if (minion.effects.deathrattle)
                {
                    const ctx: GameContext = { engine: this, owner: this.players[opponentIndex], source: minion };
                    minion.effects.deathrattle.execute(ctx);
                }
            }
        }
    }

    toString(): string
    {
        return this.players[0].toString() + "\n"
             + this.players[1].toString() + "\n"
             + "---\n"
             + this.board.toString();
    }

    clone(): GameEngine
    {
        const copy = new GameEngine([this.players[0].clone(), this.players[1].clone()]);
        copy.board       = this.board.clone();
        copy.currentTurn = this.currentTurn;
        return copy;
    }

    //getLegalActions() duplicates the mana/canAttack checks already inside playCard()/attackWithMinion().
    //If either of those changes, this needs to change with it — flag it now so it doesn't silently drift.
    
    getLegalActions(): Action[]
    {
        const actions: Action[] = [];
        const player: Player = this.activePlayer();
        const opponentIndex: 0 | 1 = this.currentTurn === 0 ? 1 : 0;

        const hand = player.hand.getCards();
        for (let i = 0; i < hand.length; i++)
        {
            if (hand[i].manaCost <= player.currentMana)
                actions.push({ type: "playCard", cardIndex: i });
        }

        const attackers = this.board.getMinions(this.currentTurn);
        const targets    = this.board.getMinions(opponentIndex);
        for (let i = 0; i < attackers.length; i++)
        {
            if (!attackers[i].canAttack)
                continue;
            actions.push({ type: "attack", attackerIndex: i, targetIndex: -1 });
            for (let t = 0; t < targets.length; t++)
                actions.push({ type: "attack", attackerIndex: i, targetIndex: t });
        }

        actions.push({ type: "endTurn" });
        return actions;
    }

    isTerminal(): boolean
    {
        return !this.players[0].hero.isAlive() || !this.players[1].hero.isAlive();
    }

    getWinner(): 0 | 1 | null
    {
        const p0Alive = this.players[0].hero.isAlive();
        const p1Alive = this.players[1].hero.isAlive();

        if (!p0Alive && !p1Alive)
            return null;
        if (!p0Alive)
            return 1;
        if (!p1Alive)
            return 0;
        return null;
    }
}

