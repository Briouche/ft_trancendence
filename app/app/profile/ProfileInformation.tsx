'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CurrentUser } from '@/lib/session'
import { HomeButton, TitleBanner, woodenTableBackground, outlinedWhiteTextStyle } from '@/components/notebook/NotebookUI'
import EditProfileForm from './EditProfileForm'

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">{label}</span>
            <p className="travelbook-slot w-full bg-transparent px-3 py-2 text-center font-serif text-base text-ink-text">
                {value}
            </p>
        </div>
    )
}

export default function ProfileInformation({ user }: { user: CurrentUser }) {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const formattedDate = new Date(user.createdAt).toLocaleDateString()

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 md:p-10" style={woodenTableBackground}>
            <HomeButton onClick={() => router.push('/')} />

            <div className="flex flex-col items-center gap-1">
                <TitleBanner width="w-[720px]" className="z-20">PROFILE</TitleBanner>

                <div className="travelbook-frame4-panel relative z-30 -mt-10 flex w-96 flex-col p-7">
                    <p suppressHydrationWarning className="text-center font-serif text-sm text-ink-muted">
                        Joined {formattedDate}
                    </p>

                    {isEditing ? (
                        <EditProfileForm user={user} onDone={() => setIsEditing(false)} />
                    ) : (
                        <div className="mt-5 flex flex-col gap-3">
                            <InfoRow label="Username" value={user.username} />
                            <InfoRow label="Email" value={user.email} />
                            <InfoRow label="Avatar" value={user.avatar ?? 'No avatar set'} />
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => setIsEditing(prev => !prev)}
                        className="travelbook-slot03a mt-5 h-11 w-full font-display text-lg font-bold text-white
                            transition-transform active:scale-95"
                        style={outlinedWhiteTextStyle}
                    >
                        {isEditing ? 'Cancel' : 'Edit profile'}
                    </button>
                </div>
            </div>
        </div>
    )
}
