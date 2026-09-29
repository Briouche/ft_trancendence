'use client'

import { useState } from 'react'
import type { CurrentUser } from '@/lib/user-and-friends/getUserInfo'
import { updateUserProfile } from '@/lib/user-and-friends/updateUserProfile'
import {
    EMAIL_MAX_LENGTH,
    EMAIL_REGEX,
    PASSWORD_ALLOWED_CHARS,
    PASSWORD_MAX_LENGTH,
    PASSWORD_REGEX,
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
    USERNAME_REGEX,
} from '@/lib/auth/requirements'
import TextField from '@/components/notebook/TextField'
import BoxedButton from '@/components/notebook/BoxedButton'
import EditAvatar from './EditAvatar'

// Same rules as RegisterForm and the server-side checks in updateUserProfile.ts — all read from
// lib/auth/requirements so the three can't drift apart.
const PASSWORD_TITLE = 'Must include an uppercase letter, a lowercase letter, and a number, '
    + 'and contain only letters, numbers, and the symbols ' + PASSWORD_ALLOWED_CHARS

export default function EditProfileForm({ user, onDone }: { user: CurrentUser; onDone: () => void }) {
    const [error, setError] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    // A plain onSubmit rather than <form action={...}>: React resets a form's uncontrolled fields
    // once an action function returns, even when the server answered with an error — that wiped
    // what the user typed and cleared the file input while EditAvatar still previewed the new
    // image, so the next save silently dropped it. The browser's own validation (pattern,
    // required, …) still runs first: submit only fires once the fields are valid.
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (pending) return
        setError(null)

        const formData = new FormData(e.currentTarget)

        const password = formData.get('password') as string | null
        const confirmPassword = formData.get('confirmPassword') as string | null
        const email = (formData.get('email') as string | null)?.trim().toLocaleLowerCase()
        const currentPassword = formData.get('currentPassword') as string | null

        if (password && password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }
        if (user.hasPassword && (password || email !== user.email) && !currentPassword) {
            setError('Enter your current password to change your email or password.')
            return
        }

        setPending(true)
        try {
            const response = await updateUserProfile(formData)
            if (!response.error) onDone()
            else setError(response.error)
        } catch {
            setError('An unexpected error occurred.')
        } finally {
            setPending(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
            {error && (
                <p role="alert" className="text-center text-sm text-red-500">
                    {error}
                </p>
            )}

            <EditAvatar defaultSrc={user.avatar} disabled={pending} />

            <TextField
                label="Username"
                name="username"
                defaultValue={user.username}
                minLength={USERNAME_MIN_LENGTH}
                maxLength={USERNAME_MAX_LENGTH}
                pattern={USERNAME_REGEX.source}
                patternTitle="Only letters and numbers are allowed."
                required
                disabled={pending}
                align="center"
            />

            <TextField
                label="Email"
                name="email"
                type="email"
                defaultValue={user.email}
                maxLength={EMAIL_MAX_LENGTH}
                pattern={EMAIL_REGEX.source}
                patternTitle="Enter a valid email."
                required
                disabled={pending}
                align="center"
            />

            <TextField
                label="New password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                maxLength={PASSWORD_MAX_LENGTH}
                pattern={PASSWORD_REGEX.source}
                patternTitle={PASSWORD_TITLE}
                disabled={pending}
                align="center"
            />

            <TextField
                label="Confirm new password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                maxLength={PASSWORD_MAX_LENGTH}
                pattern={PASSWORD_REGEX.source}
                patternTitle={PASSWORD_TITLE}
                disabled={pending}
                align="center"
            />

            {user.hasPassword && (
                <TextField
                    label="Current password (to change email or password)"
                    name="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    maxLength={PASSWORD_MAX_LENGTH}
                    disabled={pending}
                    align="center"
                />
            )}

            <BoxedButton type="submit" disabled={pending} className="mt-2 h-11 w-full text-lg">
                {pending ? 'Saving…' : 'Save changes'}
            </BoxedButton>
        </form>
    )
}
