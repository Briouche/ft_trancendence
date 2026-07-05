import Link from 'next/link'

const MENU = [
    {
        href:        '/collection',
        label:       'Le Grimoire',
        description: 'Parcourir ta collection de cartes',
        emoji:       '📖',
        available:   true,
    },
    {
        href:        '/deck',
        label:       'Atelier du Scribe',
        description: 'Composer ton deck pour la prochaine partie',
        emoji:       '🖋️',
        available:   true,
    },
    {
        href:        '/packs',
        label:       'Le Coffre',
        description: 'Ouvrir tes paquets de cartes',
        emoji:       '🗝️',
        available:   true,
    },
    {
        href:        '/game',
        label:       'L’Arène',
        description: 'Bientôt disponible',
        emoji:       '⚔️',
        available:   false,
    },
]

export default function HomePage() {
    return (
        <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center gap-10 p-8">
            <div className="text-center">
                <p className="font-serif text-sm uppercase tracking-[0.3em] text-gold-400/80 mb-2">
                    ~ ft_transcendence ~
                </p>
                <h1 className="font-display text-5xl font-bold text-parchment-100 tracking-wide">
                    La Bibliothèque
                </h1>
                <p className="font-serif italic text-parchment-300/60 text-lg mt-2">
                    Un jeu de cartes à collectionner
                </p>
            </div>

            <div className="flex flex-col gap-4 w-full max-w-md">
                {MENU.map(item => (
                    item.available ? (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="group flex items-center gap-4 rounded-xl border border-leather-700 bg-ink-900
                                p-5 shadow-lg transition-colors hover:border-gold-500/60 hover:bg-ink-800"
                        >
                            <span className="text-4xl">{item.emoji}</span>
                            <div>
                                <div className="font-display text-lg font-bold text-parchment-100 group-hover:text-gold-300">
                                    {item.label}
                                </div>
                                <div className="font-serif text-sm text-parchment-300/60">{item.description}</div>
                            </div>
                        </Link>
                    ) : (
                        <div
                            key={item.href}
                            className="flex items-center gap-4 rounded-xl border border-leather-800/40 bg-ink-900/40
                                p-5 opacity-50 cursor-not-allowed"
                        >
                            <span className="text-4xl">{item.emoji}</span>
                            <div>
                                <div className="font-display text-lg font-bold text-parchment-100">{item.label}</div>
                                <div className="font-serif text-sm text-parchment-300/60">{item.description}</div>
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    )
}
