'use client'

// Avatar picker for EditProfileForm — clicking the avatar itself opens the file dialog, and the
// picked file is previewed immediately (FileReader → data URI) before the form is even submitted.
// The same `name` this input submits under is what updateUserProfile.ts reads off the FormData.

import { useState } from 'react'
import { AVATAR_ALLOWED_MIME_TYPES, AVATAR_MAX_BYTES, AVATAR_MAX_LABEL } from '@/lib/user-and-friends/requirements'
import Avatar from './Avatar'

export default function EditAvatar({ name = 'avatar', defaultSrc, disabled }: {
    name?: string
    defaultSrc: string | null
    disabled?: boolean
}) {
    const [preview, setPreview] = useState<string | null>(defaultSrc)
    const [error, setError] = useState<string | null>(null)

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        if (!AVATAR_ALLOWED_MIME_TYPES.includes(file.type)) {
            setError('Avatar must be a PNG, JPEG, WEBP, or GIF image.')
            e.target.value = ''
            return
        }
        if (file.size > AVATAR_MAX_BYTES) {
            setError(`Avatar must be smaller than ${AVATAR_MAX_LABEL}.`)
            e.target.value = ''
            return
        }

        setError(null)
        const reader = new FileReader()
        reader.onload = () => setPreview(reader.result as string)
        reader.readAsDataURL(file)
    }

    return (
        <div className="flex flex-col items-center gap-1">
            <label className={disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'}>
                <Avatar src={preview} size={96} />
                <input
                    type="file"
                    name={name}
                    accept={AVATAR_ALLOWED_MIME_TYPES.join(',')}
                    onChange={handleChange}
                    disabled={disabled}
                    className="hidden"
                />
            </label>
            <span className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">Tap to change avatar</span>
            {error && <p role="alert" className="text-center text-sm text-red-500">{error}</p>}
        </div>
    )
}
