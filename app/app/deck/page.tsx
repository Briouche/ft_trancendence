import { redirect } from 'next/navigation'

// No more intermediate landing page for the deck builder: go straight to the creation page
// (which already has the "My decks" list in its own side panel).
export default function DecksPage() {
    redirect('/deck/new')
}
