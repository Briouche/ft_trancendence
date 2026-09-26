import Phaser from "phaser";
import { Card } from "../../objects/card/Card";
import { Board } from "../../objects/board/Board";
import { Hand } from "../../objects/Hand";
import { TargetArrow } from "../../objects/TargetArrow";
import { ResolvedTarget } from "../../objects/Target";
import { EventManager } from "../../EventManager";
import { GameFlowState } from "./GameFlowState";
import { summonAnimation } from "../../animations";

type ClickTargetMode = "attack" | "spell";

/**
 * Player input on cards: drag-and-drop and click-to-select/click-to-target both end in the same
 * finalizeXxx / requestXxx methods. A spell is a card without attack stats.
 */
export class InputController
{
    private targetingCard: Card | null = null;
    private targetArrow: TargetArrow | null = null;
    private aimingCard: Card | null = null;

    private clickTargetCard: Card | null = null;
    private clickTargetMode: ClickTargetMode | null = null;
    private clickMovingCard: Card | null = null;
    private dragOccurredThisPress: boolean = false;

    constructor(private scene: Phaser.Scene, private board: Board, private hand: Hand, private flow: GameFlowState)
    {}

    register(): void
    {
        this.scene.input.on("gameobjectdown", (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) =>
        {
            if (obj instanceof Card)
                this.dragOccurredThisPress = false;
        });

        this.scene.input.on("gameobjectup", (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) =>
        {
            if (obj instanceof Card && !this.dragOccurredThisPress)
                this.handleCardClick(obj);
        });

        this.scene.input.on("dragstart", (_p: Phaser.Input.Pointer, obj: Card) =>
        {
            this.dragOccurredThisPress = true;

            if (!(obj instanceof Card) || !this.flow.isMyTurn || this.flow.awaitingServer || this.flow.awaitingTarget || this.aimingCard || this.clickTargetCard)
                return;

            obj.isDragging = true;
            obj.isHovering = false;
            obj.setDepth(1000);

            if (this.board.containsCard(obj, 0) && obj.cardData.canAttack !== false)
            {
                this.targetingCard = obj;
                this.targetArrow = new TargetArrow(this.scene, obj.x, obj.y);
                this.board.setTargetHighlights(this.board.getLegalAttackTargetIds(obj));
                return;
            }

            if (this.hand.containsCard(obj) && obj.cardData.requiresTarget && obj.cardData.attack === undefined)
            {
                this.targetingCard = obj;
                this.targetArrow = new TargetArrow(this.scene, obj.x, obj.y);
                this.board.setTargetHighlights(this.board.getLegalSpellTargetIds());
            }
        });

        this.scene.input.on("drag", (_p: Phaser.Input.Pointer, obj: Card, dragX: number, dragY: number) =>
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

        this.scene.input.on("drop", (_p: Phaser.Input.Pointer, obj: Card, zone: Phaser.GameObjects.Zone) =>
        {
            if (this.targetingCard === obj && this.board.containsCard(obj, 0) && obj.cardData.canAttack !== false)
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
                this.handleMinionTargetedDrop(obj, _p);
                return;
            }
            if (this.hand.containsCard(obj))
                this.handleCardDrop(obj, _p);
        });

        this.scene.input.on("dragend", (_p: Phaser.Input.Pointer, obj: Card) =>
        {
            obj.isDragging = false;

            if (this.targetingCard === obj)
            {
                if (this.targetArrow)
                {
                    this.targetArrow.destroy();
                    this.targetArrow = null;
                    this.targetingCard = null;
                    this.board.clearTargetHighlights();
                    obj.returnToBase();
                }
                return;
            }

            if (this.hand.containsCard(obj) && this.flow.pendingPlayCardId !== obj.cardData.id && !this.clickTargetCard)
                obj.returnToBase();
        });

        this.scene.input.on("pointermove", (p: Phaser.Input.Pointer) =>
        {
            if (this.clickMovingCard && !this.targetArrow)
            {
                this.clickMovingCard.x = p.x;
                this.clickMovingCard.y = p.y;
            }

            if ((this.aimingCard || this.clickTargetCard) && this.targetArrow)
                this.targetArrow.updateEnd(p.x, p.y);
        });

        this.scene.input.on("pointerdown", (p: Phaser.Input.Pointer) =>
        {
            if (this.clickTargetCard)
            {
                this.resolveClickTarget(p);
                return;
            }

            if (this.clickMovingCard)
            {
                this.resolveClickCard(p);
                return;
            }

            // No aimingCard requirement: a prompt restored after a reconnect (see
            // StateSyncController) has no card being aimed, because the pending card is still in
            // the player's hand server-side and the resync puts it back there — there is nothing
            // on the board to aim from. awaitingTarget + pendingPrompt is the real condition, and
            // both branches below already tolerate a null aimingCard. Ordinary clicks can't be
            // swallowed by this: handleCardClick bails on flow.awaitingTarget anyway.
            if (!this.flow.awaitingTarget || this.flow.pendingPrompt === null)
                return;

            const hit = this.findTargetAt(p);

            if (hit && this.flow.pendingPrompt.options.some((o) => o.id === hit.id))
                this.confirmAim(hit.id);
            else
                this.cancelAim();
        });
    }

