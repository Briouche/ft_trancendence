'use client'

import { useEffect, useRef } from 'react'

const VOLUME = 0.3

// Looping theme mounted once in the root layout, so it survives client-side navigation.
// Browsers block audible autoplay until the first user gesture, so we retry on that gesture.
export default function BackgroundMusic() {
    const audioRef = useRef<HTMLAudioElement>(null)

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return
        audio.volume = VOLUME

        function start() {
            audio!.play().then(removeListeners).catch(() => {})
        }
        function removeListeners() {
            window.removeEventListener('pointerdown', start)
            window.removeEventListener('keydown', start)
        }

        window.addEventListener('pointerdown', start)
        window.addEventListener('keydown', start)
        // Firefox exposes the autoplay policy: skip the doomed first play() there, it logs a warning.
        const policy = (navigator as Navigator & { getAutoplayPolicy?: (type: 'mediaelement') => string })
            .getAutoplayPolicy?.('mediaelement')
        if (policy === undefined || policy === 'allowed') start()
        return removeListeners
    }, [])

    return <audio ref={audioRef} src="/audio/theme.m4a" loop preload="auto" />
}
