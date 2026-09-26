/**
 * Framed parchment panel (the notebook "frame04" texture). Full width on phones, capped by
 * `maxWidth` (a Tailwind max-w-* class) from tablets up.
 */
export default function Panel({ children, className = '', maxWidth = 'max-w-3xl', as: Tag = 'section', ...rest }: {
    children: React.ReactNode
    className?: string
    maxWidth?: string
    as?: 'section' | 'div' | 'article' | 'aside'
} & React.HTMLAttributes<HTMLElement>) {
    return (
        <Tag className={`travelbook-frame4-panel w-full ${maxWidth} p-4 sm:p-6 ${className}`} {...rest}>
            {children}
        </Tag>
    )
}
