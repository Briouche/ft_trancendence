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

const BOARD_MARGIN = 0.1;
const BOARD_GAP_RATIO = 0.125;
const SLOT_SIZE_RATIO = 0.20;
const SLOT_ASPECT_RATIO = 0.8;
const BOARD_PADDING_RATIO = 0.035;

const CARD_HEIGHT_RATIO = 0.15;
const CARD_ASPECT_RATIO = 1.4;
const DECK_HEIGHT_RATIO = 0.22;
const DECK_WIDTH_RATIO = 0.15;

const HERO_Y_RATIO = 0.85;
const HERO_SIZE_RATIO = 0.16;
const HERO_OFFSET_RATIO = 0.45;

const END_TURN_WIDTH_RATIO = 0.2;
const END_TURN_HEIGHT_RATIO = 0.07;
const END_TURN_OFFSET_RATIO = 0.65;
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
    //private boardGraphic: Phaser.GameObjects.NineSlice;
    private playerGraphic: Phaser.GameObjects.Rectangle;
    private opponentGraphic: Phaser.GameObjects.Rectangle;
    private endTurn: EndTurn;

    private yourTurn: boolean = false;

    constructor(scene: Phaser.Scene, slotCount = 6, playerHeroData: HeroData, opponentHeroData: HeroData)
    {
        this.scene = scene;
        this.maxSlots = slotCount;
        this.playerRow = new CardRow(scene, 0, slotCount);
        this.opponentRow = new CardRow(scene, 1, slotCount);

        this.boardZone = scene.add.zone(0, 0, 0, 0).setRectangleDropZone(0, 0);
        //this.boardGraphic = scene.add.nineslice(0, 0, "boardFrame", undefined, 10, 10, 150, 150, 150, 150);
        this.playerGraphic = scene.add.rectangle(0, 0, 0, 0, 0xa4c6e6, 0.07).setStrokeStyle(1, 0x7fa2c7);
        this.opponentGraphic = scene.add.rectangle(0, 0, 0, 0, 0xa4c6e6, 0.07).setStrokeStyle(1, 0x7fa2c7);

        for (let i = 0; i < slotCount; i++)
        {
            this.targets.add(Target.forMinionSlot(scene, () => this.playerRow.all[i] ?? null));
            this.targets.add(Target.forMinionSlot(scene, () => this.opponentRow.all[i] ?? null));
        }

        this.playerHero = new Hero(scene, playerHeroData, HERO_SIZE_RATIO * scene.scale.height, false);
        this.opponentHero = new Hero(scene, opponentHeroData, HERO_SIZE_RATIO * scene.scale.height, true);
        this.targets.add(Target.forHero(scene, this.playerHero));
        this.targets.add(Target.forHero(scene, this.opponentHero));

        this.endTurn = new EndTurn(scene, 10, 10);
        this.playerManaBar = new Manabar(scene, 0, 0, 250, 30);
        this.playerDeck = new Deck(scene, 0, 0, scene.scale.height * DECK_WIDTH_RATIO, scene.scale.height * DECK_HEIGHT_RATIO);
        this.opponentDeck = new Deck(scene, 0, 0, scene.scale.height * DECK_WIDTH_RATIO, scene.scale.height * DECK_HEIGHT_RATIO);
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

        //this.boardGraphic.setPosition(width / 2, height * 0.5);
        //this.boardGraphic.setSize(boardWidth + BOARD_MARGIN * boardHeight * 2, boardHeight * 2 + BOARD_MARGIN * boardHeight * 2);
        //this.boardGraphic.setDepth(0);

        this.playerGraphic.setPosition(width / 2, playerY);
        this.playerGraphic.setSize(boardWidth, boardHeight);
        this.playerGraphic.setDepth(0);

        this.opponentGraphic.setPosition(width / 2, opponentY);
        this.opponentGraphic.setSize(boardWidth, boardHeight);
        this.opponentGraphic.setDepth(0);

        const playerXs = computeXs(this.playerRow.all.length, height, width / 2, CARD_HEIGHT_RATIO);
        const opponentXs = computeXs(this.opponentRow.all.length, height, width / 2, CARD_HEIGHT_RATIO);
        const cardSize = height * CARD_HEIGHT_RATIO;
        const cardHeight = cardSize * CARD_ASPECT_RATIO;
        for (let i = 0; i < this.maxSlots; i++)
        {
            const playerTarget = this.targets.at(i * 2);
            const opponentTarget = this.targets.at(i * 2 + 1);
            playerTarget.layout(playerXs[i] ?? 0, playerY, cardSize, cardHeight);
            opponentTarget.layout(opponentXs[i] ?? 0, opponentY, cardSize, cardHeight);
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
        const playerZoneOffset = this.playerHero.getZoneOffset();
        const opponentZoneOffset = this.opponentHero.getZoneOffset();
        playerHeroTarget.layout(heroX + playerZoneOffset.x, playerHeroY + playerZoneOffset.y, this.playerHero.width, this.playerHero.height);
        opponentHeroTarget.layout(heroX + opponentZoneOffset.x, opponentHeroY + opponentZoneOffset.y, this.opponentHero.width, this.opponentHero.height);

        const endTurnWidth = height * END_TURN_WIDTH_RATIO;
        const endTurnHeight = height * END_TURN_HEIGHT_RATIO;
        this.endTurn.resize(endTurnWidth, endTurnHeight);
        this.endTurn.setPosition(width / 2 + height * END_TURN_OFFSET_RATIO, height * END_TURN_Y_RATIO);

        const manabarX = width / 2 - height * 0.55;
        const manabarY = height * 0.8;
        this.playerManaBar.setPosition(manabarX, manabarY);
        this.playerManaBar.resize(height * 0.28, height * 0.05);

        const playerDeckX = width / 2 - height * 0.65;
        const playerDeckY = height * 0.63;
        this.playerDeck.setPosition(playerDeckX, playerDeckY, height * 0.03);

        const opponentDeckX = width / 2 - height * 0.65;
        const opponentDeckY = height * 0.37;
        this.opponentDeck.setPosition(opponentDeckX, opponentDeckY, height * 0.03);
        this.playerDeck.resize(height * DECK_WIDTH_RATIO, height * DECK_HEIGHT_RATIO);
        this.opponentDeck.resize(height * DECK_WIDTH_RATIO, height * DECK_HEIGHT_RATIO);
    }

    findInsertIndex(dropX: number, side: 0 | 1 = 0): number | undefined
    {
        const row = side === 0 ? this.playerRow : this.opponentRow;
        return row.findInsertIndex(dropX, this.scene.scale.height, this.scene.scale.width / 2, SLOT_SIZE_RATIO);
    }

    insertCard(card: Card, index: number, side: 0 | 1 = 0): void
    {
        const row = side === 0 ? this.playerRow : this.opponentRow;
        row.insert(card, index, this.yourTurn);
        this.layout();
    }

    syncBoardFromState(yourBoard: CardData[], opponentBoard: CardData[], state: ClientGameState): void
    {
        this.yourTurn = state.yourTurn;
        this.playerRow.sync(yourBoard, state.yourTurn);
        this.opponentRow.sync(opponentBoard, state.yourTurn);

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

    getLegalAttackTargetIds(): Set<string>
    {
        const tauntMinions = this.opponentRow.all.filter((c) => c.cardData.effects?.taunt);
        const minions = tauntMinions.length > 0 ? tauntMinions : this.opponentRow.all;

        const ids = new Set(minions.map((c) => c.cardData.id));
        if (tauntMinions.length === 0)
            ids.add(this.opponentHero.heroData.id);
        return ids;
    }

    getLegalSpellTargetIds(): Set<string>
    {
        const ids = new Set([...this.playerRow.all, ...this.opponentRow.all].map((c) => c.cardData.id));
        ids.add(this.playerHero.heroData.id);
        ids.add(this.opponentHero.heroData.id);
        return ids;
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
        return { x: deck.graphic.x, y: deck.graphic.y };
    }
}
