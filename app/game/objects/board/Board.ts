import Phaser from "phaser";
import { Card, CardData } from "../Card";
import { Hero, HeroData } from "../Hero";
import { Target } from "../Target";
import { EndTurn } from "../EndTurn";
import { Manabar } from "../ManaBar";
import { Deck } from "../Deck";
import { ClientGameState } from "../../shared/protocol";
import { CardRow } from "./CardRow";
import { TargetRegistry } from "./TargetRegistry";
import { computeXs } from "./BoardMath";

const BOARD_GAP_RATIO = 0.125;
const SLOT_SIZE_RATIO = 0.20;
const SLOT_ASPECT_RATIO = 0.8;
const BOARD_PADDING_RATIO = 0.035;

const CARD_HEIGHT_RATIO = 0.15;

const HERO_Y_RATIO = 0.85;
const HERO_SIZE_RATIO = 0.16;
const HERO_OFFSET_RATIO = 0.5;

const END_TURN_WIDTH_RATIO = 0.2;
const END_TURN_HEIGHT_RATIO = 0.07;
const END_TURN_OFFSET_RATIO = 0.55;
const END_TURN_Y_RATIO = 0.5;

export class Board
{
    private scene: Phaser.Scene;
    private maxSlots: number;

    private playerRow: CardRow;
    private opponentRow: CardRow;
    private targets = new TargetRegistry();

    public playerHero: Hero;
    public opponentHero: Hero;
    private playerManaBar: Manabar;
    private playerDeck: Deck;
    private opponentDeck: Deck;

    private boardZone: Phaser.GameObjects.Zone;
    private playerGraphic: Phaser.GameObjects.Rectangle;
    private opponentGraphic: Phaser.GameObjects.Rectangle;
    private endTurn: EndTurn;

    constructor(scene: Phaser.Scene, slotCount = 6, playerHeroData: HeroData, opponentHeroData: HeroData)
    {
        this.scene = scene;
        this.maxSlots = slotCount;
        this.playerRow = new CardRow(scene, 0, slotCount);
        this.opponentRow = new CardRow(scene, 1, slotCount);

        this.boardZone = scene.add.zone(0, 0, 0, 0).setRectangleDropZone(0, 0);
        this.playerGraphic = scene.add.rectangle(0, 0, 0, 0, 0x1a3a1a, 0.3).setStrokeStyle(1, 0x3a5a3a);
        this.opponentGraphic = scene.add.rectangle(0, 0, 0, 0, 0x1a3a1a, 0.3).setStrokeStyle(1, 0x3a5a3a);

        for (let i = 0; i < slotCount; i++)
        {
            this.targets.add(Target.forMinionSlot(scene, () => this.playerRow.all[i] ?? null));
            this.targets.add(Target.forMinionSlot(scene, () => this.opponentRow.all[i] ?? null));
        }

        this.playerHero = new Hero(scene, playerHeroData, HERO_SIZE_RATIO * scene.scale.height);
        this.opponentHero = new Hero(scene, opponentHeroData, HERO_SIZE_RATIO * scene.scale.height);
        this.targets.add(Target.forHero(scene, this.playerHero));
        this.targets.add(Target.forHero(scene, this.opponentHero));

        this.endTurn = new EndTurn(scene, 10, 10);
        this.playerManaBar = new Manabar(scene, 0, 0, 200, 20);
        this.playerDeck = new Deck(scene, 0, 0, scene.scale.height * 0.08, scene.scale.height * 0.12);
        this.opponentDeck = new Deck(scene, 0, 0, scene.scale.height * 0.08, scene.scale.height * 0.12);
    }

