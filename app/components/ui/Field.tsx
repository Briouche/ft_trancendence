/** Labelled text input in an inset slot; extra props go to the <input>. */
export default function Field({ label, className = '', ...input }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <label className={`flex flex-col gap-1 ${className}`}>
            <span className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">{label}</span>
            <input
                className="travelbook-slot w-full bg-transparent px-3 py-2 font-serif text-base text-ink-text
                    placeholder:text-ink-muted/60 outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                {...input}
            />
        </label>
    )
}
