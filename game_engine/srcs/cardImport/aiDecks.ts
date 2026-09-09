// AI decks for solo mode — hand-written here (card names, not opaque ids), so they're directly
// editable without going through an account/deck builder. A name repeated twice = two copies,
// exactly like a normal deck. serverSocket.ts picks one at random for each solo game — see
// makeDeckFromNames in cardLoader.ts, which resolves these names without checking who owns the
// card: the AI can play cards the human player has never unlocked.

// Aggro deck: low curve, pressure from the start.
const AGGRO_DECK: string[] = [
    "Leon, le chien saucisse",
    "le croupier", "le croupier", "Big mama hyena", "Big mama hyena",
    "Diablotin du piment", "Diablotin du piment", "Critique culinaire", "Critique culinaire",
    "Feed the troops", "Feed the troops", "Hyperactive cousin", "Hyperactive cousin",
    "Soulevement de tombes", "une maman aimante", "une maman aimante", "Soulevement de tombes",
    "Equal opportunity", "Equal opportunity", "Pyroblin", "Pyroblin",
]

// Control deck: all the (Rare) spells + a few big creatures to hold out for the late game.
const CONTROL_DECK: string[] = [
    "Roi des rats",
    "Investment Goblin", "TIG", "Arcane Missile", "Entartrage", "soulevement de tombes",
    "une haleine vreument...", "Sauce TomAAAAAAte", "Feed the troops", "equal opportiny",
    "cannibalisme", "Lecture de textes Anciencs", "Mixeur", "blackhole", "cat pack",
    "cri du phoenix", "tremblement", "call the kraken", "Bombe H",
    "Slime orthophoniste", "champion de l'arene", "Voxotron exterminateur", "Force de la nature",
]

// Archimede synergy deck: the 6 "jar" members (Epic) + Archimede himself, filled out with
// mid-curve commons — see the "archi" counter mechanic (Player.archimedeCount, player.ts).
const ARCHI_DECK: string[] = [
    "Archimed la maudite",
    "Haku (archi card)", "Reborn (Archi card)", "Ribgy (Archi card)", "Neo (archi card)",
    "Po (archi card)", "Zurg (archi card)", "Bertrand", "Le Phoenix",
    "Goblinmikaze", "Flambeur de Dancefloor", "podophile", "CRS", "Client Mécontent",
    "Feeder goblin", "Cactus dos Pimentos", "Le menestrel", "allie peureux",
    "Bibliothequaire", "Pyroblin", "Jumeau Goblin",
]

export const AI_DECKS: string[][] = [AGGRO_DECK, CONTROL_DECK, ARCHI_DECK]

export function pickRandomAiDeck(): string[]
{
    return AI_DECKS[Math.floor(Math.random() * AI_DECKS.length)]
}
