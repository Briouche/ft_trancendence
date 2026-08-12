import Phaser from "phaser";
import { Card } from "../objects/Card";
import { EventManager } from "../EventManager";
import { Hand } from "../objects/Hand";
import { Board } from "../objects/Board";
import { OpponentHand } from "../objects/OpponentHand";
import { TargetArrow } from "../objects/TargetArrow";
import { ResolvedTarget } from "../objects/Target";
import { ClientGameState, TargetPrompt, GameEvent } from "../shared/protocol";
import { summonAnimation, attackAnimation, turnBannerAnimation, deathAnimation } from "../animations";

export class GameScene extends Phaser.Scene
{
    private hand!: Hand;
    private board!: Board;
    private opponentHand!: OpponentHand;

    private playerIndex: 0 | 1 | null = null;
    private isMyTurn: boolean = false;

    private targetingCard: Card | null = null;
    private targetArrow: TargetArrow | null = null;
    private aimingCard: Card | null = null;

    private awaitingServer: boolean = false;
    private awaitingTarget: boolean = false;
    private pendingPrompt: TargetPrompt | null = null;
    private pendingPlayCardId: string | null = null;
    private capturedTargetId: string | null = null;

    private pendingAnimations = 0;
    private animationChain: Promise<void> = Promise.resolve();
    private queuedState: ClientGameState | null = null;
    private pendingSummonIds = new Set<string>();

    constructor()
    {
        super("GameScene");
    }

    create()
    {
        this.hand = new Hand(this);
        this.board = new Board(this);
        this.opponentHand = new OpponentHand(this);

        EventManager.on("server:assigned", (playerIndex: 0 | 1) => this.onAssigned(playerIndex));
        EventManager.on("server:state", (state: ClientGameState) => this.onServerState(state));
        EventManager.on("server:prompt", (prompt: TargetPrompt) => this.onServerPrompt(prompt));
        EventManager.on("server:gameOver", (winner: "you" | "opponent") => this.onGameOver(winner));
        EventManager.on("server:rejected", (reason: string) => this.onServerRejected(reason));
        EventManager.on("server:event", (event: GameEvent) => this.onServerEvent(event));

        this.layout();
        EventManager.emit("client:ready");

        this.scale.on("resize", this.layout, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
        {
            this.scale.off("resize", this.layout, this);
        });

        this.registerInput();
    }

    private layout()
    {
        this.hand.layout();
        this.board.layout();
        this.opponentHand.layout();
    }

    private onAssigned(playerIndex: 0 | 1): void
    {
        this.playerIndex = playerIndex;
    }

    private onServerState(state: ClientGameState): void
    {
        if (this.pendingAnimations > 0)
        {
            this.queuedState = state;
            return;
        }
        this.applyState(state);
    }

    private applyState(state: ClientGameState): void
    {
        this.board.syncBoardFromState(state.playerBoard, state.opponentBoard, state);
        this.opponentHand.setCount(state.opponentHandCount);
        this.hand.syncHandFromState(state.playerHand);

        this.board.playerHero.setHealth(state.playerHero);
        this.board.opponentHero.setHealth(state.opponentHero);

        this.isMyTurn = state.yourTurn;

        for (const id of this.pendingSummonIds)
        {
            const card = this.board.findCardById?.(id);
            if (card)
                summonAnimation(this, card);
        }
        this.pendingSummonIds.clear();

        if (!state.pendingPrompt) { this.clearWaitingState(); return; }

        if (this.pendingPlayCardId !== null)
        {
            const stillInHand = state.playerHand.some((card) => card.id === this.pendingPlayCardId);
            const stillOnBoard = state.playerBoard.some((card) => card.id === this.pendingPlayCardId);
            if (!stillInHand && !stillOnBoard)
            {
                this.pendingPlayCardId = null;
                this.awaitingServer = false;
            }
        }
    }

    private onServerPrompt(prompt: TargetPrompt): void
    {
        this.pendingPrompt = prompt;

        if (this.capturedTargetId !== null && prompt.forCardId === this.pendingPlayCardId)
        {
            const stillLegal = prompt.options.some((o) => o.id === this.capturedTargetId);
            const targetId = stillLegal ? this.capturedTargetId : null;
            this.capturedTargetId = null;
            EventManager.emit("client:targetChoice", targetId);
            return;
        }

        this.awaitingServer = false;
        this.awaitingTarget = true;
        this.board.setTargetHighlights(new Set(prompt.options.map((o) => o.id)));
    }

    private onServerRejected(reason: string): void
    {
        console.warn("Server rejected action:", reason);
        this.clearWaitingState();
    }

    private onGameOver(winner: "you" | "opponent"): void
    {
        this.awaitingTarget = false;
        this.input.enabled = false;
    }

