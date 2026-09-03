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
        description: 'Browse your card collection',
        available:   true,
    },
    {
        href:        '/deck',
        label:       'Deck Builder',
        description: 'Build your deck for the next match',
        available:   true,
    },
    {
        href:        '/packs',
        label:       'Librarian',
        description: 'Open your card packs',
        available:   true,
    },
    {
        href:        '/play',
        label:       'Game room',
        description: 'Play a match',
        emoji:       '⚔️',
        available:   true,
    },
    {
        href:        '/manual',
        label:       'Tuto',
        description: 'Learn how to play',
        emoji:       '📋',
        available:   true,
    },
]
