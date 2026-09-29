export type WinsBreakdown = {
    vsAiEasy:   number
    vsAiMedium: number
    vsAiHard:   number
    vsPlayer:   number
}

export default function TrophyPanel({ wins, onClose }: {
    wins:    WinsBreakdown
    onClose: () => void
}) {
    return (
        <div className="book-panel absolute right-0 mt-2 w-64 p-3" onMouseLeave={onClose}>
            <p className="font-serif text-xs uppercase tracking-wide text-ink-muted mb-1">🏆 Wins</p>
            <div className="flex flex-col gap-0.5 font-serif text-sm text-ink-muted">
                <p className="flex justify-between"><span>vs AI (Easy)</span><span>{wins.vsAiEasy}</span></p>
                <p className="flex justify-between"><span>vs AI (Medium)</span><span>{wins.vsAiMedium}</span></p>
                <p className="flex justify-between"><span>vs AI (Hard)</span><span>{wins.vsAiHard}</span></p>
                <p className="flex justify-between"><span>vs Player</span><span>{wins.vsPlayer}</span></p>
            </div>
        </div>
    )
}
