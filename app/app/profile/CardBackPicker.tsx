'use client'

import { useState } from 'react'
import CardBackArt from '@/components/CardBackArt'
import { CARD_BACK_COUNT } from '@/lib/cardBacks'

export default function CardBackPicker({ initialCardBack, unlockedCardBacks }: {
    initialCardBack:   number
    unlockedCardBacks: number[]
}) {
    const [cardBack, setCardBack] = useState(initialCardBack)
    const [saving, setSaving]     = useState<number | null>(null)
    const unlocked = new Set(unlockedCardBacks)

    async function choose(index: number) {
        if (index === cardBack || saving !== null || !unlocked.has(index)) return
        setSaving(index)
        const res = await fetch('/api/user/card-back', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ cardBack: index }),
        })
        if (res.ok) setCardBack(index)
        setSaving(null)
    }

    return (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
            {Array.from({ length: CARD_BACK_COUNT }, (_, index) => {
                const isUnlocked = unlocked.has(index)
                return (
                    <button
                        key={index}
                        onClick={() => choose(index)}
                        disabled={saving !== null || !isUnlocked}
                        className={`relative aspect-[104/138] rounded-md border-[3px] transition-opacity disabled:opacity-60
                            ${index === cardBack ? 'border-gold-400 shadow-[0_0_10px_rgba(203,184,131,0.6)]' : 'border-leather-800 hover:border-leather-700'}`}
                    >
                        <CardBackArt
                            index={index}
                            className={`h-full w-full rounded-sm ${!isUnlocked ? 'grayscale brightness-50' : ''}`}
                        />
                        {!isUnlocked && (
                            <span className="absolute inset-0 flex items-center justify-center text-2xl">🔒</span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