    onServerPrompt(): void
    {
        this.flow.awaitingServer = false;
        this.flow.awaitingTarget = true;
    }

    private handleCardClick(obj: Card): void
    {
        if (this.clickTargetCard || this.clickMovingCard)
            return;

        if (!this.flow.isMyTurn || this.flow.awaitingServer || this.flow.awaitingTarget || this.aimingCard || this.targetingCard)
            return;

        if (this.board.containsCard(obj, 0) && obj.cardData.canAttack !== false)
        {
            this.beginClickTargeting(obj, "attack");
            return;
        }

        if (this.hand.containsCard(obj))
        {
            if (obj.cardData.requiresTarget && obj.cardData.attack === undefined)
            {
                this.beginClickTargeting(obj, "spell");
                return;
            }

            this.beginClickCardMove(obj);
        }
    }

    private beginClickTargeting(card: Card, mode: ClickTargetMode): void
    {
        this.clickTargetCard = card;
        this.clickTargetMode = mode;
        this.targetArrow = new TargetArrow(this.scene, card.x, card.y);

        if (mode === "attack")
            this.board.setTargetHighlights(this.board.getLegalAttackTargetIds(card));
        else
            this.board.setTargetHighlights(this.board.getLegalSpellTargetIds());
    }

    private beginClickCardMove(card: Card): void
    {
        this.clickMovingCard = card;
        card.isDragging = true;
        card.isHovering = false;
        card.setDepth(1000);
    }

    private resolveClickCard(pointer: Phaser.Input.Pointer): void
    {
        const card = this.clickMovingCard!;
        const isMinion = card.cardData.attack !== undefined;
        const index = isMinion ? this.board.findInsertIndex(card.x) : undefined;

        this.clickMovingCard = null;
        card.isDragging = false;

        if (this.hasInvalidTargetZoneAt(pointer) || !this.board.isPointOverBoard(pointer) || (isMinion && index === undefined))
        {
            card.returnToBase();
            return;
        }

        if (card.cardData.requiresTarget && card.cardData.attack !== undefined)
        {
            this.handleMinionTargetedDrop(card, pointer);
            return;
        }

        this.requestPlayCard(card, index);
    }

    private resolveClickTarget(pointer: Phaser.Input.Pointer): void
    {
        const hit = this.findTargetAt(pointer);

        if (!hit)
        {
            this.cancelClickTargeting();
            return;
        }

        const card = this.clickTargetCard!;
        const mode = this.clickTargetMode!;
        this.teardownClickTargeting();

        if (mode === "attack")
            this.finalizeAttack(card, hit);
        else
            this.finalizeSpellTarget(card, hit);
    }

    private cancelClickTargeting(): void
    {
        const card = this.clickTargetCard;
        this.teardownClickTargeting();
        card?.returnToBase();
    }

    private teardownClickTargeting(): void
    {
        this.targetArrow?.destroy();
        this.targetArrow = null;
        this.clickTargetCard = null;
        this.clickTargetMode = null;
        this.board.clearTargetHighlights();
    }

    private handleCardDrop(card: Card, pointer?: Phaser.Input.Pointer): void
    {
        const isMinion = card.cardData.attack !== undefined;
        const index = isMinion ? this.board.findInsertIndex(card.x) : undefined;

        if (!this.board.isPointOverBoard(pointer ?? { x: card.x, y: card.y }) || (isMinion && index === undefined))
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
        this.board.clearTargetHighlights();

        if (!resolvedTarget)
        {
            card.returnToBase();
            return;
        }

        this.finalizeSpellTarget(card, resolvedTarget);
    }

    // Places the minion on the board right away, then aims its battlecry target with the arrow.
    private handleMinionTargetedDrop(card: Card, pointer?: Phaser.Input.Pointer): void
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
        void summonAnimation(this.scene, card);

