'use client'

/**
 * Page selector: previous / next and "page X of Y". Pages are 1-based; `onChange` receives the
 * new page (the parent fetches it from the server).
 */
export default function Pagination({ page, totalPages, onChange, disabled = false }: {
    page: number
    totalPages: number
    onChange: (page: number) => void
    disabled?: boolean
}) {
    const button = 'travelbook-slot min-h-10 min-w-10 px-3 font-display text-ink-text disabled:opacity-30'
    return (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-3">
            <button type="button" className={button} onClick={() => onChange(page - 1)} disabled={disabled || page <= 1} aria-label="Previous page">
                ‹
            </button>
            <span className="font-serif text-sm text-ink-muted" aria-live="polite">
                Page {page} of {totalPages}
            </span>
            <button type="button" className={button} onClick={() => onChange(page + 1)} disabled={disabled || page >= totalPages} aria-label="Next page">
                ›
            </button>
        </nav>
    )
}
