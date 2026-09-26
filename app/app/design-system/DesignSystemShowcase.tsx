'use client'

import { useState } from 'react'
import PageShell from '@/components/ui/PageShell'
import Panel from '@/components/ui/Panel'
import Avatar from '@/components/ui/Avatar'
import PresenceDot from '@/components/ui/PresenceDot'
import TierBadge from '@/components/ui/TierBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import TextButton, { TextLink } from '@/components/ui/TextButton'
import Field from '@/components/ui/Field'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { AssetButton, SearchInput, Slot } from '@/components/notebook/NotebookUI'
import CardBackArt from '@/components/CardBackArt'

// Design tokens, as declared in app/globals.css (@theme) — shown with their Tailwind names.
const COLORS: { name: string; value: string; role: string }[] = [
    { name: 'ink-950', value: '#0b0c0d', role: 'Page background' },
    { name: 'ink-900', value: '#15171a', role: 'Dark surfaces' },
    { name: 'ink-800', value: '#1f2225', role: 'Hovered dark surfaces' },
    { name: 'parchment-100', value: '#d4d6d3', role: 'Text on dark' },
    { name: 'parchment-300', value: '#9a9d9b', role: 'Secondary text on dark' },
    { name: 'leather-700', value: '#5a5e62', role: 'Borders' },
    { name: 'leather-800', value: '#454850', role: 'Own chat bubbles' },
    { name: 'gold-300', value: '#cbb883', role: 'Highlights' },
    { name: 'gold-500', value: '#8f8058', role: 'Progress, accents' },
    { name: 'ink-text', value: '#3b2c18', role: 'Text on parchment' },
    { name: 'ink-muted', value: '#6d5a3e', role: 'Secondary text on parchment' },
]

const ICON_BUTTONS = ['home', 'back', 'manual', 'about', 'achievement'] as const

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <Panel maxWidth="max-w-4xl">
            <h2 className="mb-3 font-display text-2xl text-ink-text">{title}</h2>
            {children}
        </Panel>
    )
}

/** Showcase of every token and reusable component, each rendered live. */
export default function DesignSystemShowcase() {
    const [page, setPage] = useState(2)
    const toast = useToast()

    return (
        <PageShell title="DESIGN SYSTEM">
            <Section title="Colors">
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {COLORS.map(c => (
                        <li key={c.name} className="flex items-center gap-2">
                            <span className="h-10 w-10 shrink-0 rounded border border-ink-muted/40" style={{ backgroundColor: c.value }} />
                            <span className="font-serif text-xs text-ink-text">
                                <strong className="block">{c.name}</strong>{c.value} · {c.role}
                            </span>
                        </li>
                    ))}
                </ul>
            </Section>

            <Section title="Typography">
                <p className="font-serif text-sm text-ink-muted">One pixel font for the whole site (PixelGame, exposed as --font-pixel-game; font-display / font-serif / font-pixel are aliases).</p>
                <p className="mt-2 font-display text-4xl text-ink-text">Display 4xl</p>
                <p className="font-display text-2xl text-ink-text">Heading 2xl</p>
                <p className="font-serif text-base text-ink-text">Body text base</p>
                <p className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">Label xs, tracked</p>
            </Section>

            <Section title="Icons (AssetButton)">
                <div className="flex flex-wrap items-center gap-3">
                    {ICON_BUTTONS.map(v => <AssetButton key={v} variant={v} ariaLabel={v} className="h-14 w-14" />)}
                    <AssetButton variant="square" className="h-12 w-28">Square</AssetButton>
                </div>
            </Section>

            <Section title="Buttons & links">
                <div className="flex flex-wrap gap-2">
                    <TextButton>Primary</TextButton>
                    <TextButton variant="secondary">Secondary</TextButton>
                    <TextButton variant="danger">Danger</TextButton>
                    <TextButton disabled>Disabled</TextButton>
                    <TextLink href="/design-system" variant="secondary">TextLink</TextLink>
                    <TextButton variant="secondary" onClick={() => toast('This is a toast', 'success')}>Show a toast</TextButton>
                </div>
            </Section>

            <Section title="Form fields">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Field" placeholder="Type here…" />
                    <label className="flex flex-col gap-1">
                        <span className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">SearchInput (debounced)</span>
                        <SearchInput onChange={() => {}} className="travelbook-slot bg-transparent px-3 py-2 font-serif text-ink-text outline-none" />
                    </label>
                </div>
            </Section>

            <Section title="Identity">
                <div className="flex flex-wrap items-center gap-4">
                    <Avatar username="default" size="sm" />
                    <Avatar username="default" />
                    <Avatar username="default" size="lg" />
                    <PresenceDot presence="online" showLabel />
                    <PresenceDot presence="in_game" showLabel />
                    <PresenceDot presence="offline" showLabel />
                </div>
            </Section>

            <Section title="Progress & badges">
                <div className="flex flex-col gap-3">
                    <ProgressBar value={0.35} label="Example progress: 35%" />
                    <ProgressBar value={1} complete label="Example progress: complete" />
                    <div className="flex flex-wrap gap-2">
                        <TierBadge tier="bronze" title="Bronze" />
                        <TierBadge tier="silver" title="Silver" />
                        <TierBadge tier="gold" title="Gold" />
                        <TierBadge tier="gold" title="Locked" locked />
                    </div>
                </div>
            </Section>

            <Section title="Lists">
                <Pagination page={page} totalPages={5} onChange={setPage} />
                <EmptyState>EmptyState: nothing to show.</EmptyState>
            </Section>

            <Section title="Cards">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="w-24"><Slot /></div>
                    <div className="w-24"><Slot><CardBackArt index={0} className="h-full w-full" /></Slot></div>
                    <CardBackArt index={3} className="h-36 w-24" />
                </div>
            </Section>
        </PageShell>
    )
}
