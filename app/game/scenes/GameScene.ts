import Phaser from "phaser";
import { Hand } from "../objects/Hand";
import { Board } from "../objects/board/Board";
import { OpponentHand } from "../objects/OpponentHand";
import { MatchHistory } from "../objects/history/MatchHistory";
import { HistoryStrip } from "../objects/history/HistoryStrip";
import { HistoryOverlay } from "../objects/history/HistoryOverlay";
import { EventManager } from "../EventManager";
import { ClientGameState, TargetPrompt, GameEvent, MatchRewards } from "../shared/protocol";
import { GameFlowState } from "./gameProcessors/GameFlowState";
import { AnimationQueue } from "./gameProcessors/AnimationQueue";
import { StateSyncController } from "./gameProcessors/StateSyncController";
import { ServerEventPlayer } from "./gameProcessors/ServerEventPlayer";
import { InputController } from "./gameProcessors/InputController";
import { GameOverOverlay } from "../objects/GameOverOverlay";
import { GAME_FONT_FAMILY_KEY } from "../objects/gameFontRegistry";
import type { GameMode } from "@/game/GameConfig";
import type { Difficulty } from "@/game/shared/protocol";

/**
 * Match scene: routes server events to the flow/animation/sync/input controllers and owns the
 * hand, board, opponent hand and history UI.
 */
export class GameScene extends Phaser.Scene
{
    private flow = new GameFlowState();
    private animationQueue!: AnimationQueue;
    private stateSync!: StateSyncController;
    private eventPlayer: ServerEventPlayer | null = null;
    private input_!: InputController;

    private hand!: Hand;
    private board!: Board;
    private opponentHand!: OpponentHand;
    private history!: MatchHistory;
    private historyStrip!: HistoryStrip;
    private historyOverlay!: HistoryOverlay;

    private background!: Phaser.GameObjects.Image;
    private opponentDisconnectedText: Phaser.GameObjects.Text | null = null;

    private onAssignedHandler = (playerIndex: 0 | 1) => { this.matched = true; this.flow.playerIndex = playerIndex; };
    private onStateHandler = (state: ClientGameState) => this.onServerState(state);
    private onPromptHandler = (prompt: TargetPrompt) => this.onServerPrompt(prompt);
    private onGameOverHandler = (winner: "you" | "opponent", rewards?: MatchRewards) => this.onGameOver(winner, rewards);
    private onRejectedHandler = (reason: string, fatal: boolean) => this.onServerRejected(reason, fatal);
    private onEventHandler = (event: GameEvent) => this.onServerEvent(event);
    private onOpponentDisconnectedHandler = (seconds: number) => this.showOpponentDisconnected(seconds);
    private onOpponentReconnectedHandler = () => this.hideOpponentDisconnected();
    private onConnectedHandler = () => this.onConnected();
    private matched = false;
    // Set once an overlay has been shown, so a real game-over and a fatal rejection can't stack.
    private matchEnded = false;

    private mode!: GameMode;
    private difficulty!: Difficulty;
    private deckId!: number;
    private cardBack!: number;

    constructor()
    {
        super("GameScene");
    }

    init(data: { mode: GameMode; difficulty: Difficulty; deckId: number; cardBack: number })
    {
        this.mode = data.mode;
        this.difficulty = data.difficulty;
        this.deckId = data.deckId;
        this.cardBack = data.cardBack;
    }

    create()
    {
        this.background = this.add.image(0, 0, "wooden_table");
        this.background.setOrigin(0, 0);
        this.background.setDepth(-1);
        this.layoutBackground();

        this.scale.on("resize", this.layoutBackground, this);

        this.animationQueue = new AnimationQueue(this, (state) => this.stateSync.apply(state));
        this.stateSync = new StateSyncController(this, this.flow, (table) => this.onTableCreated(table), () => this.input_.clearWaitingState(), (prompt) => this.onServerPrompt(prompt));

        EventManager.on("server:assigned", this.onAssignedHandler);
        EventManager.on("server:state", this.onStateHandler);
        EventManager.on("server:prompt", this.onPromptHandler);
        EventManager.on("server:gameOver", this.onGameOverHandler);
        EventManager.on("server:rejected", this.onRejectedHandler);
        EventManager.on("server:event", this.onEventHandler);
        EventManager.on("client:connected", this.onConnectedHandler);
        EventManager.on("server:opponentDisconnected", this.onOpponentDisconnectedHandler);
        EventManager.on("server:opponentReconnected", this.onOpponentReconnectedHandler);

        // Game.destroy() only emits DESTROY, so cleanup hooks here.
        this.events.once(Phaser.Scenes.Events.DESTROY, () => this.shutdown());

        this.sendReady();
    }

