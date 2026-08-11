import Phaser from "phaser";
import { Card, CardData } from "../objects/Card";
import { Hero, HeroData } from "./Hero";
import { Target, ResolvedTarget } from "./Target";
import { EndTurn } from "./EndTurn";

const BOARD_GAP_RATIO = 0.125;
const SLOT_WIDTH_RATIO = 0.09;
const SLOT_SIZE_RATIO = 0.07;
const SLOT_ASPECT_RATIO = 1.4;
const BOARD_PADDING_RATIO = 0.035;

const HERO_X_RATIO = 0.85;
const HERO_Y_RATIO = 0.85;
const HERO_SIZE_RATIO = 0.15;

const END_TURN_WIDTH_RATIO = 0.1;
const END_TURN_HEIGHT_RATIO = 0.055;
const END_TURN_X_RATIO = 0.86;
const END_TURN_Y_RATIO = 0.5;

export class Board
{
    private scene: Phaser.Scene;

    public playerCards: Card[] = [];
    public opponentCards: Card[] = [];
    private maxSlots: number = 6;

    private myTurn: boolean = false;

    public playerHero: Hero;
    public opponentHero: Hero;

    private boardZone: Phaser.GameObjects.Zone;
    private playerGraphic: Phaser.GameObjects.Rectangle;
    private opponentGraphic: Phaser.GameObjects.Rectangle;
    private endTurn: EndTurn;

    private allTargets: Target[] = [];

    constructor(scene: Phaser.Scene, slotCount = 6, playerHeroData: HeroData = { id: "hero-0", name: "PLAYER B)", health: 20 }, opponentHeroData: HeroData = { id: "hero-1", name: "Opponent >:]", health: 20 })
    {
        this.scene = scene;
        this.boardZone = scene.add.zone(0, 0, 0, 0).setRectangleDropZone(0, 0);
        this.playerGraphic = scene.add.rectangle(0, 0, 0, 0, 0x1a3a1a, 0.3).setStrokeStyle(1, 0x3a5a3a);
        this.opponentGraphic = scene.add.rectangle(0, 0, 0, 0, 0x1a3a1a, 0.3).setStrokeStyle(1, 0x3a5a3a);
        
        for (let i = 0; i < slotCount; i++)
        {
            //player slots are pair, opponent slots are odd index
            this.allTargets.push(Target.forMinionSlot(scene, () => this.playerCards[i] ?? null));
            this.allTargets.push(Target.forMinionSlot(scene, () => this.opponentCards[i] ?? null));
        }

        this.playerHero = new Hero(scene, playerHeroData, HERO_SIZE_RATIO * scene.scale.height);
        this.opponentHero = new Hero(scene, opponentHeroData, HERO_SIZE_RATIO * scene.scale.height);
        this.allTargets.push(Target.forHero(scene, this.playerHero));
        this.allTargets.push(Target.forHero(scene, this.opponentHero));

        this.endTurn = new EndTurn(scene, 10, 10);
    }

    //get X for count amount of cards
    private computeXs(count: number, width: number): number[]
    {
        if (count === 0)
            return [];
        const spacing = width * SLOT_WIDTH_RATIO;
        const totalWidth = (count - 1) * spacing;
        const startX = width / 2 - totalWidth / 2;
        const xs: number[] = [];
        for (let i = 0; i < count; i++)
            xs.push(startX + i * spacing);
        return xs;
    }

