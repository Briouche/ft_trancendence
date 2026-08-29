import { ActionResult, effectTrigger, GameEngine } from "../gameEngine";
import { Socket } from "socket.io";
import { Player } from "../player";
import { Hero }       from "../hero";
import { ClientMessage, ServerMessage, TargetOption, TargetPrompt, GameEvent } from "../shared/protocol";
import { toClientState, toClientCard } from "./toClientState";
import { Card, MinionCard, SpellCard } from "../card";
import { Effect } from "../effect";
import { Targetable, EnemyCharacterResolver } from "../target";
import { DamageRecord } from "../gameEngine";
import { getBestAction } from "../ai/mcts";
import { Action } from "../ai/types";
import { DIFFICULTY_PRESETS, Difficulty } from "../ai/types";

export type Seat = { kind: "human"; socket: Socket } | { kind: "ai" };

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
    private seats: [Seat, Seat];
    private pending: PendingTarget | null = null;
    private gameOver : boolean = false;
    private difficulty: Difficulty;

    constructor(seat0: Seat, seat1: Seat, player0: Player, player1: Player, difficulty: Difficulty = "moyen")
    {   
        this.difficulty = difficulty;
        this.seats = [seat0, seat1];
        console.log("Game Starting... with " + seat0.kind + " and " + seat1.kind);
        this.engine = new GameEngine([player0, player1]);
        this.bindHandlers();
        this.send(0, { type: "assigned", playerIndex: 0 });
        this.send(1, { type: "assigned", playerIndex: 1 });
        console.log("players assigned... game starting!");
        this.engine.startGame();
        this.broadcastState();
        this.runAiTurnLoop();
    }

    private bindHandlers(): void
    {
        this.seats.forEach((seat, playerIndex) =>
        {
            if (seat.kind === "human")
                seat.socket.on("message", (msg: ClientMessage) => this.handle(playerIndex as 0 | 1, msg));
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
        const seat: Seat = this.seats[playerIndex];

        if (seat.kind === "human")
            seat.socket.emit("message", msg);
    }

    private reject(playerIndex: number, reason: string): void
    {
        this.send(playerIndex, { type: "rejected", reason });
    }

    private broadcastEvent(event: GameEvent): void
    {
        this.send(0, { type: "event", event });
        this.send(1, { type: "event", event });
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

        const result = this.engine.playCard(cardIndex, targets, boardIndex);
        if (!result.succes)
        {
            this.reject(playerIndex, "unable to play card");
            return;
        }
        this.broadcastEvent({ type: "cardPlayed", cardId: card.id, playerIndex, boardIndex, card: toClientCard(card) });
        this.broadcastEffectEvents(result.effectEvents);
        this.broadcastDamageEvents(result.damageEvents);
        for (let i = 0; i < result.damageEvents.length; i++)
        {
            if (!result.damageEvents[i].target.isAlive() && result.damageEvents[i].target instanceof MinionCard)
                this.broadcastEvent({type: "minionDied", minionId: result.damageEvents[i].target.id, playerIndex: playerIndex});
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

        const result = this.engine.playCard(cardIndex, targets, pending.boardIndex);
        if (!result.succes)
        {
            this.reject(playerIndex, "unable to play card");
            return;
        }
        this.broadcastEvent({ type: "cardPlayed", cardId: card.id, playerIndex, card: toClientCard(card) });
        this.broadcastEffectEvents(result.effectEvents);
        this.broadcastDamageEvents(result.damageEvents);
        for (let i = 0; i < result.damageEvents.length; i++)
        {
            if (!result.damageEvents[i].target.isAlive() && result.damageEvents[i].target instanceof MinionCard)
                this.broadcastEvent({type: "minionDied", minionId: result.damageEvents[i].target.id, playerIndex: playerIndex});
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

        const result = this.engine.attackWithMinion(attackerIndex, target);
        if (!result.succes)
        {
            this.reject(playerIndex, "unsuccesful attack");
            return;
        }
        const damage = attacker.attack;
        const targetDied = !this.isTargetAlive(target);

        this.broadcastEvent({ type: "attack", attackerId, targetId, playerIndex });
        this.broadcastEffectEvents(result.effectEvents);
        this.broadcastDamageEvents(result.damageEvents);
        if (targetDied && target instanceof MinionCard)
            this.broadcastEvent({ type: "minionDied", minionId: target.id, playerIndex: playerIndex });
        if (!attacker.isAlive())
            this.broadcastEvent({ type: "minionDied", minionId: attackerId, playerIndex: playerIndex });
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

    handleDisconnect(socket: Socket): void
    {
        const seatIndex: number = this.seats.findIndex(
            (seat: Seat) => seat.kind === "human" && seat.socket === socket
        );

        if (seatIndex === -1)
            return;

        const winnerSeat: Seat = this.seats[1 - seatIndex];

        if (winnerSeat.kind === "human")
            winnerSeat.socket.emit("message", { type: "gameOver", winner: "you" });
    }

    handleEndTurn()
    {
        let result: ActionResult;
        let playerIndex : 0 | 1 = this.engine.currentTurn as 0 | 1;

        result = this.engine.endTurn();
        this.pending = null;
        this.broadcastEffectEvents(result.effectEvents);
        this.broadcastDamageEvents(result.damageEvents);
        for (let i = 0; i < result.damageEvents.length; i++)
        {
            if (!result.damageEvents[i].target.isAlive() && result.damageEvents[i].target instanceof MinionCard)
                this.broadcastEvent({type: "minionDied", minionId: result.damageEvents[i].target.id, playerIndex: playerIndex});
        }
        this.broadcastEvent({ type: "turnEnded", nextPlayerIndex: this.engine.currentTurn as 0 | 1 });
        this.broadcastState();
        this.runAiTurnLoop();
    }

    private async runAiTurnLoop(): Promise<void>
    {
        const { simulations, worlds } = DIFFICULTY_PRESETS[this.difficulty];

        while (!this.gameOver && this.seats[this.engine.currentTurn].kind === "ai")
        {
            let action: Action;

            //bug where getBestAction never comes back, added timeout to cardLoader so no infinite wait 
            //isnt a real solution because it still fails, just end turn?
            try
            {
                action = await getBestAction(this.engine, simulations, worlds);
            }
            catch (err)
            {
                console.error("AI turn failed, ending turn instead of hanging:", err);
                action = { type: "endTurn" };
            }

            this.applyAiAction(action);

            if (action.type !== "endTurn")
                await this.delay(1500);
        }
    }

    private delay(ms: number): Promise<void>
    {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private applyAiAction(action: Action): void
    {
        switch (action.type)
        {
            case "playCard":
            {
                const targets: Map<Effect, Targetable | null> = new Map();
                this.engine.playCard(action.cardIndex, targets);
                break;
            }
            case "attack":
            {
                const target: Targetable = this.resolveAiTarget(action.targetIndex);
                this.engine.attackWithMinion(action.attackerIndex, target);
                break;
            }
            case "endTurn":
                this.engine.endTurn();
                break;
        }

        this.broadcastState();
        this.checkGameOver();
    }

    private resolveAiTarget(targetIndex: number): Targetable
    {
        const opponentIndex: 0 | 1 = (1 - this.engine.currentTurn) as 0 | 1;

        if (targetIndex === -1)
            return this.engine.players[opponentIndex].hero;

        return this.engine.board.getMinions(opponentIndex)[targetIndex];
    }

    private targetToOption(target: Targetable): TargetOption
    {
        if (target instanceof MinionCard)
            return { id: target.id, type: "minion" };

        const ownerIndex: number = this.engine.players[0].hero === target ? 0 : 1;
        const heroId = this.engine.players[ownerIndex].hero.id || `hero-${ownerIndex}`;
        return { id: heroId, type: "hero" };
    }

    private isTargetAlive(target: Targetable): boolean
    {
        if (target instanceof MinionCard)
            return (target as any).isAlive ? (target as any).isAlive() : (target as any).health > 0;
        return (target as Hero).isAlive();
    }

    private broadcastDamageEvents(damageEvents: DamageRecord[]): void
    {
        for (const record of damageEvents)
        {
            const option = this.targetToOption(record.target);
            const alive = record.target.isAlive();

            this.broadcastEvent({ type: "damage", targetId: option.id, amount: record.amount, targetDied: !alive });

            if (!alive && record.target instanceof MinionCard)
            {
                const ownerIndex = this.findOwnerIndex(record.target.id);
                if (ownerIndex !== undefined)
                    this.broadcastEvent({ type: "minionDied", minionId: record.target.id, playerIndex: ownerIndex });
            }
        }
    }

    private broadcastEffectEvents(effectEvents: effectTrigger[])
    {
        for (const record of effectEvents)
            this.broadcastEvent({ type: "effect", minionId: record.sourceId, playerIndex: this.findOwnerIndex(record.sourceId), trigger: record.trigger });
    }

    private findOwnerIndex(targetId: string): 0 | 1
    {
        const target: Targetable = [...this.engine.board.getMinions(0), ...this.engine.board.getMinions(1),
            this.engine.players[0].hero, this.engine.players[1].hero].find((candidate: Targetable) => candidate.id === targetId)!;

        if (target instanceof MinionCard)
        {
            if (this.engine.board.getMinions(0).includes(target))
                return 0;
            if (this.engine.board.getMinions(1).includes(target))
                return 1;
        }
        return this.engine.players[0].hero === target ? 0 : 1;
    }
}