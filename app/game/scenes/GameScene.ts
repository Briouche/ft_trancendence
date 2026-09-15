import Phaser from "phaser";
import { Hand } from "../objects/Hand";
import { Board } from "../objects/board/Board";
import { OpponentHand } from "../objects/OpponentHand";
import { MatchHistory } from "../objects/history/MatchHistory";
import { HistoryStrip } from "../objects/history/HistoryStrip";
import { HistoryOverlay } from "../objects/history/HistoryOverlay";
import { EventManager } from "../EventManager";
import { ClientGameState, TargetPrompt, GameEvent } from "../shared/protocol";
import { GameFlowState } from "./gameProcessors/GameFlowState";
import { AnimationQueue } from "./gameProcessors/AnimationQueue";
import { StateSyncController } from "./gameProcessors/StateSyncController";
import { ServerEventPlayer } from "./gameProcessors/ServerEventPlayer";
import { InputController } from "./gameProcessors/InputController";
import { GameOverOverlay } from "../objects/GameOverOverlay";
import { GAME_FONT_FAMILY_KEY } from "../objects/gameFontRegistry";
import { TargetArrow } from "../objects/TargetArrow";
import { ResolvedTarget } from "../objects/Target";
import type { GameMode } from "@/game/GameConfig";
import type { Difficulty } from "@/game/shared/protocol";


// The main gameplay scene, started once by BootScene for the whole match
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
    private onGameOverHandler = (winner: "you" | "opponent") => this.onGameOver(winner);
    private onRejectedHandler = (reason: string) => this.onServerRejected(reason);
    private onEventHandler = (event: GameEvent) => this.onServerEvent(event);
    private onOpponentDisconnectedHandler = (seconds: number) => this.showOpponentDisconnected(seconds);
    private onOpponentReconnectedHandler = () => this.hideOpponentDisconnected();
    private onConnectedHandler = () => { if (this.matched) EventManager.emit("client:resume"); else this.sendReady(); };
    private matched = false;

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

        this.animationQueue = new AnimationQueue((state) => this.stateSync.apply(state));
        this.stateSync = new StateSyncController(this, this.flow, (table) => this.onTableCreated(table), () => this.input_.clearWaitingState());

        EventManager.on("server:assigned", this.onAssignedHandler);
        EventManager.on("server:state", this.onStateHandler);
        EventManager.on("server:prompt", this.onPromptHandler);
        EventManager.on("server:gameOver", this.onGameOverHandler);
        EventManager.on("server:rejected", this.onRejectedHandler);
        EventManager.on("server:event", this.onEventHandler);
        EventManager.on("client:connected", this.onConnectedHandler);
        EventManager.on("server:opponentDisconnected", this.onOpponentDisconnectedHandler);
        EventManager.on("server:opponentReconnected", this.onOpponentReconnectedHandler);

        this.events.once(Phaser.Scenes.Events.DESTROY, () => this.shutdown());

        this.sendReady();
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

    private onServerState(state: ClientGameState): void
    {
        if (this.animationQueue.isBusy)
        {
            this.animationQueue.queueState(state);
            return;
        }
        this.stateSync.apply(state);
    }

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

    private onServerRejected(reason: string): void
    {
        console.warn("Server rejected action:", reason);
        this.input_?.clearWaitingState(true);
    }

    private onGameOver(winner: "you" | "opponent"): void
    {
        this.flow.awaitingTarget = false;
        this.input_.clearWaitingState();

        this.animationQueue.runAfterDrain(() =>
        {
            const text = winner === "you" ? "YOU WIN!!" : "YOU LOSE :(";
            const color = winner === "you" ? "#03c844" : "#760606";
            new GameOverOverlay(this, text, color);
        });
    }

    private onServerEvent(event: GameEvent): void
    {
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
