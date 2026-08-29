import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { openPack } from '@/lib/packs'

export async function POST() {
    // TODO: remplacer par l'utilisateur connecté quand l'auth sera en place
    const userId = 1

    try {
        const result = await openPack(prisma, userId)
        return NextResponse.json(result)
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }
        )
    }
}