    private registerInput()
    {
        this.input.on("dragstart", (_p: Phaser.Input.Pointer, obj: Card) =>
        {
            if (!(obj instanceof Card) || !this.isMyTurn || this.awaitingServer || this.awaitingTarget || this.aimingCard)
                return;

            obj.isDragging = true;
            obj.setDepth(1000);

            if (this.board.containsCard(obj, 0) && obj.canAttack)
            {
                this.targetingCard = obj;
                this.targetArrow = new TargetArrow(this, obj.x, obj.y);
                return;
            }

            if (this.hand.containsCard(obj) && obj.cardData.requiresTarget && obj.cardData.attack === undefined)
            {
                this.targetingCard = obj;
                this.targetArrow = new TargetArrow(this, obj.x, obj.y);
            }
        });

        this.input.on("drag", (_p: Phaser.Input.Pointer, obj: Card, dragX: number, dragY: number) =>
        {
            if (this.targetingCard === obj)
            {
                this.targetArrow?.updateEnd(_p.x, _p.y);
                return;
            }
            if (this.hand.containsCard(obj))
            {
                obj.x = dragX;
                obj.y = dragY;
            }
        });

        this.input.on("drop", (_p: Phaser.Input.Pointer, obj: Card, zone: Phaser.GameObjects.Zone) =>
        {
            if (this.targetingCard === obj && this.board.containsCard(obj, 0) && obj.canAttack)
            {
                this.handleAttackDrop(obj, zone);
                return;
            }
            if (this.targetingCard === obj && this.hand.containsCard(obj) && obj.cardData.requiresTarget && obj.cardData.attack === undefined)
            {
                this.handleSpellTargetDrop(obj, zone);
                return;
            }
            if (this.hand.containsCard(obj) && obj.cardData.requiresTarget && obj.cardData.attack !== undefined)
            {
                this.handleMinionTargetedDrop(obj, zone, _p);
                return;
            }
            if (this.hand.containsCard(obj))
                this.handleCardDrop(obj, zone, _p);
        });

        this.input.on("dragend", (_p: Phaser.Input.Pointer, obj: Card) =>
        {
            obj.isDragging = false;

            if (this.targetingCard === obj)
            {
                if (this.targetArrow)
                {
                    this.targetArrow.destroy();
                    this.targetArrow = null;
                    this.targetingCard = null;
                    obj.returnToBase();
                }
                return;
            }

            if (this.hand.containsCard(obj) && this.pendingPlayCardId !== obj.cardData.id)
                obj.returnToBase();
        });

        this.input.on("pointermove", (p: Phaser.Input.Pointer) =>
        {
            if (this.aimingCard && this.targetArrow)
                this.targetArrow.updateEnd(p.x, p.y);
        });

        this.input.on("pointerdown", (p: Phaser.Input.Pointer) =>
        {
            if (!this.aimingCard || !this.awaitingTarget || this.pendingPrompt === null)
                return;

            const hit = this.findTargetAt(p);

            if (hit && this.pendingPrompt.options.some((o) => o.id === hit.id))
                this.confirmAim(hit.id);
            else
                this.cancelAim();
        });
    }

    private handleCardDrop(card: Card, zone: Phaser.GameObjects.Zone, pointer?: Phaser.Input.Pointer)
    {
        const index = this.board.findInsertIndex(card.x);

        if (!this.board.isPointOverBoard(pointer ?? { x: card.x, y: card.y }) || index === undefined)
        {
            card.returnToBase();
            return;
        }

        this.requestPlayCard(card, index);
    }

    private handleSpellTargetDrop(card: Card, zone: Phaser.GameObjects.Zone): void
    {
        const resolvedTarget = this.board.resolveTarget(zone);

        this.targetArrow?.destroy();
        this.targetArrow = null;
        this.targetingCard = null;

        if (!resolvedTarget)
        {
            card.returnToBase();
            return;
        }

        this.awaitingServer = true;
        this.pendingPlayCardId = card.cardData.id;
        this.capturedTargetId = resolvedTarget.id;

        EventManager.emit("client:playCard", { cardId: card.cardData.id });
    }

    private handleMinionTargetedDrop(card: Card, zone: Phaser.GameObjects.Zone, pointer?: Phaser.Input.Pointer): void
    {
        if (!this.board.isPointOverBoard(pointer ?? { x: card.x, y: card.y }))
        {
            card.returnToBase();
            return;
        }

        const boardIndex = this.board.findInsertIndex(card.x);
        if (boardIndex === undefined)
        {
            card.returnToBase();
            return;
        }

        this.hand.extractCard(card);
        this.board.insertCard(card, boardIndex, 0);
        card.setWaiting(true);

        this.awaitingServer = true;
        this.pendingPlayCardId = card.cardData.id;
        this.aimingCard = card;

        this.targetArrow = new TargetArrow(this, card.x, card.y);

        EventManager.emit("client:playCard", { cardId: card.cardData.id, boardIndex });
    }

