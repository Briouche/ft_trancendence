import Phaser from "phaser";
import { Hand } from "../objects/Hand";
import { Board } from "../objects/board/Board";
import { OpponentHand } from "../objects/OpponentHand";
import { EventManager } from "../EventManager";
import { ClientGameState, TargetPrompt, GameEvent } from "../shared/protocol";
import { GameFlowState } from "./gameProcessors/GameFlowState";
import { AnimationQueue } from "./gameProcessors/AnimationQueue";
import { StateSyncController } from "./gameProcessors/StateSyncController";
import { ServerEventPlayer } from "./gameProcessors/ServerEventPlayer";
import { InputController } from "./gameProcessors/InputController";

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

    private background!: Phaser.GameObjects.Image;

    constructor()
    {
        super("GameScene");
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

        EventManager.on("server:assigned", (playerIndex: 0 | 1) => { this.flow.playerIndex = playerIndex; });
        EventManager.on("server:state", (state: ClientGameState) => this.onServerState(state));
        EventManager.on("server:prompt", (prompt: TargetPrompt) => this.onServerPrompt(prompt));
        EventManager.on("server:gameOver", () => this.onGameOver());
        EventManager.on("server:rejected", (reason: string) => this.onServerRejected(reason));
        EventManager.on("server:event", (event: GameEvent) => this.onServerEvent(event));

        EventManager.emit("client:ready");
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

    private onTableCreated(table: { hand: Hand; board: Board; opponentHand: OpponentHand }): void
    {
        this.hand = table.hand;
        this.board = table.board;
        this.opponentHand = table.opponentHand;

        this.eventPlayer = new ServerEventPlayer(this, this.board, () => this.flow.playerIndex, (cardId, run) => this.stateSync.deferUntilCardExists(cardId, run));

        this.input_ = new InputController(this, this.board, this.hand, this.flow);
        this.input_.register();

        this.layout();
        this.scale.on("resize", this.layout, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off("resize", this.layout, this));
    }

    private layout(): void
    {
        this.hand.layout();
        this.board.layout();
        this.opponentHand.layout();
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

    private onServerRejected(reason: string): void
    {
        console.warn("Server rejected action:", reason);
        this.input_.clearWaitingState(true);
    }

    private onGameOver(): void
    {
        this.flow.awaitingTarget = false;
        this.input.enabled = false;
    }

    private onServerEvent(event: GameEvent): void
    {
        this.animationQueue.run(() => this.eventPlayer!.play(event));
    }

    shutdown()
    {
        this.scale.off("resize", this.layoutBackground, this);
    }
}
