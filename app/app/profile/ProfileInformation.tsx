'use client'

import { useState } from 'react'
import type { CurrentUser } from '@/lib/session'
import PageShell from '@/components/ui/PageShell'
import Panel from '@/components/ui/Panel'
import TextButton, { TextLink } from '@/components/ui/TextButton'
import { ROUTES } from '@/config/routes'
import AvatarUploader from './AvatarUploader'
import EditProfileForm from './EditProfileForm'

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">{label}</span>
            <p className="travelbook-slot w-full break-all bg-transparent px-3 py-2 font-serif text-base text-ink-text">{value}</p>
        </div>
    )
}

/** Own profile: avatar, account details (switchable to the edit form), 42 account link. */
export default function ProfileInformation({ user, avatar, notice }: { user: CurrentUser; avatar: string; notice?: string }) {
    const [isEditing, setIsEditing] = useState(false)

    return (
        <PageShell title="PROFILE">
            {notice && (
                <p role="status" className="book-panel w-full max-w-2xl px-4 py-2 text-center font-serif text-sm text-ink-text">{notice}</p>
            )}

            <Panel maxWidth="max-w-2xl" aria-labelledby="avatar-title">
                <h2 id="avatar-title" className="mb-3 font-display text-2xl text-ink-text">Avatar</h2>
                <AvatarUploader username={user.username} initialUrl={avatar} />
            </Panel>

            <Panel maxWidth="max-w-2xl" aria-labelledby="account-title">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 id="account-title" className="font-display text-2xl text-ink-text">Account</h2>
                    <p suppressHydrationWarning className="font-serif text-sm text-ink-muted">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                </div>

                {isEditing ? (
                    <EditProfileForm user={user} onDone={() => setIsEditing(false)} />
                ) : (
                    <div className="flex flex-col gap-3">
                        <InfoRow label="Username" value={user.username} />
                        <InfoRow label="Email" value={user.email} />
                        <InfoRow label="Elo" value={String(user.elo)} />
                    </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                    <TextButton onClick={() => setIsEditing(prev => !prev)}>{isEditing ? 'Cancel' : 'Edit profile'}</TextButton>
                    <TextLink variant="secondary" href={ROUTES.user(user.username)}>View public profile</TextLink>
                </div>
            </Panel>

            <Panel maxWidth="max-w-2xl" aria-labelledby="oauth-title">
                <h2 id="oauth-title" className="mb-2 font-display text-2xl text-ink-text">42 account</h2>
                {user.linkedTo42 ? (
                    <p className="font-serif text-sm text-ink-text">✅ Linked — you can sign in with 42.</p>
                ) : (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <p className="flex-1 font-serif text-sm text-ink-text">Link your 42 intra account to sign in with it.</p>
                        {/* Plain <a>: a full navigation to the API route, which redirects to 42. */}
                        <a href="/api/auth/42?link=1" className="travelbook-slot03a inline-flex min-h-10 items-center justify-center px-4 font-display font-bold text-white">
                            Link 42 account
                        </a>
                    </div>
                )}
            </Panel>
        </PageShell>
    )
}
