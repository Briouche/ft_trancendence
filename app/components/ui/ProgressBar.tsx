/**
 * Horizontal progress bar with an accessible `progressbar` role. `value` is a fraction in [0, 1];
 * `label` is announced to screen readers (e.g. "Veteran: 4 of 10").
 */
export default function ProgressBar({ value, label, complete = false }: { value: number; label: string; complete?: boolean }) {
    const percent = Math.round(Math.min(1, Math.max(0, value)) * 100)
    return (
        <div
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="h-3 w-full overflow-hidden rounded-full border border-ink-muted/40 bg-ink-muted/15"
        >
            <div
                className={`h-full rounded-full transition-[width] duration-700 ${complete ? 'bg-emerald-600' : 'bg-gold-500'}`}
                style={{ width: `${percent}%` }}
            />
        </div>
    )
}