        this.flow.awaitingServer = true;
        this.flow.pendingPlayCardId = card.cardData.id;
        this.aimingCard = card;

        this.targetArrow = new TargetArrow(this.scene, card.x, card.y);

        EventManager.emit("client:playCard", { cardId: card.cardData.id, boardIndex });
    }

    private handleAttackDrop(attacker: Card, zone: Phaser.GameObjects.Zone): void
    {
        const resolvedTarget = this.board.resolveTarget(zone);

        this.targetArrow?.destroy();
        this.targetArrow = null;
        this.targetingCard = null;
        this.board.clearTargetHighlights();

        if (!resolvedTarget)
        {
            attacker.returnToBase();
            return;
        }
        this.finalizeAttack(attacker, resolvedTarget);
    }

    private finalizeAttack(attacker: Card, resolvedTarget: ResolvedTarget): void
    {
        this.flow.awaitingServer = true;
        EventManager.emit("client:requestAttack", { attackerId: attacker.cardData.id, targetId: resolvedTarget.id });
    }

    // The chosen target is kept to answer the server's target prompt automatically.
    private finalizeSpellTarget(card: Card, resolvedTarget: ResolvedTarget): void
    {
        this.flow.awaitingServer = true;
        this.flow.pendingPlayCardId = card.cardData.id;
        this.flow.capturedTargetId = resolvedTarget.id;

        EventManager.emit("client:playCard", { cardId: card.cardData.id });
    }

    private requestPlayCard(card: Card, boardIndex?: number): void
    {
        if (this.flow.awaitingServer || !this.flow.isMyTurn)
            return;

        this.flow.awaitingServer = true;
        this.flow.pendingPlayCardId = card.cardData.id;

        if (boardIndex !== undefined)
        {
            this.hand.extractCard(card);
            this.board.insertCard(card, boardIndex, 0);
            card.setWaiting(true);
            this.aimingCard = card;
            void summonAnimation(this.scene, card);
        }

        EventManager.emit("client:playCard", { cardId: card.cardData.id, boardIndex });
    }

    private findTargetAt(pointer: Phaser.Input.Pointer): ResolvedTarget | undefined
    {
        const hits = this.scene.input.hitTestPointer(pointer);

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

    private hasInvalidTargetZoneAt(pointer: Phaser.Input.Pointer): boolean
    {
        const hits = this.scene.input.hitTestPointer(pointer);

        return hits.some((obj) =>
        {
            const target = this.board.getAllTargets().find((t) => t.getZone() === obj);
            return target !== undefined && target.resolve() === undefined;
        });
    }

    private confirmAim(targetId: string): void
    {
        EventManager.emit("client:targetChoice", targetId);

        this.targetArrow?.destroy();
        this.targetArrow = null;

        this.aimingCard?.setWaiting(false);
        this.aimingCard = null;

        this.flow.awaitingTarget = false;
        this.board.clearTargetHighlights();
        this.flow.pendingPrompt = null;
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

        this.flow.pendingPlayCardId = null;
        this.flow.awaitingTarget = false;
        this.flow.awaitingServer = false;

        this.board.clearTargetHighlights();
        this.flow.pendingPrompt = null;
    }

    // Resets every in-flight interaction; `restorePendingCard` puts a rejected play back in hand.
    clearWaitingState(restorePendingCard = false): void
    {
        this.flow.awaitingServer = false;
        this.flow.awaitingTarget = false;
        this.flow.pendingPrompt = null;

        this.board.clearTargetHighlights();

        this.targetArrow?.destroy();
        this.targetArrow = null;

        if (restorePendingCard && this.flow.pendingPlayCardId !== null)
        {
            const pendingCard = this.aimingCard ?? this.board.findCardById(this.flow.pendingPlayCardId);
            if (pendingCard && this.board.containsCard(pendingCard, 0))
            {
                pendingCard.setWaiting(false);
                this.board.removeCard(pendingCard);
                this.hand.returnCard(pendingCard);
                pendingCard.returnToBase();
            }
        }

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

        if (this.clickTargetCard)
        {
            this.clickTargetCard.returnToBase();
            this.clickTargetCard = null;
            this.clickTargetMode = null;
        }

        if (this.clickMovingCard)
        {
            this.clickMovingCard.isDragging = false;
            this.clickMovingCard.returnToBase();
            this.clickMovingCard = null;
        }

        this.flow.pendingPlayCardId = null;
        this.flow.capturedTargetId = null;
    }
}
