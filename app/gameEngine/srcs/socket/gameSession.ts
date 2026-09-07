import { ActionResult, AnimationEvent, GameEngine } from "../gameEngine";
import { Socket } from "socket.io";
import { Player } from "../player";
import { ClientMessage, ServerMessage, TargetOption, TargetPrompt, GameEvent } from "../shared/protocol";
import { toClientState, toClientCard } from "./toClientState";
import { Card, MinionCard, SpellCard } from "../card";
import { Effect } from "../effect";
import { Targetable, EnemyCharacterResolver } from "../target";
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
    private static readonly RECONNECT_GRACE_MS = 30000;

    private engine: GameEngine;
    private seats: [Seat, Seat];
    private pending: PendingTarget | null = null;
    private gameOver : boolean = false;
    private difficulty: Difficulty;
    private readonly onGameEnd: () => void;
    private disconnectTimers: [NodeJS.Timeout | null, NodeJS.Timeout | null] = [null, null];

    constructor(seat0: Seat, seat1: Seat, player0: Player, player1: Player, difficulty: Difficulty = "moyen", onGameEnd: () => void = () => {})
    {
        this.difficulty = difficulty;
        this.onGameEnd = onGameEnd;
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

    // True if `socketId` belongs to one of this session's human seats — used both to route a
    // reconnecting socket back to its own game and to refuse spinning up a second game for a
    // socket that's already live in one (see serverSocket.ts).
    hasSocket(socketId: string): boolean
    {
        return this.seats.some(seat => seat.kind === "human" && seat.socket.id === socketId);
    }

    // Called when a socket carrying an id already known to this session reconnects (same
    // Socket.IO connection-state-recovery id, new Socket object). Rebinds the seat to the new
    // socket, re-attaches its message handler (the old socket's listener died with it), cancels
    // any pending forfeit timer, and resends state so the client can rehydrate.
    reconnect(socket: Socket): 0 | 1 | -1
    {
        const idx = this.seats.findIndex(seat => seat.kind === "human" && seat.socket.id === socket.id);

        if (idx === -1)
            return -1;

        const playerIndex = idx as 0 | 1;

        if (this.disconnectTimers[playerIndex])
        {
            clearTimeout(this.disconnectTimers[playerIndex]!);
            this.disconnectTimers[playerIndex] = null;
        }

        this.seats[playerIndex] = { kind: "human", socket };
        socket.on("message", (msg: ClientMessage) => this.handle(playerIndex, msg));

        this.send(playerIndex, { type: "assigned", playerIndex });
        this.send(playerIndex, { type: "state", state: toClientState(this.engine, playerIndex) });

        if (this.pending && this.pending.playerIndex === playerIndex)
        {
            const options: TargetOption[] = [...this.pending.optionsById.values()].map((t: Targetable) => this.targetToOption(t));
            this.send(playerIndex, { type: "prompt", prompt: { forCardId: this.pending.id, options } });
        }

        return playerIndex;
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
        this.onGameEnd();
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
                if (card instanceof SpellCard)
                {
                    this.reject(playerIndex, "no valid targets");
                    return;
                }
                continue;
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
        this.broadcastAnimationEvents(result.animationEvents);
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

        const player: Player = this.engine.players[playerIndex];

        const cardIndex: number = player.hand.getCards().findIndex((c: Card) => c.id === pending.id);

        if (cardIndex === -1)
        {
            this.pending = null;
            this.reject(playerIndex, "card no longer in hand");
            return;
        }

        const card: Card = player.hand.getCards()[cardIndex];

        let target: Targetable | undefined = undefined;

        if (targetId === null)
        {
            if (card instanceof SpellCard)
            {
                this.pending = null;
                this.reject(playerIndex, "target selection cancelled");
                return;
            }
            // minion battlecry: proceed without a target, the battlecry will no-op
        }
        else
        {
            target = pending.optionsById.get(targetId);

            if (target === undefined)
            {
                this.pending = null;
                this.reject(playerIndex, "illegal target");
                return;
            }

            const context = { engine: this.engine, owner: player, source: card };
            const currentValidTargets: Targetable[] = pending.effect.resolver!.resolve(context);
            const stillLegal: boolean = currentValidTargets.includes(target);

            if (!stillLegal)
            {
                this.pending = null;
                this.reject(playerIndex, "target is no longer legal");
                return;
            }
        }

        const targets: Map<Effect, Targetable | null> = new Map();

        for (const effect of this.getOnPlayEffects(card))
        {
            if (effect === pending.effect)
                targets.set(effect, target ?? null);
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
        this.broadcastAnimationEvents(result.animationEvents);
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
        this.broadcastEvent({ type: "attack", attackerId, targetId, playerIndex });
        this.broadcastAnimationEvents(result.animationEvents);
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

    // Doesn't end the game immediately — starts a grace period so the same player can rejoin
    // (see reconnect()) after a transient drop. Only forfeits if they don't come back in time.
    handleDisconnect(socket: Socket): void
    {
        if (this.gameOver)
            return;

        const seatIndex: number = this.seats.findIndex(
            (seat: Seat) => seat.kind === "human" && seat.socket.id === socket.id
        );

        if (seatIndex === -1)
            return;

        const playerIndex = seatIndex as 0 | 1;

        if (this.disconnectTimers[playerIndex])
            return;

        this.disconnectTimers[playerIndex] = setTimeout(() =>
        {
            this.disconnectTimers[playerIndex] = null;
            this.forfeit(playerIndex);
        }, GameSession.RECONNECT_GRACE_MS);
    }

    private forfeit(loserIndex: 0 | 1): void
    {
        if (this.gameOver)
            return;

        this.gameOver = true;
        const winnerIndex: 0 | 1 = loserIndex === 0 ? 1 : 0;
        this.send(winnerIndex, { type: "gameOver", winner: "you" });
        this.send(loserIndex, { type: "gameOver", winner: "opponent" });
        this.onGameEnd();
    }

    handleEndTurn()
    {
        let result: ActionResult;

        result = this.engine.endTurn();
        this.pending = null;
        this.broadcastAnimationEvents(result.animationEvents);
        this.broadcastEvent({ type: "turnEnded", nextPlayerIndex: this.engine.currentTurn as 0 | 1 });
        this.broadcastState();
        this.checkGameOver();
        this.runAiTurnLoop();
    }

    private async runAiTurnLoop(): Promise<void>
    {
        const { simulations, worlds } = DIFFICULTY_PRESETS[this.difficulty];

        while (!this.gameOver && this.seats[this.engine.currentTurn].kind === "ai")
        {
            let action: Action;
            
            action = await getBestAction(this.engine, simulations, worlds);
            
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
        let result: ActionResult;

        switch (action.type)
        {
            case "playCard":
            {
                const playerIndex = this.engine.currentTurn;
                const player: Player = this.engine.players[playerIndex];
                const card: Card = player.hand.getCards()[action.cardIndex];
                const targets: Map<Effect, Targetable | null> = new Map();

                result = this.engine.playCard(action.cardIndex, targets);
                if (result.succes)
                    this.broadcastEvent({ type: "cardPlayed", cardId: card.id, playerIndex, card: toClientCard(card) });
                break;
            }
            case "attack":
            {
                const target: Targetable = this.resolveAiTarget(action.targetIndex);
                result = this.engine.attackWithMinion(action.attackerIndex, target);
                let attacker = this.engine.board.getMinions(this.engine.currentTurn)[action.attackerIndex].id;
                if (result.succes)
                    this.broadcastEvent({ type: "attack", attackerId: attacker, targetId: target.id, playerIndex: this.engine.currentTurn });
                break;
            }
            case "endTurn":
            {
                result = this.engine.endTurn();
                this.broadcastAnimationEvents(result.animationEvents);
                this.broadcastEvent({ type: "turnEnded", nextPlayerIndex: this.engine.currentTurn as 0 | 1 });
                break;
            }
        }

        this.broadcastAnimationEvents(result.animationEvents);
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

    private broadcastAnimationEvents(events: AnimationEvent[]): void
    {
        for (const event of events)
        {
            switch (event.kind)
            {
                case "summon":
                    this.broadcastEvent({ type: "summon", minionId: event.minion.id, playerIndex: event.playerIndex, card: toClientCard(event.minion) });
                    break;
                case "damage":
                    this.broadcastEvent({ type: "damage", targetId: this.targetToOption(event.target).id, amount: event.amount, targetDied: !event.target.isAlive() });
                    break;
                case "heal":
                    this.broadcastEvent({ type: "heal", targetId: this.targetToOption(event.target).id, amount: event.amount });
                    break;
                case "buff":
                    this.broadcastEvent({ type: "buff", targetId: this.targetToOption(event.target).id, attackDelta: event.attackDelta, healthDelta: event.healthDelta });
                    break;
                case "effect":
                    this.broadcastEvent({ type: "effect", minionId: event.sourceId, playerIndex: this.findOwnerIndex(event.sourceId), trigger: event.trigger });
                    break;
                case "death":
                    this.broadcastEvent({ type: "minionDied", minionId: event.minionId, playerIndex: event.playerIndex });
                    break;
            }
        }
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