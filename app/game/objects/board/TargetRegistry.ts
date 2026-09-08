import Phaser from "phaser";
import { Target, ResolvedTarget } from "../Target";

// Flat list of every Target (minion slots + both heroes) on the board, so callers can resolve a
// drop zone or id to its target, or bulk-set highlight state, without knowing the board's layout.
export class TargetRegistry
{
    private targets: Target[] = [];

    add(target: Target): void
    {
        this.targets.push(target);
    }

    all(): Target[]
    {
        return this.targets;
    }

    at(index: number): Target
    {
        return this.targets[index];
    }

    resolve(zone: Phaser.GameObjects.Zone): ResolvedTarget | undefined
    {
        return this.targets.find((t) => t.getZone() === zone)?.resolve();
    }

    getById(id: string): Target | undefined
    {
        return this.targets.find((target) =>
        {
            const resolved = target.resolve();
            if (resolved?.kind === "hero")
                return resolved.hero.heroData.id === id;
            return resolved?.card.cardData.id === id;
        });
    }

    setHighlights(legalIds: Set<string>): void
    {
        for (const target of this.targets)
        {
            const resolved = target.resolve();
            if (!resolved)
                continue;

            if (resolved.kind === "hero")
                target.setHighlighted(legalIds.has(resolved.hero.heroData.id));
            else
                target.setHighlighted(legalIds.has(resolved.card.cardData.id));
        }
    }

    clearHighlights(): void
    {
        for (const target of this.targets)
            target.setHighlighted(false);
    }
}
