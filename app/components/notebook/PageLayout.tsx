'use client'

// TitleBanner, plus the shared "notebook page" shell built on top of it (wooden table background,
// fixed Home button, banner over a travelbook panel) — the same wrapper repeated (with slightly
// different panel sizing) across every page built on this design: Profile, Friends, Collection,
// Deck Builder, Manual, Play. Only Profile and Friends are unified onto NotebookPageLayout for now
// (identical w-96/-mt-10/p-7 panel); the others additionally split into multiple side-by-side
// panels and are left as-is, but still use TitleBanner directly.

import { useRouter } from 'next/navigation'
import { ROUTES } from '@/config/routes'
import { woodenTableBackground } from './NotebookUI'
import { HomeButton } from './AssetButton'

// Title ribbon banner ("Banner01a"), centered relative to the book below it. `width` (arbitrary
// Tailwind class) and `className` (margins, e.g. vertical offset) let a page tweak it without
// affecting other usages.
export function TitleBanner({ children, width = 'w-[1060px]', className = '' }: { children: React.ReactNode; width?: string; className?: string }) {
    return (
        <div className={`flex ${width} flex-col items-center gap-1 ${className}`}>
            <div className="travelbook-title-banner flex w-full items-center justify-center px-12 py-6">
                {/* White + black outline (4-direction text-shadow, like the card numbers) rather
                    than the brown ink-text: unreadable at this size on the ribbon's cream/orange
                    background. translateY(-25px): the ribbon's flat band (where the text must
                    fit) sits higher than the whole sprite's geometric center — the folded tails
                    hanging at the bottom weigh down the image's bottom without being part of the
                    text area. */}
                <h1
                    className="font-display text-7xl font-bold tracking-wide text-white"
                    style={{
                        transform: 'translateY(-25px)',
                        textShadow: [
                            '-2px -2px 0 #000', '2px -2px 0 #000', '-2px 2px 0 #000', '2px 2px 0 #000',
                            '-2px 0 0 #000', '2px 0 0 #000', '0 -2px 0 #000', '0 2px 0 #000',
                        ].join(', '),
                    }}
                >
                    {children}
                </h1>
            </div>
        </div>
    )
}

export default function NotebookPageLayout({
    title,
    titleWidth = 'w-[720px]',
    panelClassName = 'w-96',
    children,
}: {
    title: React.ReactNode
    titleWidth?: string
    panelClassName?: string
    children: React.ReactNode
}) {
    const router = useRouter()

    return (
        <div className="min-h-screen flex flex-col items-center gap-4 p-4 pt-20 md:p-10 md:pt-28" style={woodenTableBackground}>
            <HomeButton onClick={() => router.push(ROUTES.home)} />

            <div className="flex flex-col items-center gap-1">
                <TitleBanner width={titleWidth} className="z-20">{title}</TitleBanner>

                <div className={`travelbook-frame4-panel relative z-30 -mt-10 flex flex-col p-7 ${panelClassName}`}>
                    {children}
                </div>
            </div>
        </div>
    )
}
