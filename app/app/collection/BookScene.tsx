'use client'

import { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Sparkles, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import CardFace, { type CardFaceData } from '@/components/CardFace'
import { PALETTE, ATMOSPHERE } from '@/components/library/theme'

type Card = CardFaceData & { ownedQty: number }

const HALF_WIDTH   = 1.7
// Plus haut qu'avant (2.4) : une grille 2×3 de cartes au format 3/4 (portrait) est
// naturellement bien plus haute que large — sur une page trop large pour ce ratio, la grille
// ne pouvait remplir qu'une seule dimension à la fois (largeur OU hauteur, jamais les deux).
const BOOK_HEIGHT  = 3.0
const SPINE_WIDTH  = 0.16
const PAGE_DEPTH   = 0.22
const DISTANCE_FACTOR = 0.7
const FLIP_THRESHOLD   = 0.35
const FLIP_DURATION_MS = 550

type FlipState = { direction: 'next' | 'prev'; progress: number } | null

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
}

// La largeur ne peut pas être choisie librement : avec des cartes en ratio 3/4 (plus hautes
// que larges) sur 3 lignes, la hauteur nécessaire est ~2x la largeur totale — une largeur trop
// grande (ex: 820px) forçait des cartes plus hautes que leur propre ligne, donc elles
// débordaient sur la suivante. 540px est calculé pour que 3 lignes de cartes en 246px de large
// (donc 328px de haut) tiennent pile dans 1050px.
// Hauteur calculée pile pour la largeur choisie (pas au-delà) : avec gap=16 et padding=16 de
// chaque côté, 3 lignes de cartes ratio 3/4 ont besoin exactement de `2×largeur − 32` de haut.
// Une hauteur plus grande que ça laissait de l'espace mort entre les rangées (ce qui empêchait
// les cartes de vraiment remplir le livre).
function CardGrid({ cards, onCardClick }: { cards: Card[]; onCardClick?: (card: Card) => void }) {
    return (
        <div className="w-[850px] h-[1668px] grid grid-cols-2 grid-rows-3 gap-4 p-4">
            {cards.length === 0 && (
                <p className="col-span-full self-center text-center italic text-leather-700">
                    No cards
                </p>
            )}
            {cards.map(card => (
                // stopPropagation : sans ça le clic remonte jusqu'à la zone de tournage de page
                // (qui couvre tout l'écran) et fait tourner la page au lieu de zoomer la carte.
                <div
                    key={card.id}
                    onClick={e => { e.stopPropagation(); onCardClick?.(card) }}
                    className="cursor-pointer"
                >
                    <CardFace card={card} ownedQty={card.ownedQty} />
                </div>
            ))}
        </div>
    )
}

// Une demi-page statique (celle qui ne tourne pas), posée à plat sur la pile de pages.
function PageStack({ side, cards, onCardClick }: { side: 'left' | 'right'; cards: Card[]; onCardClick?: (card: Card) => void }) {
    const x = side === 'left' ? -(SPINE_WIDTH / 2 + HALF_WIDTH / 2) : (SPINE_WIDTH / 2 + HALF_WIDTH / 2)
    return (
        <group position={[x, BOOK_HEIGHT / 2, 0]}>
            <mesh position={[0, 0, PAGE_DEPTH / 2 - 0.02]} castShadow receiveShadow>
                <boxGeometry args={[HALF_WIDTH, BOOK_HEIGHT, PAGE_DEPTH]} />
                <meshStandardMaterial color={PALETTE.parchment200} roughness={0.95} />
            </mesh>
            {/* zIndexRange : les cartes doivent passer devant les zones de tournage de page
                (des <div> plein écran superposées au Canvas) pour que leur clic les intercepte
                en premier, sans quoi elles ne sont jamais atteignables. */}
            <Html transform distanceFactor={DISTANCE_FACTOR} position={[0, 0.05, PAGE_DEPTH]} center zIndexRange={[100, 0]}>
                <CardGrid cards={cards} onCardClick={onCardClick} />
            </Html>
        </group>
    )
}

