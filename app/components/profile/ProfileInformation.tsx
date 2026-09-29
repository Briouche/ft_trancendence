'use client'

import { useState } from 'react'
import type { CurrentUser, ProfileUser } from '@/lib/user-and-friends/getUserInfo'
import { usePresenceStatus } from '@/app/presence'
import NotebookPageLayout from '@/components/notebook/PageLayout'
import TextField from '@/components/notebook/TextField'
import BoxedButton from '@/components/notebook/BoxedButton'
import EditProfileForm from './EditProfileForm'
import StatusIndicator from './StatusIndicator'
import Avatar from './Avatar'
import StatRow from './StatRow'

const WIN_STATS: { key: keyof ProfileUser['wins']; label: string }[] = [
  { key: 'vsAiEasy', label: 'vs AI (Easy)' },
  { key: 'vsAiMedium', label: 'vs AI (Medium)' },
  { key: 'vsAiHard', label: 'vs AI (Hard)' },
  { key: 'vsPlayer', label: 'vs Players' },
]

/**
 * Profile page body. `readOnly` renders someone else's profile (friends/requests rows, via
 * /profile/[username]) — no email (never fetched for anyone but the session owner, see
 * getUserProfileByUsername) and no editing. `notice` is the outcome of a 42 link attempt.
 */
export default function ProfileInformation({ user, readOnly = false, notice }: {
  user: CurrentUser | ProfileUser
  readOnly?: boolean
  notice?: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const formattedDate = new Date(user.createdAt).toLocaleDateString()
  const status = usePresenceStatus(user)

  return (
    <NotebookPageLayout title="PROFILE">
      <p suppressHydrationWarning className="text-center font-serif text-sm text-ink-muted">
        Joined {formattedDate}
      </p>
      <div className="flex justify-center">
        <StatusIndicator status={status} label />
      </div>
      {notice && <p role="status" className="mt-2 text-center font-serif text-sm text-ink-text">{notice}</p>}

      {isEditing && !readOnly ? (
        <EditProfileForm user={user as CurrentUser} onDone={() => setIsEditing(false)} />
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          <div className="flex flex-col items-center gap-1">
            <Avatar src={user.avatar} size={96} />
            <p className="font-serif text-xs text-ink-muted">

              {user.friendCount} {user.friendCount === 1 ? 'friend' : 'friends'}
            </p>
          </div>

          <TextField label="Username" name="username" defaultValue={user.username} readOnly align="center" />
          {'email' in user && (
            <TextField label="Email" name="email" defaultValue={user.email} readOnly align="center" />
          )}

          <p className="mt-2 text-center font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">Wins</p>
          <div className="grid grid-cols-2 gap-1">
            {WIN_STATS.map(({ key, label }) => (
              <StatRow key={key} label={label} value={user.wins[key]} />
            ))}
          </div>
        </div>
      )}

      {!readOnly && (
        <BoxedButton onClick={() => setIsEditing(prev => !prev)} className="mt-5 h-11 w-full text-lg">
          {isEditing ? 'Cancel' : 'Edit profile'}
        </BoxedButton>
      )}
      {!readOnly && !isEditing && 'linkedTo42' in user && !user.linkedTo42 && (
        <BoxedButton href="/api/auth/42?link=1" className="mt-3 h-11 w-full text-lg">
          Link my 42 account
        </BoxedButton>
      )}
    </NotebookPageLayout>
  )
}
