import Phaser from "phaser";
import { Card } from "../objects/Card";

const SLOT_Y_RATIO = 0.38;
const SLOT_WIDTH_RATIO = 0.1;
const SLOT_SIZE_RATIO = 0.09;
const SLOT_ASPECT_RATIO = 1.4;
const BOARD_PADDING_RATIO = 0.05;

export interface BoardSlot
{
    index: number;
    x: number;
    y: number;
    card: Card | null;
}

export class Board
{
    private scene: Phaser.Scene;
    public slots: BoardSlot[] = [];
    private boardZone: Phaser.GameObjects.Zone;
    private boardGraphic: Phaser.GameObjects.Rectangle;

    constructor(scene: Phaser.Scene, slotCount = 7)
    {
        this.scene = scene;
        this.boardZone = scene.add.zone(0, 0, 0, 0).setRectangleDropZone(0, 0);
        this.boardGraphic = scene.add.rectangle(0, 0, 0, 0, 0x1a3a1a, 0.3).setStrokeStyle(1, 0x3a5a3a);

        for (let i = 0; i < slotCount; i++)
            this.slots.push({ index: i, x: 0, y: 0, card: null });
    }

    layout(width = this.scene.scale.width, height = this.scene.scale.height)
    {
        const y = height * SLOT_Y_RATIO;
        const slotSpacing = width * SLOT_WIDTH_RATIO;
        const slotSize = width * SLOT_SIZE_RATIO;
        const slotHeight = slotSize * SLOT_ASPECT_RATIO;

        const totalWidth = (this.slots.length - 1) * slotSpacing;
        const startX = width / 2 - totalWidth / 2;

        for (let i = 0; i < this.slots.length; i++)
        {
            let slot = this.slots[i];
            const x = startX + i * slotSpacing;
            slot.x = x;
            slot.y = y;

            if (slot.card)
            {
                slot.card.setTransform(x, y, 0, i);
                if (!slot.card.isDragging)
                    slot.card.returnToBase();
            }
        }
        const boardWidth = totalWidth + slotSize + width * BOARD_PADDING_RATIO * 2;
        const boardHeight = slotHeight + height * BOARD_PADDING_RATIO * 2;

        this.boardZone.setPosition(width / 2, y);
        this.boardZone.setSize(boardWidth, boardHeight);
        this.boardZone.input?.hitArea.setTo(0, 0, boardWidth, boardHeight);
        //this.boardZone.setRectangleDropZone(boardWidth, boardHeight);

        this.boardGraphic.setPosition(width / 2, y);
        this.boardGraphic.setSize(boardWidth, boardHeight);
        this.boardGraphic.setDepth(0);
    }

    getZone(): Phaser.GameObjects.Zone
    {
        return this.boardZone;
    }

    findNearestOpenSlot(dropX: number): BoardSlot | undefined
    {
        const openSlots = this.slots.filter((s) => s.card === null);
        if (openSlots.length === 0)
            return undefined;
        return openSlots.reduce((closest, slot) => Math.abs(slot.x - dropX) < Math.abs(closest.x - dropX) ? slot : closest);
    }

    findOpenSlot(): BoardSlot | undefined
    {
        for (let i = 0; i < this.slots.length; i++)
        {
            if (this.slots[i].card === null)
                return this.slots[i];
        }
        return undefined;
    }

    placeCard(card: Card, slot: BoardSlot)
    {
        slot.card = card;
        card.setTransform(slot.x, slot.y, 0, slot.index);
        card.returnToBase();
        card.disableInteractive(); // re-enable later once attack/target interactions are added
    }

    removeCard(card: Card)
    {
        for (let i = 0; i < this.slots.length; i++)
        {
            if (this.slots[i].card === card)
            {
                this.slots[i].card = null;
                break;
            }
        }
    }
}
