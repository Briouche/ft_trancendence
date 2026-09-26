import { Action, ActionResult, AnimationEvent, GameEngine } from "../gameEngine";
import { Socket } from "socket.io";
import { Player } from "../player";
import { ClientMessage, ServerMessage, TargetOption, TargetPrompt, GameEvent } from "../shared/protocol";
import { toClientState, toClientCard } from "./toClientState";
import { Card, MinionCard, SpellCard } from "../card";
import { Effect } from "../effect";
import { Targetable, EnemyCharacterResolver } from "../target";
import { getBestAction } from "../ai/mcts";
import { DIFFICULTY_PRESETS, Difficulty } from "../ai/types";
import { recordWin, recordEloUpdate, WinCategory } from "../cardImport/cardLoader";

// userId is always present for a human seat: the socket is authenticated from the session cookie
// before any message is handled (see auth/session.ts), so a seat is tied to an account rather than
// to a connection that changes id on every reconnect.
export type Seat = { kind: "human"; socket: Socket; userId: number } | { kind: "ai" };

// How long a dropped human seat is held open before it forfeits. Long enough to survive the kind
// of brief blip that socket.io reconnects through on its own (flaky wifi, a laptop sleeping for a
// moment, a dev-server hiccup) without handing the opponent a free win.
const RECONNECT_GRACE_MS = 30_000;

// User counter credited for a win against the AI at each difficulty.
const DIFFICULTY_WIN_CATEGORY: Record<Difficulty, WinCategory> = {
    facile:    "winsVsAiEasy",
    moyen:     "winsVsAiMedium",
    difficile: "winsVsAiHard",
}

// Shape check of an in-game message before it reaches the engine: a string boardIndex, for one,
// would slip past the range check in handlePlayCard (string comparisons are always false).
function isWellFormed(msg: unknown): msg is ClientMessage
{
    if (typeof msg !== "object" || msg === null)
        return false;

    const m = msg as Record<string, unknown>;
    switch (m.type)
    {
        case "playCard":
            return typeof m.cardId === "string" && (m.boardIndex === undefined || Number.isSafeInteger(m.boardIndex));
        case "attack":
            return typeof m.attackerId === "string" && typeof m.targetId === "string";
        case "targetChoice":
            return m.targetId === null || typeof m.targetId === "string";
        default:
            return typeof m.type === "string";
    }
}

// A card play waiting for the player to pick a target.
interface PendingTarget
{
    id: string;
    playerIndex: number;
    boardIndex?: number;
    effect: Effect;
    optionsById: Map<string, Targetable>;
}