// La page qui tourne : recto/verso, pivot vertical sur la reliure (x = 0), même logique
// (recto = page actuelle, verso pré-tourné à 180° autour de son propre centre) que la
// version CSS, mais en vraie 3D — donc une vraie rotation, une vraie perspective.
function FlippingPage({
    side, flip, front, back,
}: {
    side: 'left' | 'right'
    flip: FlipState
    front: Card[]
    back: Card[]
}) {
    const isTurning = flip !== null && (
        (side === 'right' && flip.direction === 'next') ||
        (side === 'left'  && flip.direction === 'prev')
    )
    if (!isTurning || !flip) return null

    const sign         = side === 'right' ? -1 : 1
    const angle         = sign * flip.progress * Math.PI
    // Même décalage que PageStack (SPINE_WIDTH/2 + HALF_WIDTH/2), pivoté depuis le centre exact
    // de la reliure (x=0) : avant, le pivot était sur le bord de la reliure (±SPINE_WIDTH/2) mais
    // le contenu n'était décalé que de HALF_WIDTH/2 — la page tournée finissait donc décalée
    // d'une largeur de reliure par rapport à la pile de pages statique en face.
    const localX        = side === 'left' ? -(SPINE_WIDTH / 2 + HALF_WIDTH / 2) : (SPINE_WIDTH / 2 + HALF_WIDTH / 2)
    const facingFront    = flip.progress < 0.5

    return (
        // Le décalage en profondeur (+PAGE_DEPTH, même valeur que le Html de PageStack) doit
        // rester HORS du groupe tourné : appliqué à l'intérieur (comme avant), une rotation de
        // ~180° inverse son signe (+PAGE_DEPTH devient -PAGE_DEPTH) et la page atterrit du
        // mauvais côté de la reliure en profondeur — ce qui, vu la caméra en perspective et le
        // livre incliné, se lisait comme "les cartes finissent en dessous" des pages fixes.
        <group position={[0, BOOK_HEIGHT / 2, PAGE_DEPTH]}>
            <group rotation={[0, angle, 0]}>
                {/* +0.05 en Y : même décalage que le Html de PageStack. */}
                <group position={[localX, 0.05, 0]}>
                    <Html
                        transform
                        distanceFactor={DISTANCE_FACTOR}
                        center
                        className={`${facingFront ? 'visible' : 'invisible'} [backface-visibility:hidden]`}
                    >
                        <div className="relative">
                            <CardGrid cards={front} />
                            <div
                                className="absolute inset-0 bg-black pointer-events-none"
                                style={{ opacity: Math.min(0.5, flip.progress * 0.7) }}
                            />
                        </div>
                    </Html>
                    <group rotation={[0, Math.PI, 0]}>
                        <Html
                            transform
                            distanceFactor={DISTANCE_FACTOR}
                            center
                            className={`${facingFront ? 'invisible' : 'visible'} [backface-visibility:hidden]`}
                        >
                            <div className="relative">
                                <CardGrid cards={back} />
                                <div
                                    className="absolute inset-0 bg-black pointer-events-none"
                                    style={{ opacity: Math.min(0.5, (1 - flip.progress) * 0.7) }}
                                />
                            </div>
                        </Html>
                    </group>
                </group>
            </group>
        </group>
    )
}

function Spine() {
    return (
        <mesh position={[0, BOOK_HEIGHT / 2, PAGE_DEPTH / 2]} castShadow receiveShadow>
            <boxGeometry args={[SPINE_WIDTH, BOOK_HEIGHT + 0.14, PAGE_DEPTH + 0.1]} />
            <meshStandardMaterial color={PALETTE.leather900} roughness={0.6} />
        </mesh>
    )
}

// `active` : survol de la zone cliquable correspondante (pas de la page) — juste un léger
// grossissement du bord plutôt qu'un halo lumineux, pour rester discret.
function CoverEdge({ side, active = false }: { side: 'left' | 'right'; active?: boolean }) {
    const x = side === 'left'
        ? -(SPINE_WIDTH / 2 + HALF_WIDTH + 0.05)
        : (SPINE_WIDTH / 2 + HALF_WIDTH + 0.05)
    return (
        <mesh
            position={[x, BOOK_HEIGHT / 2, PAGE_DEPTH / 2]}
            scale={active ? [1.35, 1.02, 1.15] : [1, 1, 1]}
            castShadow
            receiveShadow
        >
            <boxGeometry args={[0.1, BOOK_HEIGHT + 0.14, PAGE_DEPTH + 0.1]} />
            <meshStandardMaterial color={PALETTE.leather800} roughness={0.6} />
        </mesh>
    )
}

// Même lampe sur pied que celle posée à côté du fauteuil de lecture dans le hall — on
// continue visuellement dans la même pièce, comme si le joueur s'était juste assis dedans
// avec son livre plutôt que d'être passé dans un tout autre décor (table + bougie + fioles).
function FloorLamp({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
    const glassRef = useRef<THREE.Mesh>(null)
    useFrame(({ clock }) => {
        if (!glassRef.current) return
        const mat = glassRef.current.material as THREE.MeshStandardMaterial
        const t = clock.getElapsedTime()
        mat.emissiveIntensity = 1.6 + Math.sin(t * 6.5) * 0.16 + Math.sin(t * 12.3) * 0.08
    })
    return (
        <group position={position} scale={scale}>
            <mesh position={[0, 0.02, 0]} castShadow>
                <cylinderGeometry args={[0.13, 0.15, 0.04, 20]} />
                <meshStandardMaterial color={PALETTE.gold600} metalness={0.6} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.5, 0]} castShadow>
                <cylinderGeometry args={[0.02, 0.025, 0.96, 10]} />
                <meshStandardMaterial color={PALETTE.gold600} metalness={0.55} roughness={0.4} />
            </mesh>
            <mesh ref={glassRef} position={[0, 1.02, 0]}>
                <sphereGeometry args={[0.14, 16, 16]} />
                <meshStandardMaterial color="#fff2c4" emissive="#ffb066" emissiveIntensity={1.6} roughness={0.3} transparent opacity={0.85} toneMapped={false} />
            </mesh>
            <pointLight position={[0, 1.02, 0]} color="#ffb066" intensity={1.6} distance={4} decay={2} />
        </group>
    )
}

