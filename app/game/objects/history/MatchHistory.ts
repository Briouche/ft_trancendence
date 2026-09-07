export type HistoryIconKind = "cardPlayed" | "attack" | "turnEnded";

export interface HistoryEntry
{
    id: number;
    icon: { kind: HistoryIconKind; assetKey?: string };  // assetKey set only for "cardPlayed"
    headline: string;
    details: string[];
}

// Groups the raw GameEvent stream into a readable match log: only cardPlayed/summon, attack, and
// turnEnded start a new top-level entry — everything else (damage/heal/buff/death/effect triggers)
// nests as a detail under whichever of those is currently open, since they're direct consequences
// of it rather than separate facts worth their own row.
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

    beginAttack(attackerLabel: string, attackerName: string, targetLabel: string): void
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

    // A summon matching the card just opened by beginCardPlayed is redundant confirmation of that
    // same headline, not a separate fact — swallow it. A summon for any other card id (a
    // battlecry/spell-summoned token) is a real detail worth recording.
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
