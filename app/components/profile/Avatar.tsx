'use client'

// Read-only avatar display — same "travelbook-slot" framed square used by TextField/Row,
// sized square rather than the pixel-art round icon this project doesn't have an asset for.
// `src` is whatever User.avatar holds (a data URI, see updateUserProfile.ts) or null pre-upload,
// in which case DEFAULT_AVATAR_SRC is shown instead.

export const DEFAULT_AVATAR_SRC = '/textures/profile/default-avatar.png'

export default function Avatar({ src, size = 96, className = '' }: { src: string | null; size?: number; className?: string }) {
    return (
        <div
            className={`travelbook-slot flex shrink-0 items-center justify-center overflow-hidden bg-ink-muted/10 ${className}`}
            style={{ width: size, height: size }}
        >
            {/* eslint-disable-next-line @next/next/no-img-element -- data URI, not an optimizable static asset */}
            <img
                src={src || DEFAULT_AVATAR_SRC}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => {
                    // A corrupt/unreadable stored avatar falls back to the default instead of a broken image.
                    if (!e.currentTarget.src.endsWith(DEFAULT_AVATAR_SRC)) e.currentTarget.src = DEFAULT_AVATAR_SRC
                }}
            />
        </div>
    )
}
