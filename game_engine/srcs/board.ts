import { MinionCard } from "./card";

/** Minions per side of the board. */
export const MAX_BOARD_SIZE: number = 6;

/**
 * Both rows of minions. Array order is board position: neighbors (target.ts, cleaveEffect) are
 * adjacent indices.
 */
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
            return false;
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
        return this.minions[playerIndex].filter(minion => !minion.isAlive());
    }

    clearDead(playerIndex: 0 | 1): void
    {
        this.minions[playerIndex] = this.minions[playerIndex].filter(minion => minion.isAlive());
    }

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
