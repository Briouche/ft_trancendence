import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { jsonError, requireSession } from '@/lib/api'
import { NoPackError, openPack } from '@/lib/packs'
import { evaluateAchievements } from '@/lib/achievements'

/** POST /api/packs/open — opens one unopened pack; returns the cards and any unlocked reward. */
export async function POST() {
    const auth = await requireSession()
    if (auth instanceof NextResponse) return auth

    try {
        const result = await openPack(prisma, auth.userId)
        // Opening packs feeds "Pack Rat", "Collector" and "Completionist".
        const newAchievements = await evaluateAchievements(auth.userId)
        const rewardPacks = newAchievements.reduce((sum, a) => sum + a.rewardPacks, 0)
        return NextResponse.json({
            ...result,
            unopenedPacks: result.unopenedPacks + rewardPacks,
            newAchievements: newAchievements.map(a => ({ key: a.key, title: a.title, rewardPacks: a.rewardPacks })),
        })
    } catch (error) {
        if (error instanceof NoPackError) return jsonError(400, error.message)
        throw error
    }
}
