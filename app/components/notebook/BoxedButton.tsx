// Full-width "action" button drawn with the static travelbook Slot03a border-image (9-slice
// border, light cream/tan fill) — used for a form/panel's primary action (Save changes, Sign in,
// Save/Create deck) and for paired confirm/cancel buttons. No sprite frames or press animation
// here (unlike AssetButton, see AssetButton.tsx) — just Tailwind's active:scale-95.
// `href` renders it as a link (Sign in with 42, Create a deck) instead of a <button>.

import Link from 'next/link'
import { outlinedWhiteTextStyle } from './NotebookUI'

interface BoxedButtonProps {
    children: React.ReactNode
    onClick?: () => void
    href?: string
    type?: 'button' | 'submit'
    disabled?: boolean
    tone?: 'white' | 'ink'
    className?: string
}

/** Primary action button (Slot03a frame); a link when `href` is given. */
export default function BoxedButton({
    children,
    onClick,
    href,
    type = 'button',
    disabled,
    tone = 'white',
    className = '',
}: BoxedButtonProps) {
    const sharedClassName = `travelbook-slot03a inline-flex items-center justify-center font-display
        font-bold transition-transform active:scale-95 disabled:opacity-30
        ${tone === 'white' ? 'text-white' : 'text-ink-text'} ${className}`
    const sharedStyle = tone === 'white' ? outlinedWhiteTextStyle : undefined

    // Route handlers (/api/…, e.g. the 42 OAuth redirect) get a plain <a>: next/link would
    // prefetch them — starting an OAuth attempt nobody clicked — and try a client-side
    // navigation to what is really a redirect to another site.
    if (href?.startsWith('/api/')) {
        return (
            <a href={href} className={sharedClassName} style={sharedStyle}>
                {children}
            </a>
        )
    }

    if (href) {
        return (
            <Link href={href} className={sharedClassName} style={sharedStyle}>
                {children}
            </Link>
        )
    }

    return (
        <button type={type} onClick={onClick} disabled={disabled} className={sharedClassName} style={sharedStyle}>
            {children}
        </button>
    )
}
