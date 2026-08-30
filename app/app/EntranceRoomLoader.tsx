'use client'

import dynamic from 'next/dynamic'
import { type ReactNode } from 'react'
import SceneLoading from '@/components/library/SceneLoading'

const EntranceRoom = dynamic(() => import('./EntranceRoom'), { ssr: false, loading: SceneLoading })

export default function EntranceRoomLoader({ children }: { children: ReactNode }) {
    return <EntranceRoom>{children}</EntranceRoom>
}
