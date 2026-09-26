import { redirect } from 'next/navigation'

/** /deck — alias of /deck/new. */
export default function DecksPage() {
    redirect('/deck/new')
}
