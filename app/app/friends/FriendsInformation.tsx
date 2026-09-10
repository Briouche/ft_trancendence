'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HomeButton, TitleBanner, woodenTableBackground, outlinedWhiteTextStyle } from '@/components/notebook/NotebookUI'
import AddFriend from './AddFriend'
import FriendsRequestsList from './FriendsRequestsList'
import PendingRequestsList from './PendingRequestsList'
import FriendsList from './FriendsList'

export default function FriendsInformation({ username }: { username: string }) {
    const router = useRouter()
    const [isAdding, setIsAdding] = useState(false)
    // Bumped after any send/accept/refuse/cancel so the three lists below (which each fetch
    // independently on mount) refetch and stay in sync with one another.
    const [refreshKey, setRefreshKey] = useState(0)
    const refresh = () => setRefreshKey(k => k + 1)

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 md:p-10" style={woodenTableBackground}>
            <HomeButton onClick={() => router.push('/')} />

            <div className="flex flex-col items-center gap-1">
                <TitleBanner width="w-[720px]" className="z-20">FRIENDS</TitleBanner>

                <div className="travelbook-frame4-panel relative z-30 -mt-10 flex max-h-150 w-96 flex-col overflow-y-auto p-7">
                    <p className="text-center font-serif text-sm text-ink-muted">of {username}</p>

                    <button
                        type="button"
                        onClick={() => setIsAdding(prev => !prev)}
                        className="travelbook-slot03a mt-4 h-11 w-full font-display text-lg font-bold text-white
                            transition-transform active:scale-95"
                        style={outlinedWhiteTextStyle}
                    >
                        {isAdding ? 'Cancel' : 'Add a friend'}
                    </button>

                    <div className="mt-5 flex flex-col items-center gap-4">
                        {isAdding && <AddFriend onSent={refresh} />}

                        <section className="flex w-full flex-col gap-2">
                            <p className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">Requests received</p>
                            <FriendsRequestsList refreshKey={refreshKey} onChange={refresh} />
                        </section>

                        <section className="flex w-full flex-col gap-2">
                            <p className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">Requests sent</p>
                            <PendingRequestsList refreshKey={refreshKey} onChange={refresh} />
                        </section>

                        <section className="flex w-full flex-col gap-2">
                            <p className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">Friends</p>
                            <FriendsList refreshKey={refreshKey} />
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}
