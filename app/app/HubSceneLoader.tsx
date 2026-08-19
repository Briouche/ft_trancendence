'use client'

import dynamic from 'next/dynamic'
import SceneLoading from '@/components/library/SceneLoading'

const HubScene = dynamic(() => import('./HubScene'), { ssr: false, loading: SceneLoading })

export default function HubSceneLoader() {
    return <HubScene />
}
