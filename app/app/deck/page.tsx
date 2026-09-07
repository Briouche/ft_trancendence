import { redirect } from 'next/navigation'

// Plus de page d'accueil intermédiaire pour le deck builder : on va directement sur la page
// de création (qui contient déjà la liste "My decks" dans son propre menu latéral).
export default function DecksPage() {
    redirect('/deck/new')
}