function ScurryingMouse() {
    const ref = useRef<THREE.Group>(null)
    useFrame(({ clock }) => {
        if (!ref.current) return
        const cycle = 22
        const t = (clock.getElapsedTime() % cycle) / cycle
        const active = t < 0.18
        ref.current.visible = active
        if (active) {
            const p = t / 0.18
            ref.current.position.x = -4.5 + p * 9
            ref.current.position.z = 2.6 + Math.sin(p * Math.PI) * 0.3
        }
    })
    return (
        <group ref={ref} position={[-5, 0.09, 2.6]}>
            <mesh castShadow scale={[1, 0.75, 1.3]}>
                <sphereGeometry args={[0.11, 12, 12]} />
                <meshStandardMaterial color="#5a5048" roughness={0.9} />
            </mesh>
            <mesh position={[0.14, 0.03, 0]} castShadow>
                <sphereGeometry args={[0.06, 10, 10]} />
                <meshStandardMaterial color="#5a5048" roughness={0.9} />
            </mesh>
            <mesh position={[-0.13, 0.02, 0]} rotation={[0, 0, -0.3]}>
                <coneGeometry args={[0.02, 0.28, 6]} />
                <meshStandardMaterial color="#3a332e" roughness={0.9} />
            </mesh>
        </group>
    )
}

function LooseCard({ position, rotation }: { position: [number, number, number]; rotation: number }) {
    return (
        <mesh position={position} rotation={[-Math.PI / 2, 0, rotation]} castShadow receiveShadow>
            <boxGeometry args={[0.5, 0.7, 0.02]} />
            <meshStandardMaterial color={PALETTE.parchment100} roughness={0.85} />
        </mesh>
    )
}

function Scene({
    leftCards, rightCards, flip, backCards, revealCards, hoverSide, onCardClick,
}: {
    leftCards: Card[]
    rightCards: Card[]
    flip: FlipState
    backCards: Card[]
    revealCards: Card[]
    hoverSide: 'prev' | 'next' | null
    onCardClick?: (card: Card) => void
}) {
    // Pendant qu'une page tourne, la pile fixe du côté qui tourne montre déjà le contenu de la
    // page suivante (cachée dessous, comme dans un vrai livre) au lieu de l'ancienne page qui ne
    // change qu'au tout dernier instant.
    const displayLeftCards  = flip?.direction === 'prev' ? revealCards : leftCards
    const displayRightCards = flip?.direction === 'next' ? revealCards : rightCards
    return (
        <>
            <color attach="background" args={[ATMOSPHERE.background]} />
            <fog attach="fog" args={[ATMOSPHERE.background, 7, 16]} />

            {/* Éclairage fixe, pas de lanterne qui suit la souris : elle faisait varier la
                luminosité de façon incohérente au moindre mouvement — même choix que pour le
                hall (parallaxe retirée), pour une scène stable plutôt que réactive à la souris.
                Ambiante/directionnelle remises à leur niveau d'origine (les monter délavait les
                couleurs, l'ambiante étant un gris-bleu froid) ; un point light chaud fixe
                remplace la teinte de la lanterne à la place. */}
            <ambientLight intensity={0.55} color={ATMOSPHERE.ambientColor} />
            <directionalLight
                position={[3, 6, 4]}
                intensity={1.3}
                color="#fff2df"
                castShadow
                shadow-mapSize={[1024, 1024]}
            />
            <directionalLight position={[-4, 3, -3]} intensity={0.35} color="#8fb8ff" />
            <pointLight position={[0, 2.4, 2.5]} intensity={9} color="#ffb066" distance={12} decay={2} />

            <Sparkles count={40} scale={[6, 3, 4]} size={2} speed={0.25} opacity={0.35} color="#d4af37" />

            {/* La table */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[30, 30]} />
                <meshStandardMaterial color={PALETTE.ink800} roughness={0.55} metalness={0.1} />
            </mesh>

            {/* Le livre, légèrement penché en arrière comme sur un lutrin */}
            <group rotation={[-0.16, 0, 0]}>
                <PageStack side="left" cards={displayLeftCards} onCardClick={onCardClick} />
                <PageStack side="right" cards={displayRightCards} onCardClick={onCardClick} />
                <Spine />
                <CoverEdge side="left" active={hoverSide === 'prev'} />
                <CoverEdge side="right" active={hoverSide === 'next'} />
                <FlippingPage side="left" flip={flip} front={leftCards} back={backCards} />
                <FlippingPage side="right" flip={flip} front={rightCards} back={backCards} />
            </group>

            {/* Lampe haute et proche de la caméra, sur la droite : seul le bas (pied + début du
                pied) reste dans le cadre, comme si elle se trouvait derrière/à côté de l'épaule
                du joueur assis dans le fauteuil du hall — pas posée en face sur la table. */}
            <FloorLamp position={[1.7, 0, 3]} scale={3} />
            <LooseCard position={[-2.0, 0.011, 2.5]} rotation={0.3} />
            <LooseCard position={[-1.7, 0.011, 2.7]} rotation={-0.5} />
            <ScurryingMouse />
        </>
    )
}

