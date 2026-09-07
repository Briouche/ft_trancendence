import type { CSSProperties } from 'react'
import { splitKeywordSegments } from '@/lib/keywords'
import {
    CARD_ART_BOX, CARD_ATTACK_BOX, CARD_COST_BOX, CARD_COST_BOX_SPELL, CARD_DESC_BOX, CARD_DESC_BOX_SPELL,
    CARD_HEALTH_BOX, CARD_NAME_BOX, CARD_NAME_BOX_SPELL, CardBox, isSpellRarity,
} from '@/lib/cardLayout'

export type CardFaceData = {
    id: string
    name: string
    rarity: string
    cost: string
    atk: string
    def: string
    desc: string
    keywords: string[]
    legendId: string
    assetKey: string
    artist: string | null
}

// "placeholder_card" (défaut en base, voir prisma/schema.prisma) = pas d'illustration dessinée
// pour cette carte — même sentinelle que hasCardArt() côté rendu Phaser (CardAssetLoader.ts).
function hasCardArt(assetKey: string): boolean {
    return !!assetKey && assetKey !== 'placeholder_card'
}

// Cadres dessinés à la main (sources .ase dans Documents/, exportés en PNG via un script maison —
// pas de licence à créditer, ce sont les assets du projet) : Commune, Épique et Légendaire pour
// les créatures (mêmes zones ATK/DEF), Rare pour les sorts (tous les sorts ont été reclassés en
// rareté Rare — ce tier est donc exclusivement des sorts, d'où son cadre sans épées/goutte de
// sang, voir SPELL_RARITIES plus bas).
const CARD_ART: Partial<Record<string, string>> = {
    'Commune': '/textures/cards/frame/frame-commune.png',
    'Rare': '/textures/cards/frame/frame-rare.png',
    'Épique': '/textures/cards/frame/frame-epique.png',
    'Légendaire': '/textures/cards/frame/frame-legendaire.png',
}


// CardFace est toujours rendu (avant tout transform:scale() de ScaledCardFace/DeskRoom) à cette
// largeur de référence — donc c'est aussi la largeur à laquelle le cadre dessiné (130px de large
// à la source, cf. frame-commune.png/frame-legendaire.png) s'affiche en interne.
const NATURAL_WIDTH = 400
const CARD_SOURCE_PX = 130
// Taille à l'écran d'UN pixel du cadre, à cette échelle de référence — un texte anti-aliasé ne
// peut pas se "pixelliser" comme une image (pas d'équivalent image-rendering:pixelated pour du
// texte), mais caler chaque taille de police sur un multiple entier de cette valeur garde les
// deux grilles proportionnellement alignées, à n'importe quelle taille d'affichage finale (le
// transform:scale() qui réduit la carte réduit texte et image ensemble, dans les mêmes proportions).
const PX = NATURAL_WIDTH / CARD_SOURCE_PX

// Les zones du cadre sont petites et de taille fixe (contrairement à l'ancien design, qui
// grandissait avec la carte) — le texte doit rétrécir par paliers selon sa longueur pour rester
// dans sa case plutôt que déborder.
function nameFontSize(name: string) {
    if (name.length > 22) return 8 * PX
    if (name.length > 16) return 10 * PX
    return 11 * PX
}
function descFontSize(desc: string) {
    if (desc.length > 110) return 7 * PX
    if (desc.length > 90) return 8 * PX
    if (desc.length > 55) return 9 * PX
    return 11 * PX
}
const ICON_NUMBER_FONT_SIZE = 23 * PX

