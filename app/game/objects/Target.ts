import Phaser from "phaser";
import { Card } from "./card/Card";
import { Hero } from "./Hero";

export type ResolvedTarget = { kind: "hero"; hero: Hero; id: string } | { kind: "minion"; card: Card; id: string };

const HIGHLIGHT_DEPTH = 1500;

/** A targetable hero or minion slot: drop zone + highlight ring. */
export class Target
{
    private zone: Phaser.GameObjects.Zone;
    private kind: "minion" | "hero";
    private getCard?: () => Card | null;
    private hero?: Hero;
    private highlighted: boolean = false;
    private highlight: Phaser.GameObjects.Rectangle;

    private constructor(scene: Phaser.Scene, kind: "minion" | "hero")
    {
        this.kind = kind;
        this.zone = scene.add.zone(0, 0, 0, 0).setRectangleDropZone(0, 0);
        this.highlight = scene.add.rectangle(0, 0, 0, 0, 0xffe680, 0).setStrokeStyle(3, 0xffe680, 0.7).setVisible(false).setDepth(HIGHLIGHT_DEPTH);
    }

    static forMinionSlot(scene: Phaser.Scene, getCard: () => Card | null): Target
    {
        const target = new Target(scene, "minion");
        target.getCard = getCard;
        return target;
    }

    static forHero(scene: Phaser.Scene, hero: Hero): Target
    {
        const target = new Target(scene, "hero");
        target.hero = hero;
        return target;
    }

    getZone(): Phaser.GameObjects.Zone
    {
        return this.zone;
    }

    // An empty minion slot gets a zero-size zone so nothing can be dropped on it.
    layout(x: number, y: number, width: number, height: number, highlightScale: number = 1)
    {
        this.zone.setPosition(x , y);
        const isValid = this.kind === "hero" || (this.getCard?.() != null);
        this.zone.input?.hitArea.setTo(-width / 2, -height / 2, isValid ? width : 0, isValid ? height : 0);
        this.highlight.setPosition(x, y).setSize(width * highlightScale, height * highlightScale);
        this.highlight.setVisible(this.highlighted);
    }

    resolve(): ResolvedTarget | undefined
    {
        if (this.kind === "hero" && this.hero)
            return { kind: "hero", hero: this.hero, id: this.hero.heroData.id };

        if (this.kind === "minion" && this.getCard)
        {
            const card = this.getCard();
            if (card)
                return { kind: "minion", card, id: card.cardData.id };
        }
        return undefined;
    }

    setHighlighted(value: boolean): void
    {
        this.highlighted = value;
        this.highlight.setVisible(value);
    }

    isHighlighted(): boolean
    {
        return this.highlighted;
    }
}
