'use client'

import { useRef, useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import TextButton from '@/components/ui/TextButton'
import { DEFAULT_AVATAR_URL } from '@/lib/avatar'

// Same limits as the server (lib/avatarStorage.ts), checked here first for instant feedback.
// The server re-checks everything on the actual bytes: this is only a convenience.
const MAX_BYTES = 2 * 1024 * 1024
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp']

/** Avatar preview with upload / reset buttons. */
export default function AvatarUploader({ username, initialUrl }: { username: string; initialUrl: string }) {
    const [url, setUrl] = useState(initialUrl)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const input = useRef<HTMLInputElement>(null)

    async function upload(file: File) {
        setError('')
        if (!ACCEPTED.includes(file.type)) return setError('Only PNG, JPEG and WebP images are accepted.')
        if (file.size > MAX_BYTES) return setError('Avatar must be 2 MB or less.')

        setBusy(true)
        const form = new FormData()
        form.append('avatar', file)
        const res = await fetch('/api/user/avatar', { method: 'POST', body: form })
        const body = await res.json().catch(() => null)
        setBusy(false)
        if (res.ok) setUrl(body.avatarUrl)
        else setError(body?.error ?? 'Upload failed.')
    }

    async function reset() {
        setBusy(true)
        const res = await fetch('/api/user/avatar', { method: 'DELETE' })
        setBusy(false)
        if (res.ok) setUrl(DEFAULT_AVATAR_URL)
    }

    return (
        <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Avatar src={url} username={username} size="lg" />
            <div className="flex flex-col gap-2">
                <input
                    ref={input}
                    type="file"
                    accept={ACCEPTED.join(',')}
                    className="sr-only"
                    id="avatar-input"
                    onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) void upload(file)
                        e.target.value = ''
                    }}
                />
                <div className="flex flex-wrap gap-2">
                    <TextButton variant="secondary" disabled={busy} onClick={() => input.current?.click()}>
                        {busy ? 'Uploading…' : 'Change avatar'}
                    </TextButton>
                    {url !== DEFAULT_AVATAR_URL && (
                        <TextButton variant="danger" disabled={busy} onClick={reset}>Use default</TextButton>
                    )}
                </div>
                <p className="font-serif text-xs text-ink-muted">PNG, JPEG or WebP, up to 2 MB.</p>
                {error && <p role="alert" className="font-serif text-sm text-red-700">{error}</p>}
            </div>
        </div>
    )
}
