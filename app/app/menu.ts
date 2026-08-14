export type MenuItem = {
    href:        string
    label:       string
    description: string
    emoji?:      string
    available:   boolean
}

// Source unique : chaque entrée devient un corridor dans le hall 3D ET une ligne dans le
// menu simple (accessibilité / mobile / repli).
export const MENU_ITEMS: MenuItem[] = [
    {
        href:        '/collection',
        label:       'Collection',
        description: 'Parcourir ta collection de cartes',
        available:   true,
    },
    {
        href:        '/deck',
        label:       'Création de deck',
        description: 'Composer ton deck pour la prochaine partie',
        available:   true,
    },
    {
        href:        '/packs',
        label:       'Bibliothécaire',
        description: 'Ouvrir tes paquets de cartes',
        available:   true,
    },
    {
        href:        '/game',
        label:       'Sous-sol',
        description: 'Bientôt disponible',
        emoji:       '⚔️',
        available:   false,
    },
]
