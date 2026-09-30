// AI decks for solo mode, by card name (a repeated name = two copies). Resolved by
// makeDeckFromNames in cardLoader.ts without any ownership check.
// Copied in app/lib/starterDecks.ts (starter deck of new accounts): keep the two in sync.

// Aggro: low curve.
const AGGRO_DECK: string[] = [
    "Leon, le chien saucisse",
    "le croupier", "le croupier", "Big mama hyena", "Big mama hyena",
    "Diablotin du piment", "Diablotin du piment", "Critique culinaire", "Critique culinaire",
    "Feed the troops", "Feed the troops", "Hyperactive cousin", "Hyperactive cousin",
    "soulevement de tombes", "une maman aimante", "une maman aimante", "soulevement de tombes",
    "equal opportunity", "equal opportunity", "Pyroblin", "Pyroblin",
]

// Control: spells + big late-game creatures.
const CONTROL_DECK: string[] = [
    "Roi des rats",
    "Investment Goblin", "TIG", "Arcane Missile", "Entartrage", "soulevement de tombes",
    "une haleine vreument...", "Sauce TomAAAAAAte", "Feed the troops", "equal opportunity",
    "cannibalisme", "Lecture de textes Anciencs", "Mixeur", "blackhole", "cat pack",
    "cri du phoenix", "tremblement", "call the kraken", "Bombe H",
    "Slime Saxophoniste", "champion de l'arene", "Voxotron exterminateur", "Force de la nature",
]

// Archimede synergy: the 6 "archi" cards + Archimede.
const ARCHI_DECK: string[] = [
    "Archimede la maudite",
    "Haku", "Reborn", "Ribgy", "Neo",
    "Po", "Zurg", "Bertrand", "Le Phoenix",
    "Goblinmikaze", "Flambeur de Dancefloor", "le gros pied puant", "CRS", "Client Mécontent",
    "Feeder goblin", "Cactus dos Pimentos", "Le menestrel", "tortue encourageante",
    "Bibliothequaire", "Pyroblin", "Jumeaux Goblin",
]

const AI_DECKS: string[][] = [AGGRO_DECK, CONTROL_DECK, ARCHI_DECK]

export function pickRandomAiDeck(): string[]
{
    return AI_DECKS[Math.floor(Math.random() * AI_DECKS.length)]
}
