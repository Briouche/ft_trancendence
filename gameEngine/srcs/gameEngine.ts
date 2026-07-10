import { MinionCard, SpellCard } from "./card";
import { Board } from "./board";
import { Player } from "./player";
import { GameContext } from "./effect";

export class GameEngine
{
    public readonly players: [Player, Player];
    public board:            Board;
    public currentTurn:      0 | 1;

    constructor(players: [Player, Player])
    {
        this.players     = players;
        this.board       = new Board();
        this.currentTurn = 0;
    }

    startGame(): void
    {
        console.log("=== Game Start ===");
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
            minion.canAttack = true;
    }

    endTurn(): void
    {
        this.currentTurn = this.currentTurn === 0 ? 1 : 0;
        this.startTurn();
    }

    playCard(cardIndex: number): boolean
    {
        const player: Player = this.activePlayer();
        const card           = player.hand.getCards()[cardIndex];

        if (!card || card.manaCost > player.currentMana)
            return false;

        player.hand.play(cardIndex);
        player.spendMana(card.manaCost);

        if (card instanceof MinionCard)
        {
            this.board.playMinion(this.currentTurn, card);
            if (card.effects.battlecry)
            {
                let context: GameContext = {engine: this, owner: this.activePlayer(), source: card};
                card.effects.battlecry.execute(context);
            }
        }
        else if (card instanceof SpellCard)
        {
            let context: GameContext = { engine: this, owner: this.players[this.currentTurn], source: card };
            card.effect.execute(context);
            this.processDeaths();
        }

        return true;
    }

    // targetIndex -1 = attack hero directly
    attackWithMinion(attackerIndex: number, targetIndex: number): boolean
    {
        const opponentIndex: 0 | 1 = this.currentTurn === 0 ? 1 : 0;
        const attacker: MinionCard = this.board.getMinions(this.currentTurn)[attackerIndex];

        if (!attacker)
        {
            return false;
        }
        if (!attacker.canAttack)
        {
            return false;
        }

        attacker.canAttack = false;

        if (targetIndex === -1)
        {
            const enemyHero = this.players[opponentIndex].hero;
            enemyHero.takeDamage(attacker.attack);
        }
        else
        {
            const target: MinionCard = this.board.getMinions(opponentIndex)[targetIndex];
            if (!target)
            {
                return false;
            }

            attacker.takeDamage(target.attack);
            target.takeDamage(attacker.attack);
            
            this.processDeaths();
        }

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
                console.log("\n=== " + player.hero.name + " has been defeated! Game over. ===");
            }        
        }
    }

    processDeaths(): void
    {
        const opponentIndex: 0 | 1 = this.currentTurn === 0 ? 1 : 0;
        // loop until no more deaths
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
}