    // Fires on the first connection and on every socket.io reconnect. Only a reconnect needs the
    // resume round trip — before the match is assigned there is nothing to resume, just a seat to
    // ask for.
    private onConnected(): void
    {
        if (!this.matched)
        {
            this.sendReady();
            return;
        }

        // The socket dropped and came back. Everything queued describes the board as it was
        // before the drop, and the server answers "resume" with a full state, so throw the queue
        // away rather than wait for it to drain. This is what makes the resync land even when an
        // animation wedged (destroyed tween target, lost WebGL context, a timeout that hasn't
        // fired yet): onServerState would otherwise stash that state in queuedState forever.
        this.animationQueue.reset();
        this.input_?.clearWaitingState();
        EventManager.emit("client:resume");
    }

    private sendReady(): void
    {
        if (this.mode === "solo")
            EventManager.emit("client:readySolo", { difficulty: this.difficulty, deckId: this.deckId, cardBack: this.cardBack });
        else
            EventManager.emit("client:ready", { deckId: this.deckId, cardBack: this.cardBack });
    }

    private layoutBackground()
    {
        const { width, height } = this.scale.gameSize;

        this.background.setPosition(0, 0);

        const scaleX = width / this.background.width;
        const scaleY = height / this.background.height;
        const scale = Math.max(scaleX, scaleY);

        this.background.setScale(scale);
        this.background.setPosition(
            (width - this.background.displayWidth) / 2,
            (height - this.background.displayHeight) / 2
        );
    }

    private onTableCreated(table: { hand: Hand; board: Board; opponentHand: OpponentHand; history: MatchHistory }): void
    {
        this.hand = table.hand;
        this.board = table.board;
        this.opponentHand = table.opponentHand;
        this.history = table.history;

        this.eventPlayer = new ServerEventPlayer(this, this.board, () => this.flow.playerIndex, (cardId, run) => this.stateSync.deferUntilCardExists(cardId, run), this.history);

        this.historyOverlay = new HistoryOverlay(this, this.history);
        this.historyStrip = new HistoryStrip(this, this.history, () => this.historyOverlay.show());

        this.input_ = new InputController(this, this.board, this.hand, this.flow);
        this.input_.register();

        this.layout();
        this.scale.on("resize", this.layout, this);
        this.events.once(Phaser.Scenes.Events.DESTROY, () => this.scale.off("resize", this.layout, this));
    }

    private layout(): void
    {
        this.hand.layout();
        this.board.layout();
        this.opponentHand.layout();
        this.historyStrip.layout();
    }

    // States arriving mid-animation are held by the queue and applied once it drains.
    private onServerState(state: ClientGameState): void
    {
        if (this.animationQueue.isBusy)
        {
            this.animationQueue.queueState(state);
            return;
        }
        this.stateSync.apply(state);
    }

    // A target captured during a drag answers the prompt directly; otherwise the player picks.
    private onServerPrompt(prompt: TargetPrompt): void
    {
        this.flow.pendingPrompt = prompt;

        if (this.flow.capturedTargetId !== null && prompt.forCardId === this.flow.pendingPlayCardId)
        {
            const stillLegal = prompt.options.some((o) => o.id === this.flow.capturedTargetId);
            const targetId = stillLegal ? this.flow.capturedTargetId : null;
            this.flow.capturedTargetId = null;
            EventManager.emit("client:targetChoice", targetId);
            return;
        }

        this.input_.onServerPrompt();
        this.board.setTargetHighlights(new Set(prompt.options.map((o) => o.id)));
    }

    // The opponent's socket dropped and the server is holding their seat open. Without this the
    // board would just silently freeze on their turn with no explanation.
    private showOpponentDisconnected(seconds: number): void
    {
        const { width } = this.scale.gameSize;
        const fontFamily = this.game.registry.get(GAME_FONT_FAMILY_KEY) as string | undefined;

        this.opponentDisconnectedText?.destroy();
        this.opponentDisconnectedText = this.add.text(width / 2, 40,
            `Opponent Disconnected — ${seconds}s to come back...`,
            { fontFamily, fontSize: "28px", color: "#ffffff", stroke: "#000000", strokeThickness: 4 })
            .setOrigin(0.5)
            .setDepth(2500);
    }

