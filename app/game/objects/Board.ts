import Phaser from "phaser";
import { Card, CardData } from "../objects/Card";
import { Hero, HeroData } from "./Hero";
import { Target, ResolvedTarget } from "./Target";

const PLAYER_Y_RATIO = 0.60;
const OPPONENT_Y_RATIO = 0.35;
const SLOT_WIDTH_RATIO = 0.090;
const SLOT_SIZE_RATIO = 0.07;
const SLOT_ASPECT_RATIO = 1.4;
const BOARD_PADDING_RATIO = 0.035;
const HERO_X_RATIO = 0.85;
const HERO_Y_RATIO = 0.85;
const HERO_SIZE_RATIO = 0.15;

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
    public opponentSlots: BoardSlot[] = [];

    public playerHero: Hero;
    public opponentHero: Hero;

    private boardZone: Phaser.GameObjects.Zone;

    private playerGraphic: Phaser.GameObjects.Rectangle;
    private opponentGraphic: Phaser.GameObjects.Rectangle;

    private allTargets: Target[] = [];
    private slotSize = 0;
    private slotHeight = 0;

    constructor(scene: Phaser.Scene, slotCount = 6, playerHeroData: HeroData = { name: "PLAYER B)", health: 30 }, opponentHeroData: HeroData = { name: "Opponent >:]", health: 30 })
    {
        this.scene = scene;
        this.boardZone = scene.add.zone(0, 0, 0, 0).setRectangleDropZone(0, 0);
        this.playerGraphic = scene.add.rectangle(0, 0, 0, 0, 0x1a3a1a, 0.3).setStrokeStyle(1, 0x3a5a3a);
        this.opponentGraphic = scene.add.rectangle(0, 0, 0, 0, 0x1a3a1a, 0.3).setStrokeStyle(1, 0x3a5a3a);
        for (let i = 0; i < slotCount; i++)
        {
            this.opponentSlots.push({ index: i, x: 0, y: 0, card: null });
            this.slots.push({ index: i, x: 0, y: 0, card: null });

            const playerSlot = this.slots[i];
            const opponentSlot = this.opponentSlots[i];
            //player slots are pair, opponent slots are odd index
            this.allTargets.push(Target.forMinionSlot(scene, () => playerSlot.card));
            this.allTargets.push(Target.forMinionSlot(scene, () => opponentSlot.card));
        }

        this.playerHero = new Hero(scene, playerHeroData, HERO_SIZE_RATIO * scene.scale.height);
        this.opponentHero = new Hero(scene, opponentHeroData, HERO_SIZE_RATIO * scene.scale.height);

        this.allTargets.push(Target.forHero(scene, this.playerHero));
        this.allTargets.push(Target.forHero(scene, this.opponentHero));
    }

    layout(width = this.scene.scale.width, height = this.scene.scale.height)
    {
        this.slotSize = width * SLOT_SIZE_RATIO;
        this.slotHeight = this.slotSize * SLOT_ASPECT_RATIO;

        const slotSpacing = width * SLOT_WIDTH_RATIO;
        const totalWidth = (this.slots.length - 1) * slotSpacing;
        const startX = width / 2 - totalWidth / 2;

        const boardWidth = totalWidth + this.slotSize + width * BOARD_PADDING_RATIO * 2;
        const boardHeight = this.slotHeight + height * BOARD_PADDING_RATIO * 2;

        this.layoutRow(this.slots, height * PLAYER_Y_RATIO, startX, slotSpacing);
        this.layoutRow(this.opponentSlots, height * OPPONENT_Y_RATIO, startX, slotSpacing);

        this.boardZone.setPosition(width / 2, height * PLAYER_Y_RATIO);
        this.boardZone.setSize(boardWidth, boardHeight);
        this.boardZone.input?.hitArea.setTo(0, 0, boardWidth, boardHeight);

        this.playerGraphic.setPosition(width / 2, height * PLAYER_Y_RATIO);
        this.playerGraphic.setSize(boardWidth, boardHeight);
        this.playerGraphic.setDepth(0);

        this.opponentGraphic.setPosition(width / 2, height * OPPONENT_Y_RATIO);
        this.opponentGraphic.setSize(boardWidth, boardHeight);
        this.opponentGraphic.setDepth(0);

        for (let i = 0; i < this.slots.length; i++)
        {
            const playerTarget = this.allTargets[i * 2];
            const opponentTarget = this.allTargets[i * 2 + 1];
            playerTarget.layout(this.slots[i].x, this.slots[i].y, this.slotSize, this.slotHeight);
            opponentTarget.layout(this.opponentSlots[i].x, this.opponentSlots[i].y, this.slotSize, this.slotHeight);
        }

        const heroX = width * HERO_X_RATIO;

        const playerHeroY = height * HERO_Y_RATIO;
        const opponentHeroY = height * (1 - HERO_Y_RATIO);

        this.playerHero.setPosition(heroX, playerHeroY);
        this.opponentHero.setPosition(heroX, opponentHeroY);

        const playerHeroTarget = this.allTargets[this.allTargets.length - 2];
        const opponentHeroTarget = this.allTargets[this.allTargets.length - 1];
        playerHeroTarget.layout(heroX, playerHeroY, this.playerHero.width, this.playerHero.height);
        opponentHeroTarget.layout(heroX, opponentHeroY, this.opponentHero.width, this.opponentHero.height);
    }

    private layoutRow(slots: BoardSlot[], y: number, startX: number, spacing: number)
    {
        for (let i = 0; i < slots.length; i++)
        {
            const slot = slots[i];
            const x = startX + i * spacing;
            slot.x = x;
            slot.y = y;

            if (slot.card)
            {
                slot.card.setTransform(x, y, 0, i);
                if (!slot.card.isDragging)
                    slot.card.returnToBase();
            }
        }
    }

    getZone(): Phaser.GameObjects.Zone
    {
        return this.boardZone;
    }

    findNearestOpenSlot(dropX: number, side: number = 0): BoardSlot | undefined
    {
        const slots = side === 0 ? this.slots : this.opponentSlots;
        const openSlots = slots.filter((s) => s.card === null);
        if (openSlots.length === 0)
            return undefined;
        return openSlots.reduce((closest, slot) => Math.abs(slot.x - dropX) < Math.abs(closest.x - dropX) ? slot : closest);
    }

    findOpenSlot(side: number = 0): BoardSlot | undefined
    {
        const slots = side === 0 ? this.slots : this.opponentSlots;
        for (let i = 0; i < slots.length; i++)
        {
            if (slots[i].card === null)
                return slots[i];
        }
        return undefined;
    }

    placeCard(card: Card, slot: BoardSlot, side: number = 0)
    {
        slot.card = card;
        card.setTransform(slot.x, slot.y, 0, slot.index);
        card.returnToBase();
        if (side === 1)
            card.disableInteractive();
    }

    removeCard(card: Card)
    {
        for (const slot of [...this.slots, ...this.opponentSlots])
        {
            if (slot.card === card)
            {
                slot.card = null;
                return;
            }
        }
    }

    getAllTargets(): Target[]
    {
        return this.allTargets;
    }

    resolveTarget(zone: Phaser.GameObjects.Zone): ResolvedTarget | undefined
    {
        const target = this.allTargets.find((t) => t.getZone() === zone);
        return target?.resolve();
    }

    containsCard(card: Card, side: number = 0): boolean
    {
        const slots = side === 0 ? this.slots : this.opponentSlots;
        return slots.some((s) => s.card === card);
    }

    /** Dev-only helper until real opponent state comes from the server. */
    addOpponentMockCard(data: CardData, slotIndex: number)
    {
        const slot = this.opponentSlots[slotIndex];
        if (!slot || slot.card)
            return;
        const size = this.slotSize || this.scene.scale.width * SLOT_SIZE_RATIO;
        const height = this.slotHeight || size * SLOT_ASPECT_RATIO;
        const card = new Card(this.scene, data, size, height);
        this.placeCard(card, slot, 1);
    }
}
