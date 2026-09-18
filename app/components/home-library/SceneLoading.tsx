// Fallback shown while a 3D room's chunk downloads/hydrates (dynamic import, ssr:false — WebGL
// can't be rendered server-side). next/dynamic renders nothing at all by default during that
// gap, which otherwise reads as the page having frozen.
export default function SceneLoading() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-ink-950">
            <p className="animate-pulse font-display text-sm tracking-[0.3em] text-gold-400/70 uppercase">
                Chargement...
            </p>
        </div>
    )
}
