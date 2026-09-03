// Repli affiché pendant le téléchargement/hydratation du chunk d'une salle 3D (dynamic import,
// ssr:false — WebGL ne peut pas être rendu côté serveur). Sans ça, next/dynamic n'affiche rien
// du tout par défaut le temps que le chunk arrive, ce qui se lit comme un gel de la page.
export default function SceneLoading() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-ink-950">
            <p className="animate-pulse font-display text-sm tracking-[0.3em] text-gold-400/70 uppercase">
                Chargement...
            </p>
        </div>
    )
}
