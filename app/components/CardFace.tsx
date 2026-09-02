import { splitKeywordSegments } from '@/lib/keywords'

export type CardFaceData = {
    id: string
    name: string
    rarity: string
    cost: string
    atk: string
    def: string
    desc: string
    emoji: string
    keywords: string[]
}

const RARITY_STYLE: Record<string, { border: string; glow: string }> = {
    'Commune': { border: 'border-stone-400', glow: '' },
    'Peu commune': { border: 'border-emerald-700', glow: '' },
    'Rare': { border: 'border-sky-800', glow: '' },
    'Épique': { border: 'border-purple-800', glow: '' },
    'Légendaire': { border: 'border-gold-400', glow: 'animate-legendary-glow' },
}

// Cadres dessinés à la main (sources .ase dans Documents/, exportés en PNG via un script maison —
// pas de licence à créditer, ce sont les assets du projet) : Commune, Épique et Légendaire pour
// les créatures (mêmes zones ATK/DEF), Rare pour les sorts (tous les sorts ont été reclassés en
// rareté Rare — ce tier est donc exclusivement des sorts, d'où son cadre sans épées/goutte de
// sang, voir SPELL_RARITIES plus bas).
const CARD_ART: Partial<Record<string, string>> = {
    'Commune': '/textures/cards/frame-commune.png',
    'Rare': '/textures/cards/frame-rare.png',
    'Épique': '/textures/cards/frame-epique.png',
    'Légendaire': '/textures/cards/frame-legendaire.png',
}

// Le cadre "Rare" (sorts) n'a ni épées ni goutte de sang : sa case de texte du bas est mesurée
// plus haute (récupère l'espace qu'occuperaient ATK/DEF sur les autres cadres) et sa gemme est
// positionnée légèrement différemment — chaque cadre est mesuré au pixel près individuellement
// sur son propre visuel plutôt que de réutiliser des pourcentages partagés.
const SPELL_RARITIES = new Set(['Rare'])

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
    const art = CARD_ART[card.rarity]
    const segments = splitKeywordSegments(card.desc, card.keywords)

    if (art) {
        const isSpell = SPELL_RARITIES.has(card.rarity)
        return (
            // shadow-lg (box-shadow), pas drop-shadow-lg (filter) : cette div est justement celle
            // qu'un ancêtre réduit via transform:scale() (ScaledCardFace/DeskRoom) — Safari a un
            // bug connu où un filter sur un élément mis à l'échelle par un parent peut rogner le
            // rendu au lieu de simplement peindre l'ombre (repéré sur un emoji tronqué/décalé,
            // invisible en Chromium). box-shadow n'a pas ce problème.
            <div className="relative aspect-[130/191] w-full shadow-lg">
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

                {/* Cadre dessiné (bordure, gemme, épées, goutte de sang — sauf le cadre "sort",
                    qui n'a ni épées ni goutte) — les zones ci-dessous sont positionnées en %
                    par-dessus, mesurées sur ce visuel. */}
                <div
                    className="absolute inset-0"
                    style={{ backgroundImage: `url(${art})`, backgroundSize: '100% 100%', imageRendering: 'pixelated' }}
                />

                {/* Nom, dans la case blanche en haut à gauche */}
                <div
                    className="absolute flex items-center justify-center overflow-hidden px-1"
                    style={isSpell
                        ? { left: '5.4%', top: '4.2%', width: '70.8%', height: '8.4%' }
                        : { left: '5.4%', top: '4.2%', width: '70%', height: '7.9%' }}
                >
                    <p
                        className="truncate text-center font-card font-bold text-ink-900"
                        style={{ fontSize: nameFontSize(card.name) }}
                    >
                        {card.name}
                    </p>
                </div>

                {/* Coût de mana, au milieu de la gemme en haut à droite */}
                <div
                    className="absolute flex items-center justify-center"
                    style={isSpell
                        ? { left: '79.2%', top: '3.1%', width: '16.2%', height: '12.6%' }
                        : { left: '78.3%', top: '4.5%', width: '18%', height: '11%' }}
                >
                    <span className="font-card font-bold text-white" style={iconNumberStyle}>{card.cost}</span>
                </div>

                {/* Texte de la carte, dans la case blanche du bas — mots-clés en gras. Plus haute
                    sur le cadre "sort" : elle récupère l'espace qu'occuperaient ATK/DEF ailleurs. */}
                <div
                    className="absolute flex flex-col items-center justify-center overflow-hidden px-1.5 py-1"
                    style={isSpell
                        ? { left: '5.4%', top: '57.1%', width: '89.2%', height: '38.7%' }
                        : { left: '5.4%', top: '57.1%', width: '88.5%', height: '32%' }}
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
                            style={{ left: '4.5%', top: '86%', width: '18%', height: '11%' }}
                        >
                            <span className="font-card font-bold text-white" style={iconNumberStyle}>{card.atk}</span>
                        </div>

                        {/* Points de vie, au milieu de la goutte de sang en bas à droite */}
                        <div
                            className="absolute flex items-center justify-center"
                            style={{ left: '80%', top: '86%', width: '18%', height: '11%' }}
                        >
                            <span className="font-card font-bold text-white" style={iconNumberStyle}>{card.def}</span>
                        </div>
                    </>
                )}
            </div>
        )
    }

    // Ancien design CSS — encore utilisé pour Rare/Épique en attendant leurs cadres dessinés.
    const rarity = RARITY_STYLE[card.rarity] ?? RARITY_STYLE['Commune']

    return (
        <div
            className={`relative flex aspect-[3/4] w-full flex-col rounded-lg border-[3px] ${rarity.border} ${rarity.glow}
                bg-[#e8dcc0] shadow-lg shadow-black/50`}
        >
            {ownedQty !== undefined && ownedQty > 1 && (
                <span className="absolute left-0 top-0 font-card text-5xl font-bold text-white" style={{ textShadow: iconNumberStyle.textShadow }}>
                    x{ownedQty}
                </span>
            )}

            {/* Bannière du nom */}
            <div className="px-2 pt-2 text-center">
                <h3 className="truncate font-card text-5xl font-bold leading-tight text-ink-900">
                    {card.name}
                </h3>
                <p className="font-card text-lg italic text-leather-700">{card.rarity}</p>
            </div>

            {/* Illustration (emoji en attendant de vrais artworks) — taille inchangée, seul le
                texte grandit. */}
            <div className="mx-2 mt-1 flex flex-1 items-center justify-center rounded border border-leather-800/30 bg-[#d9c49b]/70">
                <span className="text-7xl">{card.emoji}</span>
            </div>

            {/* Description, mots-clés en gras dans le texte */}
            <div className="flex-1 overflow-y-auto px-2 py-1.5">
                <p className="whitespace-pre-line font-card text-3xl leading-snug text-ink-800">
                    {segments.map((seg, i) => seg.bold
                        ? <strong key={i} className="font-bold text-leather-900">{seg.text}</strong>
                        : <span key={i}>{seg.text}</span>
                    )}
                </p>
            </div>

            {/* ATK / coût / DEF sur une même ligne, en bas de la carte — la barre a plus de
                place (py-4 au lieu de py-1.5) pour que les trois puissent grandir (text-4xl). */}
            <div className="grid grid-cols-3 items-center border-t border-leather-800/25 px-2 py-4">
                <span className="justify-self-start font-card text-5xl font-black text-red-800">⚔ {card.atk}</span>
                <span className="justify-self-center font-card text-5xl font-black text-sky-800">{card.cost}◆</span>
                <span className="justify-self-end font-card text-5xl font-black text-slate-700">🛡 {card.def}</span>
            </div>
        </div>
    )
}
