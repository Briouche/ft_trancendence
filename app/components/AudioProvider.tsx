'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

interface AudioContextValue {
    muted:      boolean
    toggleMute: () => void
    playFlip:   () => void
}

const AudioCtx = createContext<AudioContextValue | null>(null)

export function useAudio() {
    const ctx = useContext(AudioCtx)
    if (!ctx) throw new Error('useAudio must be used within <AudioProvider>')
    return ctx
}

const MUTE_KEY     = 'ft-audio-muted'
const BASE_VOLUME  = 0.6

// Pas de fichiers audio à héberger/sourcer : tout est synthétisé via Web Audio API. Une nappe
// ambiante en fond (quelques oscillateurs désaccordés + tremolo lent, façon bibliothèque
// hantée) et un petit éclat métallique pour chaque carte qui se retourne.
export default function AudioProvider({ children }: { children: ReactNode }) {
    const audioCtxRef = useRef<AudioContext | null>(null)
    const masterRef    = useRef<GainNode | null>(null)
    const startedRef   = useRef(false)
    const [muted, setMuted] = useState(false)

    useEffect(() => {
        setMuted(localStorage.getItem(MUTE_KEY) === '1')
    }, [])

    const getContext = useCallback(() => {
        if (!audioCtxRef.current) {
            const ctx = new AudioContext()
            const master = ctx.createGain()
            master.gain.value = 0 // monte progressivement au premier geste, jamais de son surprise
            master.connect(ctx.destination)
            audioCtxRef.current = ctx
            masterRef.current = master
        }
        return { ctx: audioCtxRef.current, master: masterRef.current! }
    }, [])

    // Nappe ambiante : un accord grave tenu indéfiniment, chaque voix respirant à son propre
    // rythme (LFO sur son gain) pour ne pas sonner comme un simple bourdonnement statique.
    const startMusic = useCallback(() => {
        if (startedRef.current) return
        startedRef.current = true
        const { ctx, master } = getContext()

        const musicGain = ctx.createGain()
        musicGain.gain.value = 0.09
        musicGain.connect(master)

        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 850
        filter.connect(musicGain)

        const freqs = [73.42, 110, 146.83, 220] // ré mineur ouvert, grave
        freqs.forEach((freq, i) => {
            const osc = ctx.createOscillator()
            osc.type = i % 2 === 0 ? 'sine' : 'triangle'
            osc.frequency.value = freq

            const voiceGain = ctx.createGain()
            voiceGain.gain.value = 0.5
            osc.connect(voiceGain)
            voiceGain.connect(filter)

            // LFO décalé par voix : les respirations ne tombent jamais toutes en même temps
            const lfo = ctx.createOscillator()
            lfo.frequency.value = 0.04 + i * 0.015
            const lfoGain = ctx.createGain()
            lfoGain.gain.value = 0.3
            lfo.connect(lfoGain)
            lfoGain.connect(voiceGain.gain)

            osc.start()
            lfo.start()
        })
    }, [getContext])

    // Premier geste de l'utilisateur, où qu'il soit dans l'appli : débloque l'AudioContext
    // (suspendu par le navigateur tant qu'aucune interaction n'a eu lieu) et lance la nappe.
    useEffect(() => {
        function onFirstGesture() {
            const { ctx, master } = getContext()
            ctx.resume()
            startMusic()
            master.gain.linearRampToValueAtTime(muted ? 0 : BASE_VOLUME, ctx.currentTime + 1.2)
            window.removeEventListener('pointerdown', onFirstGesture)
            window.removeEventListener('keydown', onFirstGesture)
        }
        window.addEventListener('pointerdown', onFirstGesture)
        window.addEventListener('keydown', onFirstGesture)
        return () => {
            window.removeEventListener('pointerdown', onFirstGesture)
            window.removeEventListener('keydown', onFirstGesture)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function toggleMute() {
        setMuted(prev => {
            const next = !prev
            localStorage.setItem(MUTE_KEY, next ? '1' : '0')
            if (masterRef.current && audioCtxRef.current) {
                masterRef.current.gain.linearRampToValueAtTime(
                    next ? 0 : BASE_VOLUME,
                    audioCtxRef.current.currentTime + 0.3,
                )
            }
            return next
        })
    }

    // Petit éclat métallique bref : deux oscillateurs qui montent puis s'éteignent vite, comme
    // un tintement de carte qu'on retourne — généré à la volée, pas de fichier à charger.
    function playFlip() {
        const { ctx, master } = getContext()
        const now = ctx.currentTime

        const sfxGain = ctx.createGain()
        sfxGain.gain.setValueAtTime(0, now)
        sfxGain.gain.linearRampToValueAtTime(0.18, now + 0.01)
        sfxGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
        sfxGain.connect(master)

        ;[660, 990].forEach((freq, i) => {
            const osc = ctx.createOscillator()
            osc.type = 'triangle'
            osc.frequency.setValueAtTime(freq, now)
            osc.frequency.exponentialRampToValueAtTime(freq * 1.4, now + 0.12)
            osc.connect(sfxGain)
            osc.start(now + i * 0.02)
            osc.stop(now + 0.4)
        })
    }

    return (
        <AudioCtx.Provider value={{ muted, toggleMute, playFlip }}>
            {children}
        </AudioCtx.Provider>
    )
}