// Convertit une CardBox (cardLayout.ts, partagée avec le rendu Phaser en jeu) en style CSS
// absolute/%, tel qu'utilisé ci-dessous pour chaque case de texte.
function boxStyle(box: CardBox): CSSProperties {
    return { left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` }
}

// Numéros posés directement sur les icônes du cadre : blanc avec un liseré noir net (pas flouté),
// 2px d'épaisseur (diagonales à 1px ET 2px, plus les 4 côtés à 2px) pour rester lisible quelle
// que soit la couleur — claire ou sombre — de l'icône en dessous.
const iconNumberStyle = {
    fontSize: ICON_NUMBER_FONT_SIZE,
    textShadow: [
        '-1px -1px 0 #000', '1px -1px 0 #000', '-1px 1px 0 #000', '1px 1px 0 #000',
        '-2px -2px 0 #000', '2px -2px 0 #000', '-2px 2px 0 #000', '2px 2px 0 #000',
        '-2px 0 0 #000', '2px 0 0 #000', '0 -2px 0 #000', '0 2px 0 #000',
    ].join(', '),
}

export default function CardFace({ card, ownedQty }: { card: CardFaceData; ownedQty?: number }) {
    // CARD_ART couvre les 4 raretés réelles (Commune/Rare/Épique/Légendaire) — le ?? Commune n'est
    // qu'un filet de sécurité si une carte a une rareté mal orthographiée en base.
    const art = CARD_ART[card.rarity] ?? CARD_ART['Commune']!
    const segments = splitKeywordSegments(card.desc, card.keywords)
    const isSpell = isSpellRarity(card.rarity)

    return (
            // shadow-lg (box-shadow), pas drop-shadow-lg (filter) : cette div est justement celle
            // qu'un ancêtre réduit via transform:scale() (ScaledCardFace/DeskRoom) — Safari a un
            // bug connu où un filter sur un élément mis à l'échelle par un parent peut rogner le
            // rendu au lieu de simplement peindre l'ombre (repéré sur un emoji tronqué/décalé,
            // invisible en Chromium). box-shadow n'a pas ce problème.
            <div className="relative aspect-[130/191] w-full overflow-hidden shadow-lg">
                {ownedQty !== undefined && ownedQty > 1 && (
                    // left-0/top-0 (pas d'offset négatif) : CardFaceLayer (ScaledCardFace) enveloppe
                    // ce rendu dans un conteneur overflow-hidden pour la mise à l'échelle — un badge
                    // qui dépasse des bords s'y ferait rogner.
                    <span
                        className="absolute left-0 top-0 z-10 font-card font-bold text-white"
                        style={{ ...iconNumberStyle, fontSize: 13 * PX }}
                    >
                        x{ownedQty}
                    </span>
                )}

                {/* Illustration de la carte, dans le vrai trou découpé du cadre (CARD_ART_BOX,
                    identique au rendu Phaser en jeu — voir cardLayout.ts) — rien pour les cartes
                    qui n'ont pas encore d'illustration dessinée (assetKey par défaut). Rendue
                    avant le cadre (donc en dessous) : le cadre masque toujours ce qui dépasse de
                    la fenêtre découpée. `cover` (pas `contain`) : le ratio de chaque source varie
                    légèrement (voir cardTextLayout.ts côté Phaser) — cover remplit toute la case
                    quitte à rogner un peu les bords, plutôt que laisser une bande vide. */}
                {hasCardArt(card.assetKey) && (
                    <div
                        className="absolute"
                        style={{
                            ...boxStyle(CARD_ART_BOX),
                            backgroundImage: `url(/textures/cards/images/${card.assetKey}.webp)`,
                            backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
                            imageRendering: 'pixelated',
                        }}
                    />
                )}

                {/* Cadre dessiné (bordure, gemme, épées, goutte de sang — sauf le cadre "sort",
                    qui n'a ni épées ni goutte) — par-dessus l'illustration, pour que son décor
                    masque toujours ce qui dépasse de la fenêtre découpée. Les zones ci-dessous
                    sont positionnées en % par-dessus, mesurées sur ce visuel. */}
                <div
                    className="absolute inset-0"
                    style={{ backgroundImage: `url(${art})`, backgroundSize: '100% 100%', imageRendering: 'pixelated' }}
                />

                {/* Nom, dans la case blanche en haut à gauche */}
                <div
                    className="absolute flex items-center justify-center overflow-hidden px-1"
                    style={boxStyle(isSpell ? CARD_NAME_BOX_SPELL : CARD_NAME_BOX)}
                >
                    <p
                        className="truncate text-center font-card text-ink-900"
                        style={{ fontSize: nameFontSize(card.name) }}
                    >
                        {card.name}
                    </p>
                </div>

                {/* Coût de mana, au milieu de la gemme en haut à droite */}
                <div
                    className="absolute flex items-center justify-center"
                    style={boxStyle(isSpell ? CARD_COST_BOX_SPELL : CARD_COST_BOX)}
                >
                    <span className="font-card font-bold text-white" style={iconNumberStyle}>{card.cost}</span>
                </div>

                {/* Texte de la carte, dans la case blanche du bas — mots-clés en gras. Plus haute
                    sur le cadre "sort" : elle récupère l'espace qu'occuperaient ATK/DEF ailleurs. */}
                <div
                    className="absolute flex flex-col items-center justify-center overflow-hidden px-1.5 py-1"
                    style={boxStyle(isSpell ? CARD_DESC_BOX_SPELL : CARD_DESC_BOX)}
                >
                    <p
                        className="whitespace-pre-line text-center font-card leading-snug text-ink-800"
                        style={{ fontSize: descFontSize(card.desc) }}
                    >
                        {segments.map((seg, i) => seg.bold
                            ? <strong key={i} className="font-bold text-leather-900">{seg.text}</strong>
                            : <span key={i}>{seg.text}</span>
                        )}
                    </p>
                </div>

                {!isSpell && (
                    <>
                        {/* Attaque, à l'intersection des deux lames (pas plus bas, sur la garde
                            noire — un chiffre noir y disparaîtrait complètement) */}
                        <div
                            className="absolute flex items-center justify-center"
                            style={boxStyle(CARD_ATTACK_BOX)}
                        >
                            <span className="font-card font-bold text-white" style={iconNumberStyle}>{card.atk}</span>
                        </div>

                        {/* Points de vie, au milieu de la goutte de sang en bas à droite */}
                        <div
                            className="absolute flex items-center justify-center"
                            style={boxStyle(CARD_HEALTH_BOX)}
                        >
                            <span className="font-card font-bold text-white" style={iconNumberStyle}>{card.def}</span>
                        </div>
                    </>
                )}
            </div>
    )
}
