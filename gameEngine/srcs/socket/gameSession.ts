import { GameEngine } from "../gameEngine";
import { Socket } from "socket.io";
import { Player } from "../player";
import { Hero }       from "../hero";
import { makeBasicDeck }       from "../deck";
import { ClientMessage, ServerMessage, TargetOption, TargetPrompt } from "../shared/protocol";
import { toClientState } from "./toClientState";
import { Card, MinionCard, SpellCard } from "../card";
import { Effect } from "../effect";
import { Targetable, EnemyCharacterResolver } from "../target";


interface PendingTarget
{
    id: string;
    playerIndex: number;
    boardIndex?: number;
    effect: Effect;
    optionsById: Map<string, Targetable>;
}

export class GameSession
{
    private engine: GameEngine;
    private sockets: [Socket, Socket];
    private pending: PendingTarget | null = null;
    private gameOver : boolean = false;

    constructor(sock0: Socket, sock1: Socket, player0: Player, player1: Player)
    {
        this.sockets = [sock0, sock1];
        this.engine = new GameEngine([player0, player1]);
        this.bindHandlers();
        this.send(0, { type: "assigned", playerIndex: 0 });
        this.send(1, { type: "assigned", playerIndex: 1 });
        console.log("players assigned... game starting!");
        this.engine.startGame();
        this.broadcastState();
    }

    private bindHandlers()
    {
        this.sockets.forEach((socket, playerIndex) =>
        {
            socket.on("message", (msg: ClientMessage) => this.handle(playerIndex as 0 | 1, msg));
        });
    }

    private handle(playerIndex: 0 | 1, msg: ClientMessage)
    {
        if (this.gameOver)
            return ;
        if (playerIndex !== this.engine.currentTurn)
        {
            this.reject(playerIndex, "not your turn");
            return;
        }

        if (this.pending !== null && msg.type !== "targetChoice")
        {
            this.reject(playerIndex, "waiting for target");
            //remove pending? 
            return ;
        }

        switch (msg.type)
        {
            case "playCard": 
                return this.handlePlayCard(playerIndex, msg.cardId, msg.boardIndex);
            case "attack": 
                return this.handleAttack(playerIndex, msg.attackerId, msg.targetId);
            case "endTurn": 
                return this.handleEndTurn();
            case "targetChoice": 
                return this.handleTargetChoice(playerIndex, msg.targetId);
        }
    }

    //end of game is not very clear yet?
    private checkGameOver()
    {
        if (this.gameOver)
            return ;

        const alive: [boolean, boolean] = [this.engine.players[0].hero.isAlive(), this.engine.players[1].hero.isAlive()];

        if (alive[0] && alive[1])
            return;

        this.gameOver = true;
        const winnerIndex: number = alive[0] ? 0 : 1;                            
        this.send(winnerIndex, { type: "gameOver", winner: "you" });
        this.send(1 - winnerIndex, { type: "gameOver", winner: "opponent" });
        return ;
    }

    private send(playerIndex: number, msg: ServerMessage): void
    {
        this.sockets[playerIndex].emit("message", msg);
    }

    private reject(playerIndex: number, reason: string): void
    {
        this.send(playerIndex, { type: "rejected", reason });
    }

    private broadcastState(): void
    {
        this.send(0, { type: "state", state: toClientState(this.engine, 0) });
        this.send(1, { type: "state", state: toClientState(this.engine, 1) });
    }

    private async handlePlayCard(playerIndex: 0 | 1, cardId: string, boardIndex?: number): Promise<void>
    {
        const player: Player = this.engine.players[playerIndex];
        const cardIndex: number = player.hand.getCards().findIndex((c: Card) => c.id === cardId);

        if (cardIndex === -1)
        {
            this.reject(playerIndex, "card not in hand");
            return;
        }

        const card: Card = player.hand.getCards()[cardIndex];
        if (card instanceof MinionCard)
        {
            if (boardIndex !== undefined && (boardIndex < 0 || boardIndex > this.engine.board.getMinions(playerIndex).length))
            {
                this.reject(playerIndex, "invalid board position");
                return;
            }
        }

        const effects: Effect[] =
            this.getOnPlayEffects(card);

        for (const effect of effects)
        {
            if (!effect.resolver || !effect.resolver.requiresInput)
                continue;

            const context = { engine: this.engine, owner: this.engine.players[playerIndex], source: card };
            const validTargets: Targetable[] = effect.resolver.resolve(context);

            if (validTargets.length === 0)
            {
                this.reject(playerIndex, "no valid targets");
                return;
            }

            this.beginTargeting(playerIndex, card, effect, validTargets, boardIndex);

            return;
        }

        const targets: Map<Effect, Targetable | null> = new Map();

        for (const effect of effects)
            targets.set(effect, null);

        if (!this.engine.playCard(cardIndex, targets, boardIndex))
        {
            this.reject(playerIndex, "unable to play card");
            return;
        }

        this.broadcastState();
        this.checkGameOver();
    }

