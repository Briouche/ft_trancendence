'use client'

import { useState } from 'react'
import type { CurrentUser } from '@/lib/session'
import { updateUserProfile } from '@/lib/updateUserProfile'
import {
    EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH, USERNAME_PATTERN,
    firstIssue, formDataToObject, profileUpdateSchema,
} from '@/lib/validation'
import { outlinedWhiteTextStyle } from '@/components/notebook/NotebookUI'

const fieldClassName = `travelbook-slot w-full bg-transparent px-3 py-2 text-center font-serif
    text-base text-ink-text placeholder:text-ink-muted/60 outline-none`

/** Profile edit form (username, email, optional password change), validated with profileUpdateSchema. */
export default function EditProfileForm({ user, onDone }: { user: CurrentUser; onDone: () => void }) {
    const [error, setError] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setError(null)

        const parsed = profileUpdateSchema.safeParse(formDataToObject(formData))
        if (!parsed.success) {
            setError(firstIssue(parsed.error))
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
        <form action={handleSubmit} className="mt-5 flex flex-col gap-3">
            {error && (
                <p role="alert" className="text-center text-sm text-red-500">
                    {error}
                </p>
            )}

            <label className="flex flex-col gap-1">
                <span className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">Username</span>
                <input
                    name="username"
                    type="text"
                    defaultValue={user.username}
                    minLength={USERNAME_MIN_LENGTH}
                    maxLength={USERNAME_MAX_LENGTH}
                    pattern={USERNAME_PATTERN}
                    title="Username can only contain letters, numbers, and underscores."
                    required
                    disabled={pending}
                    className={fieldClassName}
                />
            </label>

            <label className="flex flex-col gap-1">
                <span className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">Email</span>
                <input
                    name="email"
                    type="email"
                    defaultValue={user.email}
                    maxLength={EMAIL_MAX_LENGTH}
                    required
                    disabled={pending}
                    className={fieldClassName}
                />
            </label>

            {user.hasPassword && (
                <label className="flex flex-col gap-1">
                    <span className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">
                        Current password (to change it)
                    </span>
                    <input
                        name="currentPassword"
                        type="password"
                        placeholder="••••••••"
                        maxLength={PASSWORD_MAX_LENGTH}
                        autoComplete="current-password"
                        disabled={pending}
                        className={fieldClassName}
                    />
                </label>
            )}

            <label className="flex flex-col gap-1">
                <span className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">New password</span>
                <input
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                    title="Password must include an uppercase letter, a lowercase letter, and a number."
                    disabled={pending}
                    className={fieldClassName}
                />
            </label>

            <label className="flex flex-col gap-1">
                <span className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">Confirm password</span>
                <input
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    disabled={pending}
                    className={fieldClassName}
                />
            </label>

            <button
                type="submit"
                disabled={pending}
                className="travelbook-slot03a mt-2 h-11 w-full font-display text-lg font-bold text-white
                    transition-transform active:scale-95 disabled:opacity-30"
                style={outlinedWhiteTextStyle}
            >
                {pending ? 'Saving…' : 'Save changes'}
            </button>
        </form>
    )
}