    layout(width = this.scene.scale.width, height = this.scene.scale.height): void
    {
        const slotSize = height * SLOT_SIZE_RATIO;
        const slotHeight = slotSize * SLOT_ASPECT_RATIO;
        const slotSpacing = slotSize * 0.8;
        const boardWidth = (this.maxSlots - 1) * slotSpacing + slotSize + height * BOARD_PADDING_RATIO * 2;
        const boardHeight = slotHeight + height * BOARD_PADDING_RATIO * 2;

        const playerY = height * BOARD_GAP_RATIO + height * 0.5;
        const opponentY = height * 0.5 - height * BOARD_GAP_RATIO;

        this.playerRow.layout(playerY, width, height, CARD_HEIGHT_RATIO);
        this.opponentRow.layout(opponentY, width, height, CARD_HEIGHT_RATIO);

        this.boardZone.setPosition(width / 2, playerY);
        this.boardZone.setSize(boardWidth, boardHeight);
        this.boardZone.input?.hitArea.setTo(0, 0, boardWidth, boardHeight);

        this.playerGraphic.setPosition(width / 2, playerY);
        this.playerGraphic.setSize(boardWidth, boardHeight);
        this.playerGraphic.setDepth(0);

        this.opponentGraphic.setPosition(width / 2, opponentY);
        this.opponentGraphic.setSize(boardWidth, boardHeight);
        this.opponentGraphic.setDepth(0);

        const playerXs = computeXs(this.playerRow.all.length, height, width / 2, SLOT_SIZE_RATIO);
        const opponentXs = computeXs(this.opponentRow.all.length, height, width / 2, SLOT_SIZE_RATIO);
        for (let i = 0; i < this.maxSlots; i++)
        {
            const playerTarget = this.targets.at(i * 2);
            const opponentTarget = this.targets.at(i * 2 + 1);
            playerTarget.layout(playerXs[i] ?? 0, playerY, slotSize, slotHeight);
            opponentTarget.layout(opponentXs[i] ?? 0, opponentY, slotSize, slotHeight);
        }

        const heroSize = height * HERO_SIZE_RATIO;
        const heroX = width / 2 + height * HERO_OFFSET_RATIO;
        const playerHeroY = height * HERO_Y_RATIO;
        const opponentHeroY = height * (1 - HERO_Y_RATIO);

        this.playerHero.resize(heroSize);
        this.opponentHero.resize(heroSize);
        this.playerHero.setPosition(heroX, playerHeroY);
        this.opponentHero.setPosition(heroX, opponentHeroY);

        const allTargets = this.targets.all();
        const playerHeroTarget = allTargets[allTargets.length - 2];
        const opponentHeroTarget = allTargets[allTargets.length - 1];
        playerHeroTarget.layout(heroX, playerHeroY, this.playerHero.width, this.playerHero.height);
        opponentHeroTarget.layout(heroX, opponentHeroY, this.opponentHero.width, this.opponentHero.height);

        const endTurnWidth = height * END_TURN_WIDTH_RATIO;
        const endTurnHeight = height * END_TURN_HEIGHT_RATIO;
        this.endTurn.resize(endTurnWidth, endTurnHeight);
        this.endTurn.setPosition(width / 2 + height * END_TURN_OFFSET_RATIO, height * END_TURN_Y_RATIO);

        const manabarX = width / 2 - height * 0.5;
        const manabarY = height * 0.9;
        this.playerManaBar.setPosition(manabarX, manabarY);
        this.playerManaBar.resize(height * 0.22, height * 0.045);

        const playerDeckX = width / 2 - height * 0.6;
        const playerDeckY = height * 0.6;
        this.playerDeck.setPosition(playerDeckX, playerDeckY, height * 0.03);

        const opponentDeckX = width / 2 - height * 0.6;
        const opponentDeckY = height * 0.4;
        this.opponentDeck.setPosition(opponentDeckX, opponentDeckY, height * 0.03);
        this.playerDeck.resize(height * 0.08, height * 0.12);
        this.opponentDeck.resize(height * 0.08, height * 0.12);
    }

    findInsertIndex(dropX: number, side: 0 | 1 = 0): number | undefined
    {
        const row = side === 0 ? this.playerRow : this.opponentRow;
        return row.findInsertIndex(dropX, this.scene.scale.height, this.scene.scale.width / 2, SLOT_SIZE_RATIO);
    }

    insertCard(card: Card, index: number, side: 0 | 1 = 0): void
    {
        const row = side === 0 ? this.playerRow : this.opponentRow;
        row.insert(card, index);
        this.layout();
    }

    syncBoardFromState(yourBoard: CardData[], opponentBoard: CardData[], state: ClientGameState): void
    {
        this.playerRow.sync(yourBoard);
        this.opponentRow.sync(opponentBoard);

        this.opponentDeck.update(state.opponentDeck);
        this.playerDeck.update(state.playerDeck);
        this.playerManaBar.update(state.mana, state.maxMana);

        this.layout();
    }

    getZone(): Phaser.GameObjects.Zone
    {
        return this.boardZone;
    }

    isPointOverBoard(point: Phaser.Input.Pointer | { x: number; y: number }): boolean
    {
        const bounds = this.boardZone.getBounds();
        return bounds.contains(point.x, point.y);
    }

    removeCard(card: Card): void
    {
        if (this.playerRow.remove(card) || this.opponentRow.remove(card))
            this.layout(); // remaining cards recenter to close the gap
    }

    getAllTargets(): Target[]
    {
        return this.targets.all();
    }

    resolveTarget(zone: Phaser.GameObjects.Zone)
    {
        return this.targets.resolve(zone);
    }

    containsCard(card: Card, side: 0 | 1 = 0): boolean
    {
        const row = side === 0 ? this.playerRow : this.opponentRow;
        return row.contains(card);
    }

    getTargetById(id: string): Target | undefined
    {
        return this.targets.getById(id);
    }

    setTargetHighlights(legalIds: Set<string>): void
    {
        this.targets.setHighlights(legalIds);
    }

    clearTargetHighlights(): void
    {
        this.targets.clearHighlights();
    }

    findCardById(id: string): Card | undefined
    {
        return this.playerRow.findById(id) ?? this.opponentRow.findById(id);
    }

    getDeckPosition(side: 0 | 1): { x: number; y: number }
    {
        const deck = side === 0 ? this.playerDeck : this.opponentDeck;
        const centerX = deck.graphic.x + (deck.graphic.width * deck.graphic.originX);
        const centerY = deck.graphic.y + (deck.graphic.height * deck.graphic.originY);
        return { x: centerX, y: centerY };
    }
}
