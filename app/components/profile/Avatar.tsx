// Read-only avatar display — same "travelbook-slot" framed square used by TextField/Row,
// sized square rather than the pixel-art round icon this project doesn't have an asset for.
// `src` is whatever User.avatar holds (a data URI, see updateUserProfile.ts) or null pre-upload.

export default function Avatar({ src, size = 96, className = '' }: { src: string | null; size?: number; className?: string }) {
    return (
        <div
            className={`travelbook-slot flex shrink-0 items-center justify-center overflow-hidden bg-ink-muted/10 ${className}`}
            style={{ width: size, height: size }}
        >
            {src ? (
                // eslint-disable-next-line @next/next/no-img-element -- data URI, not an optimizable static asset
                <img src={src} alt="" className="h-full w-full object-cover" />
            ) : (
                <span className="font-serif text-3xl text-ink-muted">?</span>
            )}
        </div>
    )
}
