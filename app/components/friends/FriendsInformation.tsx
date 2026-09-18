'use client'

import { useState } from 'react'
import NotebookPageLayout from '@/components/notebook/PageLayout'
import BoxedButton from '@/components/notebook/BoxedButton'
import AddFriend from './AddFriend'
import FriendsRequestsList from './FriendsRequestsList'
import PendingRequestsList from './PendingRequestsList'
import FriendsList from './FriendsList'

export default function FriendsInformation({ username }: { username: string }) {
    const [isAdding, setIsAdding] = useState(false)
    // Bumped after any send/accept/refuse/cancel so the three lists below (which each fetch
    // independently on mount) refetch and stay in sync with one another.
    const [refreshKey, setRefreshKey] = useState(0)
    const refresh = () => setRefreshKey(k => k + 1)

    return (
        <NotebookPageLayout title="FRIENDS" panelClassName="max-h-150 w-96 overflow-y-auto">
            <p className="text-center font-serif text-sm text-ink-muted">of {username}</p>

            <BoxedButton onClick={() => setIsAdding(prev => !prev)} className="mt-4 h-11 w-full text-lg">
                {isAdding ? 'Cancel' : 'Add a friend'}
            </BoxedButton>

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
        </NotebookPageLayout>
    )
}
