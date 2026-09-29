// Read-only labeled stat — plain label/value pair (no travelbook-slot frame, so no cream fill
// behind it), same idea as TrophyPanel's win rows. Used for the win counters on the profile page
// (vs AI Easy/Medium/Hard, vs Players): one component, several instances.

export default function StatRow({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex items-center justify-center gap-1.5 font-serif text-sm">
            <span className="text-ink-muted">{label}</span>
            <span className="text-ink-text">{value}</span>
        </div>
    )
}
