/** Placeholder shown while a 3D scene's client-only chunk loads. */
export default function SceneLoading() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-ink-950">
            <p className="animate-pulse font-display text-sm tracking-[0.3em] text-gold-400/70 uppercase">
                Chargement...
            </p>
        </div>
    )
}