    layout(width = this.scene.scale.width, height = this.scene.scale.height)
    {
        const slotSize = width * SLOT_SIZE_RATIO;
        const slotHeight = slotSize * SLOT_ASPECT_RATIO;

        const maxSpacing = width * SLOT_WIDTH_RATIO;
        const maxTotalWidth = (this.maxSlots - 1) * maxSpacing;
        const boardWidth = maxTotalWidth + slotSize + width * BOARD_PADDING_RATIO * 2;
        const boardHeight = slotHeight + height * BOARD_PADDING_RATIO * 2;
        
        const playerY = height * BOARD_GAP_RATIO + height * 0.5;
        const opponentY = height * 0.5 - height * BOARD_GAP_RATIO;

        this.layoutRow(this.playerCards, playerY, width);
        this.layoutRow(this.opponentCards, opponentY, width);

        this.boardZone.setPosition(width / 2, playerY);
        this.boardZone.setSize(boardWidth, boardHeight);
        this.boardZone.input?.hitArea.setTo(0, 0, boardWidth, boardHeight);

        this.playerGraphic.setPosition(width / 2, playerY);
        this.playerGraphic.setSize(boardWidth, boardHeight);
        this.playerGraphic.setDepth(0);

        this.opponentGraphic.setPosition(width / 2, opponentY);
        this.opponentGraphic.setSize(boardWidth, boardHeight);
        this.opponentGraphic.setDepth(0);

        const playerXs = this.computeXs(this.playerCards.length, width);
        const opponentXs = this.computeXs(this.opponentCards.length, width);
        for (let i = 0; i < this.maxSlots; i++)
        {
            const playerTarget = this.allTargets[i * 2];
            const opponentTarget = this.allTargets[i * 2 + 1];
            playerTarget.layout(playerXs[i] ?? 0, playerY, slotSize, slotHeight);
            opponentTarget.layout(opponentXs[i] ?? 0, opponentY, slotSize, slotHeight);
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

        const endTurnWidth = width * END_TURN_WIDTH_RATIO;
        const endTurnHeight = height * END_TURN_HEIGHT_RATIO;
        this.endTurn.resize(endTurnWidth, endTurnHeight);
        this.endTurn.setPosition(width * END_TURN_X_RATIO, height * END_TURN_Y_RATIO);
    }

    private layoutRow(cards: Card[], y: number, width: number)
    {
        const xs = this.computeXs(cards.length, width);
        for (let i = 0; i < cards.length; i++)
        {
            const card = cards[i];
            card.setTransform(xs[i], y, 0, i);
            if (!card.isDragging)
                card.returnToBase();
        }
    }

    findInsertIndex(dropX: number, side: number = 0): number | undefined
    {
        const cards = side === 0 ? this.playerCards : this.opponentCards;
        if (cards.length >= this.maxSlots)
            return undefined;

        const xs = this.computeXs(cards.length, this.scene.scale.width);
        for (let i = 0; i < xs.length; i++)
        {
            if (dropX < xs[i])
                return i;
        }
        return cards.length;
    }

    insertCard(card: Card, index: number, side: number = 0)
    {
        const cards = side === 0 ? this.playerCards : this.opponentCards;
        cards.splice(index, 0, card);

        if (side === 1)
            card.disableInteractive();
        else
            card.setInteractive({ draggable: true, useHandCursor: true });

        this.layout();
    }

    syncBoardFromState(yourBoard: CardData[], opponentBoard: CardData[], isMyTurn: boolean): void
    {
        this.myTurn = isMyTurn;
        this.playerCards = this.syncRow(this.playerCards, yourBoard, 0);
        this.opponentCards = this.syncRow(this.opponentCards, opponentBoard, 1);
        this.layout();
    }

    private syncRow(cards: Card[], dataList: CardData[], side: number): Card[]
    {
        const remaining = [...cards];
        const next: Card[] = [];

        for (const data of dataList)
        {
            const existingIndex = remaining.findIndex((c) => c.cardData.id === data.id);
            if (existingIndex !== -1)
            {
                const card = remaining[existingIndex];
                card.updateData(data);
                next.push(card);
                remaining.splice(existingIndex, 1);
            }
            else
            {
                const card = new Card(this.scene, data);
                if (side === 1)
                    card.disableInteractive();
                else
                    card.setInteractive({ draggable: true, useHandCursor: true });
                next.push(card);
            }
        }

        remaining.forEach((c) => c.destroy());
        return next;
    }

    getZone(): Phaser.GameObjects.Zone
    {
        return this.boardZone;
    }

    removeCard(card: Card)
    {
        const playerIndex = this.playerCards.indexOf(card);
        if (playerIndex !== -1)
        {
            this.playerCards.splice(playerIndex, 1);
            this.layout(); // remaining cards recenter to close the gap
            return;
        }
        const opponentIndex = this.opponentCards.indexOf(card);
        if (opponentIndex !== -1)
        {
            this.opponentCards.splice(opponentIndex, 1);
            this.layout();
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
        const cards = side === 0 ? this.playerCards : this.opponentCards;
        return cards.includes(card);
    }

    getTargetById(id: string): Target | undefined
    {
        return this.allTargets.find((target: Target) =>
            {
                const resolved = target.resolve();

                if (resolved?.kind == "hero")
                    return resolved?.hero.heroData.id === id;
                else
                    return resolved?.card.cardData.id === id;
            });
    }

    setTargetHighlights(legalIds: Set<string>): void
    {
        for (const target of this.allTargets)
        {
            const resolved = target.resolve();

            if (!resolved)
                continue;

            if (resolved?.kind == "hero")
                target.setHighlighted(legalIds.has(resolved.hero.heroData.id));
            else
                target.setHighlighted(legalIds.has(resolved.card.cardData.id));
        }
    }

    clearTargetHighlights(): void
    {
        for (const target of this.allTargets)
            target.setHighlighted(false);
    }
}
