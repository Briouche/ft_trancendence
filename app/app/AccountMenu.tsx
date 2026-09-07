'use client'

import { useState } from 'react'
import Link from 'next/link'
import LogoutButton from '@/components/elements/LogoutButton'
import { AssetButton } from '@/components/notebook/NotebookUI'
import { ROUTES } from '@/config/routes'
import { english } from '@/config/english'

// Remplace l'ancien bouton "☰ Simple menu" : un accès rapide au compte plutôt qu'un repli de
// navigation à plat — la 3D est maintenant la seule façon de naviguer le Hub. Structuré comme un
// vrai menu déroulant (profil / paramètres / policy) plutôt qu'un simple panneau de stats.
// Rangée de 3 icônes 01_TravelBook (ButtonAbout01a/ButtonSetting01a/ButtonAchievement01a, via
// AssetButton) plutôt que le seul bouton texte "👤 {username}" d'avant — Settings et Achievement
// n'ont pas encore de page derrière (pas de modèle de données, pas de vrai système de succès) donc
// restent désactivées, même logique que l'ancienne entrée "Settings... Soon" du menu déroulant
// (retirée d'ici, remplacée par l'icône du haut).
export default function AccountMenu({ username, cardCount, wins }: {
    username:  string
    cardCount: number
    wins:      number
}) {
    const [open, setOpen] = useState(false)

    return (
        <div className="pointer-events-auto absolute right-4 top-4 z-50">
            <div className="flex items-center gap-2">
                <AssetButton onClick={() => setOpen(o => !o)} variant="about" className="h-14 w-14 shrink-0" />
                <AssetButton disabled variant="settings" className="h-14 w-14 shrink-0" />
                <AssetButton disabled variant="achievement" className="h-14 w-14 shrink-0" />
            </div>

            {open && (
                <div className="book-panel absolute right-0 mt-2 w-64 p-3" onMouseLeave={() => setOpen(false)}>
                    {/* Profil — toute la section mène à la page /profile complète */}
                    <Link href={ROUTES.profile} className="block rounded-lg -m-1 p-1 transition-colors hover:bg-ink-900/10">
                        <p className="font-display text-lg font-bold text-ink-text truncate">{username}</p>
                        <div className="mt-1 flex flex-col gap-0.5 font-serif text-sm text-ink-muted">
                            <p>🃏 {cardCount} card{cardCount !== 1 ? 's' : ''} collected</p>
                            <p>🏆 {wins} win{wins !== 1 ? 's' : ''}</p>
                        </div>
                        <p className="mt-1 font-serif text-xs text-gold-600 underline">View full profile</p>
                    </Link>
                    <Link
                        href="/collection"
                        className="mt-2 block text-center rounded-lg border border-leather-700 bg-ink-900 px-3 py-1.5
                            font-display text-xs font-bold text-parchment-100 transition-colors hover:bg-ink-800"
                    >
                        View collection
                    </Link>

                    <div className="my-3 h-px bg-ink-muted/30" />

                    {/* Policy */}
                    <Link
                        href={ROUTES.privacyNotice}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 font-serif text-sm text-ink-muted transition-colors hover:bg-ink-900/10"
                    >
                        📜 {english.privacyPolicy}
                    </Link>
                    <Link
                        href={ROUTES.termsOfUse}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 font-serif text-sm text-ink-muted transition-colors hover:bg-ink-900/10"
                    >
                        📜 {english.termsOfService}
                    </Link>

                    <div className="my-3 h-px bg-ink-muted/30" />

                    <LogoutButton />
                </div>
            )}
        </div>
    )
}