export type BookSceneProps = {
    leftCards: Card[]
    rightCards: Card[]
    canGoPrev: boolean
    canGoNext: boolean
    onFlipStart: (direction: 'next' | 'prev') => void
    onFlipMove: (deltaRatio: number) => void
    onFlipEnd: () => void
    flip: FlipState
    backCards: Card[]
    revealCards: Card[]
    onCardClick?: (card: Card) => void
}

export default function BookScene({
    leftCards, rightCards, canGoPrev, canGoNext, onFlipStart, onFlipMove, onFlipEnd, flip, backCards, revealCards, onCardClick,
}: BookSceneProps) {
    const dragStartX = useRef<number | null>(null)
    // Survol d'une zone cliquable (pas de drag) : allume le bord de la page correspondante,
    // pour donner un vrai retour visuel avant même de cliquer.
    const [hoverSide, setHoverSide] = useState<'prev' | 'next' | null>(null)

    function startDrag(direction: 'next' | 'prev') {
        return (e: React.PointerEvent<HTMLDivElement>) => {
            dragStartX.current = e.clientX
            onFlipStart(direction)
            e.currentTarget.setPointerCapture(e.pointerId)
        }
    }

    function onMove(e: React.PointerEvent<HTMLDivElement>) {
        if (dragStartX.current === null) return
        const width = (e.currentTarget.parentElement?.offsetWidth ?? 800) / 2
        onFlipMove((e.clientX - dragStartX.current) / width)
    }

    function onUp() {
        if (dragStartX.current === null) return
        dragStartX.current = null
        onFlipEnd()
    }

    return (
        <div className="fixed inset-0">
            <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
                {/* Reculée (7.7, contre 6.5) et recentrée (BOOK_HEIGHT/2 = 1.5, contre 1.55) pour
                    le livre plus haut qu'avant — sinon le haut des pages disparaissait derrière
                    la barre d'en-tête. */}
                {/* lookAt remonté (1.5 -> 1.8) : viser plus haut fait apparaître le livre plus bas
                    dans le cadre, avec une vraie marge sous la barre d'en-tête. */}
                {/* Caméra rapprochée (8.1 -> 6.5) pour agrandir le livre à l'écran, sans toucher
                    à ses proportions internes ni au remplissage des cartes déjà calibrés. */}
                <PerspectiveCamera makeDefault position={[0, 2.4, 7.2]} fov={32} onUpdate={c => c.lookAt(0, 1.9, 0)} />
                <Scene leftCards={leftCards} rightCards={rightCards} flip={flip} backCards={backCards} revealCards={revealCards} hoverSide={hoverSide} onCardClick={onCardClick} />
            </Canvas>

            {/* 50/50 plutôt que des bandes de 25% aux extrémités : le livre étant centré et
                assez large à l'écran, des bandes fines ne couvraient qu'un vide de part et
                d'autre — la moitié de l'écran garantit que le livre, où qu'il soit affiché,
                est toujours couvert par l'une des deux zones. */}
            {canGoPrev && (
                <div
                    onPointerDown={startDrag('prev')}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={onUp}
                    onPointerEnter={() => setHoverSide('prev')}
                    onPointerLeave={() => setHoverSide(null)}
                    title="Click or drag to go back"
                    className="absolute inset-y-0 left-0 w-1/2 cursor-pointer touch-none"
                />
            )}
            {canGoNext && (
                <div
                    onPointerDown={startDrag('next')}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={onUp}
                    onPointerEnter={() => setHoverSide('next')}
                    onPointerLeave={() => setHoverSide(null)}
                    title="Click or drag to turn the page"
                    className="absolute inset-y-0 right-0 w-1/2 cursor-pointer touch-none"
                />
            )}
        </div>
    )
}
