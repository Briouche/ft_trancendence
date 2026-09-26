import { DEFAULT_AVATAR_URL } from '@/lib/avatar'

const SIZES = { sm: 'h-8 w-8', md: 'h-12 w-12', lg: 'h-24 w-24' } as const

/**
 * A user's avatar in a pixel frame. `src` is an avatar URL from lib/avatar.ts (falls back to the
 * default avatar); the alt text names the user for screen readers.
 */
export default function Avatar({ src, username, size = 'md', className = '' }: {
    src?: string | null
    username: string
    size?: keyof typeof SIZES
    className?: string
}) {
    return (
        // eslint-disable-next-line @next/next/no-img-element -- user uploads: plain <img>, no optimizer round trip
        <img
            src={src ?? DEFAULT_AVATAR_URL}
            alt={`${username}'s avatar`}
            className={`travelbook-slot shrink-0 bg-ink-800 object-cover ${SIZES[size]} ${className}`}
            loading="lazy"
        />
    )
}
