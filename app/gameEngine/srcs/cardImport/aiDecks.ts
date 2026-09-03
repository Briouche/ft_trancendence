// Decks de l'IA en mode solo — écrits à la main ici (noms de carte, pas des ids opaques), donc
// éditables directement sans passer par un compte/Deck Builder. Un même nom répété deux fois =
// deux exemplaires, exactement comme un deck normal. serverSocket.ts en tire un au hasard à
// chaque partie solo — voir makeDeckFromNames dans cardLoader.ts, qui résout ces noms sans
// vérifier qui possède la carte : l'IA peut jouer des cartes que le joueur humain n'a jamais
// débloquées.

// Deck agressif : courbe basse, pression dès le début.
const AGGRO_DECK: string[] = [
    "Leon, le chien saucisse",
    "le croupier", "le croupier", "Big mama hyena", "Big mama hyena",
    "Diablotin du piment", "Diablotin du piment", "Critique culinaire", "Critique culinaire",
    "Feed the troops", "Feed the troops", "Hyperactive cousin", "Hyperactive cousin",
    "Soulevement de tombes", "une maman aimante", "une maman aimante", "Soulevement de tombes",
    "Equal opportunity", "Equal opportunity", "Pyroblin", "Pyroblin",
]

// Deck contrôle : tous les sorts (Rare) + quelques grosses créatures pour tenir la fin de partie.
const CONTROL_DECK: string[] = [
    "Roi des rats",
    "Investment Goblin", "TIG", "Arcane Missile", "Entartrage", "soulevement de tombes",
    "une haleine vreument...", "Sauce TomAAAAAAte", "Feed the troops", "equal opportiny",
    "cannibalisme", "Lecture de textes Anciencs", "Mixeur", "blackhole", "cat pack",
    "cri du phoenix", "tremblement", "call the kraken", "Bombe H",
    "Slime orthophoniste", "champion de l'arene", "Voxotron exterminateur", "Force de la nature",
]

// Deck synergie Archimed : les 6 membres "bocal" (Épique) + Archimed lui-même, complété par des
// communes milieu de courbe — voir la description de la mécanique sur le compteur "archi" (Hero.ts).
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
