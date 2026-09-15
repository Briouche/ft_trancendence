type HistoryIconKind = "cardPlayed" | "attack" | "turnEnded";

export interface HistoryEntry
{
    id: number;
    icon: { kind: HistoryIconKind; assetKey?: string };
    headline: string;
    details: string[];
}

// Match log: card plays, attacks and turn ends open an entry; damage/heal/buff/death/effect
// events are appended as details of the open entry.
export class MatchHistory
{
    private entries: HistoryEntry[] = [];
    private nextId = 1;
    private openEntry: HistoryEntry | null = null;
    private openCardId: string | null = null;

    private begin(icon: HistoryEntry["icon"], headline: string): HistoryEntry
    {
        const entry: HistoryEntry = { id: this.nextId++, icon, headline, details: [] };
        this.entries.push(entry);
        this.openEntry = entry;
        return entry;
    }

    beginCardPlayed(playerLabel: string, cardName: string, assetKey: string, cardId: string): void
    {
        this.begin({ kind: "cardPlayed", assetKey }, `${playerLabel} played ${cardName}`);
        this.openCardId = cardId;
    }

    beginAttack(attackerName: string, targetLabel: string): void
    {
        this.begin({ kind: "attack" }, `${attackerName} attacked ${targetLabel}`);
        this.openCardId = null;
    }

    beginTurnEnded(turnLabel: string): void
    {
        this.begin({ kind: "turnEnded" }, turnLabel);
        this.openCardId = null;
    }

    addDetail(text: string): void
    {
        this.openEntry?.details.push(text);
    }

    // The summon of the card just played repeats its own headline.
    isRedundantSummon(minionId: string): boolean
    {
        return this.openCardId === minionId;
    }

    getAll(): readonly HistoryEntry[]
    {
        return this.entries;
    }

    getLatest(n: number): HistoryEntry[]
    {
        return this.entries.slice(-n);
    }
}
