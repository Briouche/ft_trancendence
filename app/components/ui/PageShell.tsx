'use client'

import { useRouter } from 'next/navigation'
import { woodenTableBackground } from '@/components/notebook/NotebookUI'
import { HomeButton } from '@/components/notebook/AssetButton'

/**
 * Layout of the scrolling (non-scaled) pages: wooden table background, home button, page title
 * and a centered responsive column. Unlike ScaleToFit pages, content reflows on small screens
 * instead of shrinking, which keeps long lists (players, chat, achievements) readable on phones.
 */
export default function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
    const router = useRouter()
    return (
        <div className="min-h-screen w-full" style={woodenTableBackground}>
            <HomeButton onClick={() => router.push('/')} />
            <main className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4 pb-24 pt-20 sm:pt-10">
                <h1
                    className="travelbook-title-banner w-full max-w-xl px-8 pb-6 pt-1 text-center font-display text-4xl font-bold
                        tracking-wide text-white sm:text-5xl"
                    style={{ textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000' }}
                >
                    {title}
                </h1>
                {children}
            </main>
        </div>
    )
}
