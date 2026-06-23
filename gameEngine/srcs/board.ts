import { MinionCard } from "./card";

const MAX_BOARD_SIZE: number = 6;

export class Board
{
    private minions: [MinionCard[], MinionCard[]];

    constructor()
    {
        this.minions = [[], []];
    }

    playMinion(playerIndex: 0 | 1, minion: MinionCard): boolean
    {
        if (this.minions[playerIndex].length >= MAX_BOARD_SIZE)
        {
            console.log("Board is full! Can't play more minions.");
            return false;
        }
        this.minions[playerIndex].push(minion);
        return true;
    }

    getMinions(playerIndex: 0 | 1): MinionCard[]
    {
        return this.minions[playerIndex];
    }

    clearDead(playerIndex: 0 | 1): void
    {
        const alive: MinionCard[] = [];
        for (const minion of this.minions[playerIndex])
        {
            if (minion.isAlive())
                alive.push(minion);
        }
        this.minions[playerIndex] = alive;
    }

    toString(): string
    {
        let result: string = "";

        result += "Player 1 board:\n";
        if (this.minions[0].length === 0)
            result += "  (empty)\n";
        else
        {
            for (const minion of this.minions[0])
                result += "  " + minion.name + " " + minion.attack + "/" + minion.currentHealth + "\n";
        }

        result += "Player 2 board:\n";
        if (this.minions[1].length === 0)
            result += "  (empty)\n";
        else
        {
            for (const minion of this.minions[1])
                result += "  " + minion.name + " " + minion.attack + "/" + minion.currentHealth + "\n";
        }

        return result;
    }
}
