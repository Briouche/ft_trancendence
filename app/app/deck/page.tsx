import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Decks' }

export default function DecksPage() {
    redirect('/deck/new')
}