    private hideOpponentDisconnected(): void
    {
        this.opponentDisconnectedText?.destroy();
        this.opponentDisconnectedText = null;
    }

    // Short message under the top edge that fades out ("not your turn", "illegal target"): the
    // player learns why the move was refused, and nothing ends up in the browser console.
    private showNotice(text: string): void
    {
        const fontFamily = this.game.registry.get(GAME_FONT_FAMILY_KEY) as string | undefined;
        const notice = this.add.text(this.scale.width / 2, 90, text.charAt(0).toUpperCase() + text.slice(1),
            { fontFamily, fontSize: "32px", color: "#ffdd88", stroke: "#000000", strokeThickness: 4 })
            .setOrigin(0.5)
            .setDepth(2500);
        this.tweens.add({ targets: notice, alpha: 0, delay: 1200, duration: 600, onComplete: () => notice.destroy() });
    }

    // Two very different things arrive here. An ordinary rejection ("not your turn", "illegal
    // target") just undoes the in-flight interaction and the match carries on. A fatal one means
    // the server has no seat left for this client — typically a reconnect that landed after the
    // forfeit timer fired — so there is nothing left to play, and saying so beats leaving the
    // player clicking a board that will never answer.
    private onServerRejected(reason: string, fatal: boolean = false): void
    {
        this.input_?.clearWaitingState(true);

        if (!fatal)
        {
            this.showNotice(reason);
            return;
        }

        if (this.matchEnded)
            return;
        this.matchEnded = true;

        this.flow.awaitingTarget = false;
        this.animationQueue.reset();
        new GameOverOverlay(this, reason, "#760606", { fontSize: "56px" });
    }

    private onGameOver(winner: "you" | "opponent", rewards?: MatchRewards): void
    {
        if (this.matchEnded)
            return;
        this.matchEnded = true;

        this.flow.awaitingTarget = false;
        this.input_.clearWaitingState();

        this.animationQueue.runAfterDrain(() =>
        {
            const text = winner === "you" ? "YOU WIN!!" : "YOU LOSE :(";
            const color = winner === "you" ? "#03c844" : "#760606";
            new GameOverOverlay(this, text, color, { details: describeRewards(rewards) });
        });
    }

    private onServerEvent(event: GameEvent): void
    {
        // Events can arrive before the first state: GameSession broadcasts startGame's animation
        // events and only then the state, and the player is built in onTableCreated, which the
        // first state triggers. Nothing to animate against yet, so drop the event rather than
        // queue a task that would throw and have to be swallowed.
        if (!this.eventPlayer)
            return;

        this.animationQueue.run(async () =>
        {
            await this.eventPlayer!.play(event);
            this.historyStrip.refresh();
        });
    }

    shutdown()
    {
        this.scale.off("resize", this.layoutBackground, this);
        EventManager.off("server:assigned", this.onAssignedHandler);
        EventManager.off("server:state", this.onStateHandler);
        EventManager.off("server:prompt", this.onPromptHandler);
        EventManager.off("server:gameOver", this.onGameOverHandler);
        EventManager.off("server:rejected", this.onRejectedHandler);
        EventManager.off("server:event", this.onEventHandler);
        EventManager.off("client:connected", this.onConnectedHandler);
        EventManager.off("server:opponentDisconnected", this.onOpponentDisconnectedHandler);
        EventManager.off("server:opponentReconnected", this.onOpponentReconnectedHandler);
    }
}

// One line summing up what the match earned, for the end screen ("" when nothing to show).
function describeRewards(rewards?: MatchRewards): string
{
    if (!rewards)
        return "";
    const parts: string[] = [];
    if (rewards.packs > 0)
        parts.push(`+${rewards.packs} pack${rewards.packs > 1 ? "s" : ""}`);
    if (rewards.eloChange !== 0)
        parts.push(`Elo ${rewards.eloChange > 0 ? "+" : ""}${rewards.eloChange}`);
    if (rewards.cardBackUnlocked !== undefined)
        parts.push("new card back unlocked!");
    return parts.join("   ·   ");
}