    private handleAttackDrop(attacker: Card, zone: Phaser.GameObjects.Zone): void
    {
        const resolvedTarget = this.board.resolveTarget(zone);

        this.targetArrow?.destroy();
        this.targetArrow = null;
        this.targetingCard = null;

        if (!resolvedTarget)
        {
            attacker.returnToBase();
            return;
        }

        this.awaitingServer = true;
        EventManager.emit("client:requestAttack", { attackerId: attacker.cardData.id, targetId: resolvedTarget.id });
    }

    private requestPlayCard(card: Card, boardIndex?: number): void
    {
        if (this.awaitingServer || !this.isMyTurn)
            return;

        this.awaitingServer = true;
        this.pendingPlayCardId = card.cardData.id;

        EventManager.emit("client:playCard", { cardId: card.cardData.id, boardIndex });
    }

    private findTargetAt(pointer: Phaser.Input.Pointer): ResolvedTarget | undefined
    {
        const hits = this.input.hitTestPointer(pointer);

        for (const obj of hits)
        {
            const target = this.board.getAllTargets().find((t) => t.getZone() === obj);
            if (target)
            {
                const resolved = target.resolve();
                if (resolved)
                    return resolved;
            }
        }
        return undefined;
    }

    private confirmAim(targetId: string): void
    {
        EventManager.emit("client:targetChoice", targetId);

        this.targetArrow?.destroy();
        this.targetArrow = null;

        this.aimingCard?.setWaiting(false);
        this.aimingCard = null;

        this.awaitingTarget = false;
        this.board.clearTargetHighlights();
        this.pendingPrompt = null;
    }

    private cancelAim(): void
    {
        if (this.aimingCard)
        {
            this.board.removeCard(this.aimingCard);
            this.aimingCard.setWaiting(false);
            this.hand.returnCard(this.aimingCard);
            this.aimingCard.returnToBase();
        }

        EventManager.emit("client:targetChoice", null);

        this.targetArrow?.destroy();
        this.targetArrow = null;
        this.aimingCard = null;

        this.pendingPlayCardId = null;
        this.awaitingTarget = false;
        this.awaitingServer = false;

        this.board.clearTargetHighlights();
        this.pendingPrompt = null;
    }

    private onServerEvent(event: GameEvent): void
    {
        switch (event.type)
        {
            case "attack": this.runAnimation(() => this.playAttackEvent(event)); break;
            case "cardPlayed": this.runAnimation(() => this.playCardPlayedEvent(event)); break;
            case "minionDied": this.runAnimation(() => this.playMinionDiedEvent(event)); break;
            case "turnEnded": this.runAnimation(() => this.playTurnEndedEvent(event)); break;
        }
    }

    private runAnimation(run: () => Promise<void>): void
    {
        this.pendingAnimations++;
        this.animationChain = this.animationChain.then(run).finally(() =>
        {
            this.pendingAnimations--;
            if (this.pendingAnimations === 0 && this.queuedState)
            {
                const state = this.queuedState;
                this.queuedState = null;
                this.applyState(state);
            }
        });
    }

    private async playAttackEvent(event: Extract<GameEvent, { type: "attack" }>): Promise<void>
    {
        const attackerCard = this.board.findCardById?.(event.attackerId);
        const targetEntry = this.board.getAllTargets().find((t) => t.resolve()?.id === event.targetId);
        const zone = targetEntry?.getZone();

        if (!attackerCard || !zone) return;
        await attackAnimation(this, attackerCard, zone.x, zone.y);
    }

    private async playMinionDiedEvent(event: Extract<GameEvent, { type: "minionDied" }>): Promise<void>
    {
        const card = this.board.findCardById?.(event.minionId);
        if (!card) return;
        await deathAnimation(this, card);
    }

    private async playCardPlayedEvent(event: Extract<GameEvent, { type: "cardPlayed" }>): Promise<void>
    {
        this.pendingSummonIds.add(event.cardId);
    }

    private async playTurnEndedEvent(event: Extract<GameEvent, { type: "turnEnded" }>): Promise<void>
    {
        const label = event.nextPlayerIndex === this.playerIndex ? "Your Turn" : "Opponent's Turn";
        await turnBannerAnimation(this, label);
    }

    private clearWaitingState(): void
    {
        this.awaitingServer = false;
        this.awaitingTarget = false;
        this.pendingPrompt = null;

        this.board.clearTargetHighlights();

        this.targetArrow?.destroy();
        this.targetArrow = null;

        if (this.aimingCard)
        {
            this.aimingCard.setWaiting(false);
            this.aimingCard = null;
        }

        if (this.targetingCard)
        {
            this.targetingCard.returnToBase();
            this.targetingCard = null;
        }

        this.pendingPlayCardId = null;
        this.capturedTargetId = null;
    }
}
