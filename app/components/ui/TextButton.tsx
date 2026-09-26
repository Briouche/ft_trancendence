import Link from 'next/link'

const VARIANTS = {
    // Framed wide button: main actions.
    primary: 'travelbook-slot03a text-white [text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000]',
    // Inset slot: secondary actions.
    secondary: 'travelbook-slot text-ink-text',
    // Red-tinted secondary: destructive actions (remove a friend, delete an avatar).
    danger: 'travelbook-slot text-red-800',
} as const

type Common = { variant?: keyof typeof VARIANTS; className?: string; children: React.ReactNode }

const base = `inline-flex min-h-10 items-center justify-center px-4 py-1.5 font-display text-base font-bold
    transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-40`

/** Text button of the design system (use AssetButton for the sprite icon buttons). */
export default function TextButton({ variant = 'primary', className = '', children, ...rest }: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button type="button" className={`${base} ${VARIANTS[variant]} ${className}`} {...rest}>
            {children}
        </button>
    )
}

/** Same look as TextButton, as a navigation link. */
export function TextLink({ variant = 'primary', className = '', children, href }: Common & { href: string }) {
    return (
        <Link href={href} className={`${base} ${VARIANTS[variant]} ${className}`}>
            {children}
        </Link>
    )
}
