import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { ROUTES } from '@/config/routes'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import RoundedRectangle from '@/components/elements/RoundedRectangle'
import CardBackPicker from './CardBackPicker'

export default async function ProfilePage() {
    const session = await getSession()
    if (!session) redirect(ROUTES.home)

    const user = await prisma.user.findUnique({
        where:  { id: session.userId },
        select: {
            username:          true,
            email:             true,
            wins:              true,
            createdAt:         true,
            cardBack:          true,
            unlockedCardBacks: true,
            cards:             { select: { qty: true } },
        },
    })

    // Nombre total de cartes possédées (copies comprises), pas le nombre de cartes distinctes.
    const cardCount = user?.cards.reduce((sum, c) => sum + c.qty, 0) ?? 0

    return (
        <>
            <Header />

            <main className="flex flex-1 flex-col items-center gap-6 p-vertical">
                <RoundedRectangle variant="book-cover-panel" className="w-full max-w-2xl p-4">
                    <p className="font-serif text-xs uppercase tracking-[0.25em] text-ink-muted mb-1">
                        Adventurer&apos;s Ledger
                    </p>
                    <h1 className="font-display text-3xl font-bold text-ink-text">{user?.username}</h1>
                </RoundedRectangle>

                <RoundedRectangle variant="book-panel" className="w-full max-w-2xl p-6 flex flex-col gap-5">
                    <div>
                        <span className="font-serif text-xs uppercase tracking-wide text-ink-muted">Email</span>
                        <p className="font-display text-lg text-ink-text">{user?.email}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="book-slot p-3 text-center">
                            <p className="font-display text-2xl text-ink-text">🃏 {cardCount}</p>
                            <p className="font-serif text-xs text-ink-muted mt-1">
                                Card{cardCount !== 1 ? 's' : ''} collected
                            </p>
                        </div>
                        <div className="book-slot p-3 text-center">
                            <p className="font-display text-2xl text-ink-text">🏆 {user?.wins ?? 0}</p>
                            <p className="font-serif text-xs text-ink-muted mt-1">
                                Win{user?.wins !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {user?.createdAt && (
                        <p className="font-serif text-xs text-ink-muted">
                            Member since {user.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                        </p>
                    )}

                    <Link
                        href="/collection"
                        className="rounded-lg border border-leather-700 bg-ink-900 px-4 py-2 text-center font-display
                            text-sm font-bold text-parchment-100 transition-colors hover:bg-ink-800"
                    >
                        View collection
                    </Link>
                </RoundedRectangle>

                <RoundedRectangle variant="book-panel" className="w-full max-w-2xl p-6 flex flex-col gap-4">
                    <div>
                        <h2 className="font-display text-lg font-bold text-ink-text">Card back</h2>
                        <p className="font-serif text-xs text-ink-muted">
                            Choose the design shown on the back of your cards — locked ones drop from packs
                        </p>
                    </div>
                    <CardBackPicker
                        initialCardBack={user?.cardBack ?? 0}
                        unlockedCardBacks={user?.unlockedCardBacks ?? [0]}
                    />
                </RoundedRectangle>

                <Link href={ROUTES.home} className="font-serif text-sm text-foreground/60 hover:underline">
                    ⟵ Back to hub
                </Link>
            </main>

            <Footer />
        </>
    )
}
