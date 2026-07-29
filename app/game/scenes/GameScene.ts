import Phaser from "phaser";
import { Card, CardData } from "../objects/Card";
import { EventManager } from "../EventManager";
import { Hand } from "../objects/Hand";
import { Board, BoardSlot } from "../objects/Board";

const MOCK_HAND: CardData[] = [
  { index: 0, name: "Fire Imp", cost: 2, attack: 3, health: 1 },
  { index: 0, name: "Fire Imp", cost: 2, attack: 3, health: 1 },
  { index: 0, name: "Fire Imp", cost: 2, attack: 3, health: 1 },
  { index: 0, name: "Fire Imp", cost: 2, attack: 3, health: 1 },
  { index: 0, name: "Fire Imp", cost: 2, attack: 3, health: 1 },
  { index: 1, name: "Stone Wall", cost: 3, attack: 0, health: 6 },
  { index: 2, name: "Healing Rain", cost: 4 },
];

export class GameScene extends Phaser.Scene
{
  private hand!: Hand;
  private board!: Board;

  constructor()
  {
    super("GameScene");
  }

  create() {
    this.hand = new Hand(this);
    this.board = new Board(this);
    
    MOCK_HAND.forEach((data) => this.hand.addCard(data));
    
    this.layout();
    // dropzone debugger
    //this.input.enableDebug(this.board.getZone());
    this.scale.on("resize", this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.layout, this);
    });

    this.registerInputHandlers();

    EventManager.on("server:cardPlayed", (data: { cardId: string }) => {
      console.log("Server confirmed card played:", data.cardId);
    });
  }

  private layout() {
    this.hand.layout();
    this.board.layout();
  }

  private registerInputHandlers() {
    this.input.on("dragstart", (_p: Phaser.Input.Pointer, obj: Card) => {
      obj.isDragging = true;
      obj.setDepth(1000);
    });

    this.input.on("drag", (_p: Phaser.Input.Pointer, obj: Card, dragX: number, dragY: number) => {
      obj.x = dragX;
      obj.y = dragY;
    });

    this.input.on(
      "drop",
      (_p: Phaser.Input.Pointer, obj: Card, zone: Phaser.GameObjects.Zone) => {
        if (!this.hand.containsCard(obj)) return; // only hand->board plays for now
        if (zone !== this.board.getZone()) return; // dropped on something other than the board

        const slot = this.board.findNearestOpenSlot(obj.x);
        if (slot) {
          this.playCard(obj, slot);
        }
        // board full, or no open slot near this position: dragend below handles snap-back
      }
    );

    this.input.on("dragend", (_p: Phaser.Input.Pointer, obj: Card) => {
      obj.isDragging = false;

      if (this.hand.containsCard(obj)) {
        // Wasn't successfully played onto the board -> just return it to its fan position.
        obj.returnToBase();
      }
    });
  }

  private playCard(card: Card, slot: BoardSlot) {
    this.hand.removeCard(card);
    this.board.placeCard(card, slot);

    EventManager.emit("client:playCard", { cardId: card.cardData.index, slotIndex: slot.index });
  }
}
