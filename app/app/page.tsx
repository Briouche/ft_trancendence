'use client'

import dynamic from 'next/dynamic'

const HubScene = dynamic(() => import('./HubScene'), { ssr: false })

export default function HomePage() {
    return <HubScene />
}
