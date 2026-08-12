import Phaser from "phaser";
import { Card, CardData } from "../objects/Card";
import { EventManager } from "../EventManager";
import { Hand } from "../objects/Hand";
import { Board, BoardSlot } from "../objects/Board";
import { OpponentHand } from "../objects/OpponentHand";
import { TargetArrow } from "../objects/TargetArrow";

const MOCK_HAND: CardData[] = [
    { index: 0, name: "Fire Imp", cost: 2, attack: 3, health: 1 },
    { index: 0, name: "Fire Imp", cost: 2, attack: 3, health: 1 },
    { index: 0, name: "Fire Imp", cost: 2, attack: 3, health: 1 },
    { index: 0, name: "Fire Imp", cost: 2, attack: 3, health: 1 },
    { index: 0, name: "Fire Imp", cost: 2, attack: 3, health: 1 },
    { index: 1, name: "Stone Wall", cost: 3, attack: 0, health: 6 },
    { index: 1, name: "Stone Wall", cost: 3, attack: 0, health: 6 },
    { index: 2, name: "Healing Rain", cost: 4 },
];

const MOCK_OPPONENT_BOARD: CardData[] = [
    { index: 100, name: "Goblin Grunt", cost: 1, attack: 2, health: 1 },
    { index: 101, name: "Iron Golem", cost: 5, attack: 4, health: 7 },
];

export class GameScene extends Phaser.Scene
{
    private hand!: Hand;
    private board!: Board;
    private opponentHand!: OpponentHand;

    private targettingCard: Card | null = null;
    private targetArrow: TargetArrow | null = null;

    constructor()
    {
        super("GameScene");
    }

    create()
    {
        this.hand = new Hand(this);
        this.board = new Board(this);
        this.opponentHand = new OpponentHand(this);

        //temp until input from engine
        MOCK_HAND.forEach((data) => 
            this.hand.addCard(data));
        this.opponentHand.setCount(7);
        MOCK_OPPONENT_BOARD.forEach((data, i) => this.board.addOpponentMockCard(data, i));

        this.layout();

        // dropzone debugger: view "hitbox"
        this.input.enableDebug(this.board.getZone());
        this.board.getAllTargets().forEach((target) =>
        {
            this.input.enableDebug(target.getZone());
        });

        this.scale.on("resize", this.layout, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
        {
            this.scale.off("resize", this.layout, this);
        });

        this.registerInput();

        EventManager.on("server:cardPlayed", (data: { cardId: string }) =>
        {
            console.log("Server confirmed card played:", data.cardId);
        });
    }

    private layout()
    {
        this.hand.layout();
        this.board.layout();
        this.opponentHand.layout();
    }

    //handle drag and drop
    private registerInput()
    {
        this.input.on("dragstart", (_p: Phaser.Input.Pointer, obj: Card) =>
        {
            obj.isDragging = true;
            obj.setDepth(1000);
            if (this.board.containsCard(obj, 0) && obj.canAttack)
            {
                this.targettingCard = obj;
                this.targetArrow = new TargetArrow(this, obj.x, obj.y);
            }
        });

        this.input.on("drag", (_p: Phaser.Input.Pointer, obj: Card, dragX: number, dragY: number) =>
        {
            if (this.targettingCard === obj)
            {
                this.targetArrow?.updateEnd(_p.x, _p.y);
                return ;
            }
            if (this.hand.containsCard(obj))
            {
                obj.x = dragX;
                obj.y = dragY;
            }
        });

        this.input.on("drop", (_p: Phaser.Input.Pointer, obj: Card, zone: Phaser.GameObjects.Zone) =>
        {
            if (this.targettingCard === obj && this.board.containsCard(obj, 0) && obj.canAttack)
            {
                const resolvedTarget = this.board.resolveTarget(zone);
                console.log("attack drop -> zone:", zone, "resolved:", resolvedTarget);
                if (!resolvedTarget)
                    return ;

                this.animateAttack(obj, zone.x, zone.y);
                return ;
            }

            if (this.hand.containsCard(obj))
            {
                //right now only accept board as dropzone, later should change to avaiable targets for spells too?
                if (zone !== this.board.getZone())
                    return ;
                const slot = this.board.findNearestOpenSlot(obj.x);
                if (slot)
                    this.playCard(obj, slot);
            }
        });

        //handle snapback
        this.input.on("dragend", (_p: Phaser.Input.Pointer, obj: Card) =>
        {
            obj.isDragging = false;

            if (this.targettingCard === obj)
            {
                this.targetArrow?.destroy();
                this.targetArrow = null;
                this.targettingCard = null;
                return ;
            }
            if (this.hand.containsCard(obj))
                obj.returnToBase();
        });
    }

    private playCard(card: Card, slot: BoardSlot)
    {
        this.hand.removeCard(card);
        this.board.placeCard(card, slot);

        //hookup to engine
        EventManager.emit("client:playCard", { cardId: card.cardData.index, slotIndex: slot.index });
    }

    private animateAttack(card: Card, toX: number, toY: number)
    {
        const angle = Phaser.Math.Angle.Between(card.x, card.y, toX, toY);
        const pullBackDistance = 60; 
        
        const backX = card.x - Math.cos(angle) * pullBackDistance;
        const backY = card.y - Math.sin(angle) * pullBackDistance;

        this.tweens.chain({
            targets: card,
            tweens: [
                {
                    x: backX,
                    y: backY,
                    duration: 300,       
                    ease: 'back.out'
                },
                {
                    x: toX,
                    y: toY,
                    duration: 100,       
                    ease: 'expo.in', 
                    onComplete: () => { this.cameras.main.shake(150, 0.01); }
                },
                {
                    x: toX,              
                    y: toY,
                    duration: 60,       
                    onComplete: () => {
                        card.returnToBase();
                    }
                }
            ]
        });
    }
}
