import { Card } from "./card";
import { GameEngine } from "./gameEngine";
import { Player } from "./player";

export interface GameContext
{
    engine: GameEngine;
    owner: Player;
    source: Card;
}

export abstract class Effect
{
    abstract execute(context: GameContext): void;
}

export class DrawCardEffect extends Effect
{
    private _amount: number;

    constructor(amount: number)
    {
        super();
        this._amount = amount;
    }

    execute(context: GameContext): void 
    {
        for (let i = 0; i < this._amount; i++)
            context.owner.drawCard();
    }
}