    private beginTargeting(playerIndex: 0 | 1, card: Card, effect: Effect, validTargets: Targetable[], boardIndex?: number): void
    {
        const optionsById = new Map<string, Targetable>();

        const options: TargetOption[] = validTargets.map((target: Targetable) =>
            {
                const option: TargetOption = this.targetToOption(target);
                optionsById.set(option.id, target);
                return option;
            });

        const prompt: TargetPrompt = { forCardId: card.id, options };

        this.pending = { playerIndex, id: card.id, boardIndex, effect, optionsById };

        this.send(playerIndex, { type: "prompt", prompt });
        this.send(1 - playerIndex, { type: "state", state: toClientState( this.engine, (1 - playerIndex) as 0 | 1) });
    }

    private handleTargetChoice(playerIndex: 0 | 1, targetId: string | null): void
    {
        const pending: PendingTarget | null = this.pending;

        if (pending === null)
        {
            this.reject( playerIndex, "no target selection pending");
            return;
        }

        if (pending.playerIndex !== playerIndex)
        {
            this.reject( playerIndex, "not your turn");
            return;
        }

        //does cancellation work? add on esc or on right click
        if (targetId === null)
        {
            this.pending = null;

            this.reject(playerIndex, "target selection cancelled");
            return;
        }

        const target: Targetable | undefined = pending.optionsById.get(targetId);

        if (target === undefined)
        {
            this.pending = null;
            this.reject(playerIndex, "illegal target");
            return;
        }

        const player: Player = this.engine.players[playerIndex];

        const cardIndex: number = player.hand.getCards().findIndex((c: Card) => c.id === pending.id);

        if (cardIndex === -1)
        {
            this.pending = null;
            this.reject(playerIndex, "card no longer in hand");
            return;
        }

        const card: Card = player.hand.getCards()[cardIndex];
        const context = { engine: this.engine, owner: player, source: card };
        const currentValidTargets: Targetable[] = pending.effect.resolver!.resolve(context);
        const stillLegal: boolean = currentValidTargets.includes(target);

        if (!stillLegal)
        {
            this.pending = null;
            this.reject(playerIndex, "target is no longer legal");
            return;
        }

        const targets: Map<Effect, Targetable | null> = new Map();

        for (const effect of this.getOnPlayEffects(card))
        {
            if (effect === pending.effect)
                targets.set(effect, target);
            else
                targets.set(effect, null);
        }

        this.pending = null;

        if (!this.engine.playCard(cardIndex, targets, pending.boardIndex))
        {
            this.reject(playerIndex, "unable to play card");
            return;
        }

        this.broadcastState();
        this.checkGameOver();
    }

    private handleAttack(playerIndex: 0 | 1, attackerId: string, targetId: string): void
    {
        const minions: MinionCard[] = this.engine.board.getMinions(playerIndex);
        const attackerIndex: number = minions.findIndex((m: MinionCard) => m.id === attackerId);

        if (attackerIndex === -1)
        {
            this.reject(playerIndex, "attacker not found");
            return;
        }

        const attacker: MinionCard = minions[attackerIndex];

        if (!attacker.canAttack)
        {
            this.reject(playerIndex, "minion cannot attack");
            return;
        }

        const resolver: EnemyCharacterResolver = new EnemyCharacterResolver();
        const validTargets: Targetable[] = resolver.resolve({
            engine: this.engine,
            owner: this.engine.players[playerIndex],
            source: attacker,
        });

        const target: Targetable | undefined = validTargets.find(
            (t: Targetable) => this.targetToOption(t).id === targetId
        );

        if (target === undefined)
        {
            this.reject(playerIndex, "illegal target");
            return;
        }

        if (!this.engine.attackWithMinion(attackerIndex, target))
        {
            this.reject(playerIndex, "unsuccesful attack");
            return;
        }

        this.broadcastState();
        this.checkGameOver();
    }

    private getOnPlayEffects(card: Card): Effect[]
    {
        const effects: Effect[] = [];

        if (card instanceof SpellCard)
            effects.push(card.effect);

        if (card instanceof MinionCard && card.effects.battlecry)
            effects.push(card.effects.battlecry);

        return effects;
    }

    handleDisconnect(socket: Socket)
    {
        const winnerIndex = this.sockets[0] === socket ? 1 : 0;
        this.sockets[winnerIndex].emit("message", { type: "gameOver", winner: "you" });
    }

    handleEndTurn()
    {
        this.engine.endTurn();
        this.pending = null;
        this.broadcastState();
    }

    private targetToOption(target: Targetable): TargetOption
    {
        if (target instanceof MinionCard)
            return { id: target.id, type: "minion" };

        const ownerIndex: number = this.engine.players[0].hero === target ? 0 : 1;
        return { id: "hero-" + ownerIndex, type: "hero" };
    }
}
