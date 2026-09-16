'use client'

import { useState } from 'react'
import type { CurrentUser } from '@/lib/currentUser'
import { updateUserProfile } from '@/lib/updateUserProfile'
import { outlinedWhiteTextStyle } from '@/components/notebook/NotebookUI'

const fieldClassName = `travelbook-slot w-full bg-transparent px-3 py-2 text-center font-serif
    text-base text-ink-text placeholder:text-ink-muted/60 outline-none`

export default function EditProfileForm({ user, onDone }: { user: CurrentUser; onDone: () => void }) {
    const [error, setError] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setError(null)

        const password = formData.get('password') as string | null
        const confirmPassword = formData.get('confirmPassword') as string | null
        if (password && password !== confirmPassword) {
            setError('Passwords do not match.')
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
                    minLength={3}
                    maxLength={30}
                    pattern="^[a-zA-Z0-9_]+$"
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
                    maxLength={254}
                    required
                    disabled={pending}
                    className={fieldClassName}
                />
            </label>

            <label className="flex flex-col gap-1">
                <span className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">Password</span>
                <input
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    minLength={8}
                    maxLength={128}
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
                    minLength={8}
                    maxLength={128}
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
