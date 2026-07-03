import { MinionCard, SpellCard } from "./card";
import { Board } from "./board";
import { Player } from "./player";

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

        console.log("\n=== " + player.hero.name + "'s turn ===");
        console.log(this.toString());
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

        if (!card)
        {
            console.log("No card at that index.");
            return false;
        }
        if (card.manaCost > player.currentMana)
        {
            console.log("Not enough mana. Need " + card.manaCost + ", have " + player.currentMana + ".");
            return false;
        }

        player.hand.play(cardIndex);
        player.spendMana(card.manaCost);

        if (card instanceof MinionCard)
        {
            this.board.playMinion(this.currentTurn, card);
            console.log(player.hero.name + " plays minion: " + card.name);
        }
        else if (card instanceof SpellCard)
        {
            console.log(player.hero.name + " casts spell: " + card.name);
            card.effect({ engine: this, caster: player });
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
            console.log("No minion at that position.");
            return false;
        }
        if (!attacker.canAttack)
        {
            console.log(attacker.name + " summoning sickness");
            return false;
        }

        attacker.canAttack = false;

        if (targetIndex === -1)
        {
            const enemyHero = this.players[opponentIndex].hero;
            enemyHero.takeDamage(attacker.attack);
            console.log(attacker.name + " attacks " + enemyHero.name + " for " + attacker.attack + " damage.");
        }
        else
        {
            const target: MinionCard = this.board.getMinions(opponentIndex)[targetIndex];
            if (!target)
            {
                console.log("No enemy minion at that position.");
                return false;
            }

            attacker.takeDamage(target.attack);
            target.takeDamage(attacker.attack);
            console.log(attacker.name + " attacks " + target.name + ".");

            this.board.clearDead(this.currentTurn);
            this.board.clearDead(opponentIndex);
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
                console.log("\n=== " + player.hero.name + " has been defeated! Game over. ===");
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
