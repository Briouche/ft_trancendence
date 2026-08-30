'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import LogoutButton from '@/components/elements/LogoutButton'
import { ROUTES } from '@/config/routes'
import { english } from '@/config/english'

const BUTTON_FRAME_MS = 35

// Remplace l'ancien bouton "☰ Simple menu" : un accès rapide au compte plutôt qu'un repli de
// navigation à plat — la 3D est maintenant la seule façon de naviguer le Hub. Structuré comme un
// vrai menu déroulant (profil / paramètres / policy) plutôt qu'un simple panneau de stats.
export default function AccountMenu({ username, cardCount, wins }: {
    username:  string
    cardCount: number
    wins:      number
}) {
    const [open, setOpen] = useState(false)
    // Anime le sprite de bouton du kit (5 frames : pression puis rebond) à chaque clic, au lieu
    // du simple cadre statique .book-slot.
    const [frame, setFrame] = useState(1)

    function toggleOpen() {
        setOpen(o => !o)
        let i = 1
        const interval = setInterval(() => {
            i += 1
            if (i > 5) {
                clearInterval(interval)
                setFrame(1)
                return
            }
            setFrame(i)
        }, BUTTON_FRAME_MS)
    }

    return (
        <div className="pointer-events-auto absolute right-4 top-4 z-50">
            <button
                onClick={toggleOpen}
                className="px-4 py-2 font-serif text-xs text-parchment-100 transition-opacity hover:opacity-90"
                style={{
                    backgroundImage: `url(/textures/book/button/frame-${frame}.png)`,
                    backgroundSize:  '100% 100%',
                    imageRendering:  'pixelated',
                }}
            >
                👤 {username}
            </button>

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

                    {/* Paramètres — pas encore de vraie page de réglages, entrée visible mais inerte */}
                    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 font-serif text-sm text-ink-muted/50 cursor-not-allowed">
                        <Image src="/textures/book/icon-gear.png" alt="" width={16} height={16} unoptimized style={{ imageRendering: 'pixelated' }} />
                        Settings
                        <span className="ml-auto text-[10px] uppercase tracking-wide">Soon</span>
                    </div>

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
