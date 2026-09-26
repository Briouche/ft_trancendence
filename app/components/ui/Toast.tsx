'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'

// Transient notifications ("Achievement unlocked!", "New message from alice") stacked in the
// bottom-left corner. Announced to screen readers through a polite live region.

type Toast = { id: number; text: string; tone: 'info' | 'success' }

const ToastContext = createContext<(text: string, tone?: Toast['tone']) => void>(() => {})

const TOAST_DURATION_MS = 5000

/** Mount once (root layout); descendants call useToast() to show a notification. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])
    const nextId = useRef(0)

    const show = useCallback((text: string, tone: Toast['tone'] = 'info') => {
        const id = ++nextId.current
        setToasts(current => [...current.slice(-3), { id, text, tone }])
        setTimeout(() => setToasts(current => current.filter(t => t.id !== id)), TOAST_DURATION_MS)
    }, [])

    return (
        <ToastContext.Provider value={show}>
            {children}
            <div aria-live="polite" className="pointer-events-none fixed bottom-14 left-4 z-[60] flex max-w-[calc(100vw-2rem)] flex-col gap-2">
                {toasts.map(t => (
                    <p
                        key={t.id}
                        className={`book-panel px-4 py-2 font-serif text-sm shadow-lg
                            ${t.tone === 'success' ? 'text-emerald-900' : 'text-ink-text'}`}
                    >
                        {t.text}
                    </p>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

/** Returns `show(text, tone?)`, which displays a notification for a few seconds. */
export function useToast() {
    return useContext(ToastContext)
}
