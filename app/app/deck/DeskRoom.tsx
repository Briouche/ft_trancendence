'use client'

import { type ReactNode } from 'react'
import CardFace, { type CardFaceData } from '@/components/CardFace'

type Placement = { top: string; left: string; rotate: number }

// Quelques vraies cartes de la collection posées sur le bord de la table plutôt que de simples
// rectangles — ça se lit comme de vraies cartes délaissées là, pas comme un décor abstrait.
// Uniquement sur les côtés : le centre de la page est là où s'affiche la liste des decks (elle
// peut s'allonger vers le bas quand il y en a plusieurs) — une carte de décor posée au milieu
// finirait recouverte par cette liste, ou la recouvrirait elle-même.
const PLACEMENTS: Placement[] = [
    { top: '3%',  left: '2%',  rotate: -14 },
    { top: '26%', left: '8%',  rotate: 8 },
    { top: '50%', left: '3%',  rotate: -9 },
    { top: '75%', left: '9%',  rotate: 13 },
    { top: '2%',  left: '89%', rotate: 16 },
    { top: '26%', left: '92%', rotate: -7 },
    { top: '50%', left: '87%', rotate: 11 },
    { top: '75%', left: '91%', rotate: -13 },
]

// CardFace a des tailles de police fixes (emoji text-7xl, description text-2xl...) calibrées
// pour sa taille d'affichage dans la grille de la Collection, ~400px de large. En la forçant dans
// un conteneur étroit (ex: w-44), ces tailles fixes débordent : l'emoji écrase tout, le texte de
// description n'a plus de place et disparaît. On la rend donc à sa largeur naturelle puis on
// réduit le tout avec un seul transform scale — ça garde EXACTEMENT les mêmes proportions
// internes qu'en Collection, juste la carte entière en plus petit.
const NATURAL_WIDTH    = 400
const TABLE_CARD_WIDTH = 190

// Décor de l'atelier du Scribe : plus de scène 3D — une table en bois vue du dessus (à plat,
// sans perspective ni caméra) avec quelques cartes de la DB éparpillées sur les bords, en fond
// derrière l'UI (formulaires/listes) qui reste inchangée.
// Bois plus sombre (même ambiance lugubre que la Collection) avec une faible lumière chaude qui
// vient de la droite — comme si la même lampe sur pied que dans le hall/la Collection éclairait
// la table depuis ce côté, plutôt qu'un bois plat uniformément éclairé.
const TABLE_BACKGROUND =
    'radial-gradient(ellipse 70% 90% at 100% 45%, rgba(255, 190, 120, 0.16), transparent 65%), #3a2417'

export default function DeskRoom({ cards = [], children }: { cards?: CardFaceData[]; children: ReactNode }) {
    const scale = TABLE_CARD_WIDTH / NATURAL_WIDTH
    return (
        <div className="relative min-h-screen w-full" style={{ background: TABLE_BACKGROUND }}>
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {PLACEMENTS.map((p, i) => {
                    const card = cards[i]
                    if (!card) return null
                    return (
                        <div key={card.id} className="absolute drop-shadow-2xl" style={{ top: p.top, left: p.left }}>
                            <div style={{
                                width: NATURAL_WIDTH,
                                transform: `scale(${scale}) rotate(${p.rotate}deg)`,
                                transformOrigin: 'top left',
                            }}>
                                <CardFace card={card} />
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="relative z-10">
                {children}
            </div>
        </div>
    )
}
