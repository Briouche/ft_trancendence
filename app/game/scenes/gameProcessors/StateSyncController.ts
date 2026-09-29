import Phaser from "phaser";
import { Card } from "@/game/objects/card/Card";
import { Hand } from "../../objects/Hand";
import { Board } from "../../objects/board/Board";
import { OpponentHand } from "../../objects/OpponentHand";
import { MatchHistory } from "../../objects/history/MatchHistory";
import { ClientGameState, TargetPrompt } from "../../shared/protocol";
import { drawCardAnimation } from "../../animations";
import { GameFlowState } from "./GameFlowState";

interface TableRefs
{
    hand: Hand;
    board: Board;
    opponentHand: OpponentHand;
    history: MatchHistory;
}

interface DeferredCardAnimation
{
    cardId: string;
    run: (card: Card) => void;
}

// Applies each server state to the table objects (creating them on the first state), plays
// draw animations for new hand cards, and runs animations deferred until their card exists.
export class StateSyncController
{
    private previousState: ClientGameState | null = null;
    private pendingCardAnimations: DeferredCardAnimation[] = [];
    private pendingDrawIds = new Set<string>();

    private table: TableRefs | null = null;

    constructor(private scene: Phaser.Scene, private flow: GameFlowState, private onTableCreated: (table: TableRefs) => void, private onWaitingCleared: () => void, private onPromptRestored: (prompt: TargetPrompt) => void)
    {}

    deferUntilCardExists(cardId: string, run: (card: Card) => void): void
    {
        this.pendingCardAnimations.push({ cardId, run });
    }

    apply(state: ClientGameState): void
    {
        if (this.table === null)
        {
            const hand = new Hand(this.scene);
            const board = new Board(this.scene, 6, state.playerHero, state.opponentHero);
            const opponentHand = new OpponentHand(this.scene, state.opponentHero.cardBack);
            const history = new MatchHistory();

            this.table = { hand, board, opponentHand, history };
            this.onTableCreated(this.table);
        }

        const { hand, board, opponentHand } = this.table;

        this.detectDraws(state);

        board.syncBoardFromState(state.playerBoard, state.opponentBoard, state);
        opponentHand.setCount(state.opponentHandCount);
        hand.syncHandFromState(state.playerHand, state.yourTurn, state.mana);

        board.playerHero.setHeroData(state.playerHero);
        board.opponentHero.setHeroData(state.opponentHero);

        this.flow.isMyTurn = state.yourTurn;

        const stillPending: DeferredCardAnimation[] = [];
        for (const pending of this.pendingCardAnimations)
        {
            const card = board.findCardById(pending.cardId);
            if (card)
                pending.run(card);
            else
                stillPending.push(pending);
        }
        this.pendingCardAnimations = stillPending;

        for (const id of this.pendingDrawIds)
        {
            const card = hand.findCardById(id);
            if (card)
            {
                const deckPos = board.getDeckPosition(0);
                drawCardAnimation(this.scene, card, deckPos.x, deckPos.y);
            }
        }
        this.pendingDrawIds.clear();

        this.previousState = state;

        if (!state.pendingPrompt)
        {
            this.onWaitingCleared();
            return;
        }

        // The server says this player still owes a target choice. On a normal play the UI is
        // already up — the "prompt" message raised it and flow.pendingPrompt is set. It is null
        // here only when the client that saw that message is gone (a reconnect, a page reload),
        // and the state is then the only place the prompt still exists. Without this the seat is
        // soft-locked: reattach() has already cancelled the forfeit timer, and the server rejects
        // every message except targetChoice.
        if (this.flow.pendingPrompt === null)
            this.onPromptRestored(state.pendingPrompt);

        if (this.flow.pendingPlayCardId !== null)
        {
            const stillInHand = state.playerHand.some((c) => c.id === this.flow.pendingPlayCardId);
            const stillOnBoard = state.playerBoard.some((c) => c.id === this.flow.pendingPlayCardId);
            if (!stillInHand && !stillOnBoard)
            {
                this.flow.pendingPlayCardId = null;
                this.flow.awaitingServer = false;
            }
        }
    }

    private detectDraws(state: ClientGameState): void
    {
        if (this.previousState === null)
            return;

        const previousIds = new Set(this.previousState.playerHand.map((c) => c.id));
        for (const card of state.playerHand)
        {
            if (!previousIds.has(card.id))
                this.pendingDrawIds.add(card.id);
        }
    }
}
