import prisma from '@/lib/prisma'
import DeckList from './DeckList'

export default async function DecksPage() {
    const [decks, decorPool] = await Promise.all([
        prisma.deck.findMany({
            where:   { userId: 1 }, // TODO: remplacer par l'utilisateur connecté
            include: { cards: true },
            orderBy: { createdAt: 'desc' },
        }),
        // Cartes de la DB posées en décor sur la table, en fond de la page — de vraies créatures
        // (atk/def renseignés), pas les cartes sorts/effets dont atk/def sont vides ou "X". Pas de
        // `take` ici : on tire le lot complet puis on mélange nous-mêmes ci-dessous, pour changer
        // la sélection à chaque chargement plutôt que de toujours montrer les mêmes premières lignes.
        prisma.card.findMany({
            where: { atk: { notIn: ['', 'X'] }, def: { notIn: ['', 'X'] } },
        }),
    ])

    // Mélangé côté serveur à chaque requête (donc à chaque chargement de page) — Math.random()
    // n'est pas déterministe comme l'ordre renvoyé par la DB.
    const decorCards = [...decorPool].sort(() => Math.random() - 0.5).slice(0, 8)

    return <DeckList decks={decks} decorCards={decorCards} />
}