// One match: validates client messages, applies them to the engine, broadcasts events/state,
// runs the AI's turns, records the result.
export class GameSession
{
    private engine: GameEngine;
    private seats: [Seat, Seat];
    private pending: PendingTarget | null = null;
    private gameOver : boolean = false;
    private difficulty: Difficulty;
    private readonly onGameEnd: () => void;
    private disconnectTimers = new Map<number, ReturnType<typeof setTimeout>>();

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
        const startResult = this.engine.startGame();
        this.broadcastAnimationEvents(startResult.animationEvents);
        this.broadcastState();
        this.runAiTurnLoop();
    }

    // Matches the connection object itself, not its id: with connectionStateRecovery enabled a
    // recovered socket can come back under the *same* id as the dead one it replaced, so an id
    // comparison can't tell "this seat's current connection" from "the stale one that just died".
    hasSocket(socket: Socket): boolean
    {
        return this.seats.some(seat => seat.kind === "human" && seat.socket === socket);
    }

    // Identity-based counterpart to hasSocket. A socket.io reconnect hands the same player a brand
    // new socket id, so anything that needs to recognise a returning player (rejoining a match,
    // refusing a second concurrent game) has to match on the authenticated user instead.
    hasUser(userId: number): boolean
    {
        return this.seats.some(seat => seat.kind === "human" && seat.userId === userId);
    }

    // Swaps a returning player's new socket onto their existing seat and resumes the match:
    // cancels the forfeit timer, rebinds message handlers, and pushes the current state so the
    // client can rebuild its board. Nothing about the game is reloaded — the engine, both decks
    // and all board state stayed in memory the whole time.
    reattach(userId: number, socket: Socket): boolean
    {
        if (this.gameOver)
            return false;

        const found = this.seats.findIndex(seat => seat.kind === "human" && seat.userId === userId);
        if (found === -1)
            return false;

        const seatIndex = found as 0 | 1;
        const seat = this.seats[seatIndex];
        if (seat.kind !== "human")
            return false;

        const timer = this.disconnectTimers.get(seatIndex);
        if (timer)
        {
            clearTimeout(timer);
            this.disconnectTimers.delete(seatIndex);
        }

        // Guard against binding twice on one socket: a client that sends "ready" again on a
        // connection that is already seated (a retry, or a second mount of the scene) would
        // otherwise get two handlers, and every later move would be applied to the engine twice.
        // Re-sending assigned/state below is safe and wanted either way — it re-syncs the board.
        if (seat.socket !== socket)
        {
            seat.socket = socket;
            socket.on("message", (msg: ClientMessage) => this.handle(seatIndex, msg));
        }

        this.send(seatIndex, { type: "assigned", playerIndex: seatIndex });
        this.send(seatIndex, { type: "state", state: toClientState(this.engine, seatIndex, this.promptFor(seatIndex)) });
        this.send(1 - seatIndex, { type: "opponentReconnected" });

        console.log(`user ${userId} reattached to seat ${seatIndex}`);
        return true;
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
        if (this.gameOver || !isWellFormed(msg))
            return ;

        if (msg.type === "quit")
        {
            this.forfeit(playerIndex);
            return;
        }

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
        this.clearDisconnectTimers();
        const winnerIndex: 0 | 1 = alive[0] ? 0 : 1;
        this.send(winnerIndex, { type: "gameOver", winner: "you" });
        this.send(1 - winnerIndex, { type: "gameOver", winner: "opponent" });
        this.recordResult(winnerIndex);
        this.onGameEnd();
    }

    // Win counter for any human winner; Elo only for PvP.
    private recordResult(winnerIndex: 0 | 1): void
    {
        const winnerSeat = this.seats[winnerIndex];
        const loserSeat = this.seats[1 - winnerIndex];

        if (winnerSeat.kind !== "human")
            return;

        const category: WinCategory = loserSeat.kind === "ai" ? DIFFICULTY_WIN_CATEGORY[this.difficulty] : "winsVsPlayer";
        recordWin(winnerSeat.userId, category).catch(err => console.error("Failed to record win:", err));

        if (loserSeat.kind === "human" && loserSeat.userId !== null)
            recordEloUpdate(winnerSeat.userId, loserSeat.userId).catch(err => console.error("Failed to record Elo update:", err));
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
        this.send(0, { type: "state", state: toClientState(this.engine, 0, this.promptFor(0)) });
        this.send(1, { type: "state", state: toClientState(this.engine, 1, this.promptFor(1)) });
    }

    // Plays the card directly, or opens a target prompt when its effect needs one.
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

        const effects: Effect[] = this.getOnPlayEffects(card);

        for (const effect of effects)
        {
            if (!effect.resolver || !effect.resolver.requiresInput)
                continue;

            const context = { engine: this.engine, owner: this.engine.players[playerIndex], source: card };
            const validTargets: Targetable[] = effect.resolver.resolve(context);

            // No legal target: a spell is rejected, a battlecry no-ops.
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
        if (!result.success)
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
        const opponentIndex: 0 | 1 = (1 - playerIndex) as 0 | 1;
        this.send(opponentIndex, { type: "state", state: toClientState(this.engine, opponentIndex, this.promptFor(opponentIndex)) });
    }

    // null target: cancels a spell, plays a minion without its battlecry.
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
        if (!result.success)
        {
            this.reject(playerIndex, "unable to play card");
            return;
        }
        this.broadcastEvent({ type: "cardPlayed", cardId: card.id, playerIndex, card: toClientCard(card), targetId: target ? this.targetToOption(target).id : undefined });
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
        if (!result.success)
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

    // Starts the forfeit timer; reconnect() cancels it.
    handleDisconnect(socket: Socket): void
    {
        if (this.gameOver)
            return;

        // Same-object check as hasSocket: a seat that has already been handed a fresh connection
        // must not be put back into the grace window by the late disconnect of the socket it
        // replaced — that would forfeit a player who is sitting there playing.
        const seatIndex: number = this.seats.findIndex(
            (seat: Seat) => seat.kind === "human" && seat.socket === socket
        );

        if (seatIndex === -1)
            return;

        if (this.disconnectTimers.has(seatIndex))
            return;

        const timer = setTimeout(() =>
        {
            this.disconnectTimers.delete(seatIndex);
            console.log(`seat ${seatIndex} did not reconnect within ${RECONNECT_GRACE_MS}ms — forfeiting`);
            this.forfeit(seatIndex as 0 | 1);
        }, RECONNECT_GRACE_MS);

        this.disconnectTimers.set(seatIndex, timer);
        this.send(1 - seatIndex, { type: "opponentDisconnected", secondsRemaining: RECONNECT_GRACE_MS / 1000 });
    }

    private clearDisconnectTimers(): void
    {
        for (const timer of this.disconnectTimers.values())
            clearTimeout(timer);
        this.disconnectTimers.clear();
    }

    private forfeit(loserIndex: 0 | 1): void
    {
        if (this.gameOver)
            return;

        this.gameOver = true;
        this.clearDisconnectTimers();
        const winnerIndex: 0 | 1 = loserIndex === 0 ? 1 : 0;
        this.send(winnerIndex, { type: "gameOver", winner: "you" });
        this.send(loserIndex, { type: "gameOver", winner: "opponent" });
        this.recordResult(winnerIndex);
        this.onGameEnd();
    }

    handleEndTurn()
    {
        const { endOfTurn, startOfTurn } = this.engine.endTurn();
        this.pending = null;
        this.broadcastEvent({ type: "turnEnded", nextPlayerIndex: this.engine.currentTurn as 0 | 1 });
        this.broadcastAnimationEvents(endOfTurn.animationEvents);
        this.broadcastAnimationEvents(startOfTurn.animationEvents);
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

            try
            {
                action = await getBestAction(this.engine, simulations, worlds);
                this.applyAiAction(action);
            }
            catch (err)
            {
                console.error(`AI turn failed for player ${this.engine.currentTurn}, forcing endTurn to avoid a stuck game:`, err);
                try
                {
                    this.applyAiAction({ type: "endTurn" });
                }
                catch (endTurnErr)
                {
                    console.error("Forced endTurn also failed, aborting AI loop for this game:", endTurnErr);
                    break;
                }
                continue;
            }

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
        if (action.type === "endTurn")
        {
            const { endOfTurn, startOfTurn } = this.engine.endTurn();
            this.broadcastEvent({ type: "turnEnded", nextPlayerIndex: this.engine.currentTurn as 0 | 1 });
            this.broadcastAnimationEvents(endOfTurn.animationEvents);
            this.broadcastAnimationEvents(startOfTurn.animationEvents);
            this.broadcastState();
            this.checkGameOver();
            return;
        }

        let result: ActionResult;

        switch (action.type)
        {
            case "playCard":
            {
                const playerIndex = this.engine.currentTurn;
                const player: Player = this.engine.players[playerIndex];
                const card: Card = player.hand.getCards()[action.cardIndex];
                const targets: Map<Effect, Targetable | null> = new Map();
                const effect = this.engine.getOnPlayEffect(card);
                let target: Targetable | null = null;

                if (effect)
                {
                    target = action.targetIndex !== undefined
                        ? this.engine.getOnPlayTargets(card)[action.targetIndex] ?? null
                        : null;
                    targets.set(effect, target);
                }

                result = this.engine.playCard(action.cardIndex, targets);
                if (result.success)
                    this.broadcastEvent({ type: "cardPlayed", cardId: card.id, playerIndex, card: toClientCard(card), targetId: target ? this.targetToOption(target).id : undefined });
                break;
            }
            case "attack":
            {
                const target: Targetable = this.resolveAiTarget(action.targetIndex);
                const attackerId = this.engine.board.getMinions(this.engine.currentTurn)[action.attackerIndex]?.id;
                result = this.engine.attackWithMinion(action.attackerIndex, target);
                if (result.success && attackerId !== undefined)
                    this.broadcastEvent({ type: "attack", attackerId, targetId: this.targetToOption(target).id, playerIndex: this.engine.currentTurn });
                break;
            }
        }

        this.broadcastAnimationEvents(result.animationEvents);
        this.broadcastState();
        this.checkGameOver();
    }

    // targetIndex -1 is the enemy hero.
    private resolveAiTarget(targetIndex: number): Targetable
    {
        const opponentIndex: 0 | 1 = (1 - this.engine.currentTurn) as 0 | 1;

        if (targetIndex === -1)
            return this.engine.players[opponentIndex].hero;

        return this.engine.board.getMinions(opponentIndex)[targetIndex];
    }

    // The prompt a seat currently owes an answer to, if any — rebuilt so it can ride along with
    // the state instead of only existing in the one-shot "prompt" message, which is lost with the
    // connection that received it (see toClientState).
    //
    // Replayed from the options captured when the prompt was raised rather than re-resolved:
    // handleTargetChoice only accepts ids still in `optionsById`, so building this list from
    // anywhere else could offer a target the server would then turn around and reject. Dead
    // targets are dropped because there is no point highlighting something that can't be picked.
    private promptFor(playerIndex: 0 | 1): TargetPrompt | undefined
    {
        const pending: PendingTarget | null = this.pending;

        if (pending === null || pending.playerIndex !== playerIndex)
            return undefined;

        const options: TargetOption[] = [...pending.optionsById.values()]
            .filter((target: Targetable) => target.isAlive())
            .map((target: Targetable) => this.targetToOption(target));

        return { forCardId: pending.id, options };
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
