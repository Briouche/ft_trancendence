import { MinionCard } from "./card";

const MAX_BOARD_SIZE: number = 6;

// Owns each player's row of minions. Array order IS board position — index 0 is the left-most
// slot — and that ordering is load-bearing: NeighboringMinionsResolver (target.ts) and
// cleaveEffect (effect.ts) find "adjacent" minions purely by array index, not by any separate
// position field. playMinion's optional `index` param exists so a card can be inserted at a
// specific board slot (e.g. the position the client says it was dropped on) instead of always
// appending.
export class Board
{
    private minions: [MinionCard[], MinionCard[]];

    constructor()
    {
        this.minions = [[], []];
    }

    playMinion(playerIndex: 0 | 1, minion: MinionCard, index: number = -1): boolean
    {
        if (this.minions[playerIndex].length >= MAX_BOARD_SIZE)
        {
            return false;
        }
        if (index == -1)
            this.minions[playerIndex].push(minion);
        else
            this.minions[playerIndex].splice(index, 0, minion);
        return true;
    }

    getMinions(playerIndex: 0 | 1): MinionCard[]
    {
        return this.minions[playerIndex];
    }

    collectDead(playerIndex: 0 | 1): MinionCard[]
    {
        const dead: MinionCard[] = [];
        for (const minion of this.minions[playerIndex])
        {
            if (!minion.isAlive())
                dead.push(minion)
        }
        return dead;
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

    //-----

    clone(): Board
    {
        const copy = new Board();
        copy.minions = [
            this.minions[0].map(m => m.clone()),
            this.minions[1].map(m => m.clone())
        ];
        return copy;
    }
}
