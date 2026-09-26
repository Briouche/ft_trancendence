/** Placeholder line for an empty list ("No friends yet"). */
export default function EmptyState({ children }: { children: React.ReactNode }) {
    return <p className="py-3 text-center font-serif text-sm italic text-ink-muted">{children}</p>
}
