import Phaser from "phaser";

// Card art loads on demand (per assetKey) rather than all upfront in BootScene, since a match
// only ever shows a fraction of all cards. The per-key set dedupes concurrent requests for the
// same key (e.g. two copies of the same minion drawn at once) to avoid queuing duplicate loader
// entries.
//
// Keyed by Phaser.Game rather than module-global on purpose: the texture cache these entries
// shadow lives on the game instance, so a module-global set outlives it. A key still in flight
// when the game is destroyed (GameLauncher.tsx unmount) never fires its filecomplete handler, and
// would then stay in the set forever — making the next game on the same page skip that load and
// render the card with no art at all. A WeakMap entry dies with its game, so each match starts
// with a clean slate and nothing needs explicit teardown.
const loadingKeysByGame = new WeakMap<Phaser.Game, Set<string>>();

function inFlightKeys(scene: Phaser.Scene): Set<string>
{
    let keys = loadingKeysByGame.get(scene.game);
    if (!keys)
    {
        keys = new Set<string>();
        loadingKeysByGame.set(scene.game, keys);
    }
    return keys;
}

const RARITY_FRAME_KEYS: Record<string, string> = {
    "Commune": "frame_commune",
    "Rare": "frame_rare",
    "Épique": "frame_epique",
    "Légendaire": "frame_legendaire",
};

export function resolveCardFrameKey(rarity: string): string
{
    return RARITY_FRAME_KEYS[rarity] ?? "frame_commune";
}

function hasCardArt(assetKey: string): boolean
{
    return !!assetKey && assetKey !== "placeholder_card";
}

export function resolveInitialCardArt(scene: Phaser.Scene, assetKey: string): { key: string | null; needsAsyncLoad: boolean }
{
    if (!hasCardArt(assetKey))
        return { key: null, needsAsyncLoad: false };

    const alreadyLoaded = scene.textures.exists(assetKey);
    return { key: alreadyLoaded ? assetKey : null, needsAsyncLoad: !alreadyLoaded };
}

export function ensureCardArt(scene: Phaser.Scene, assetKey: string, onLoaded: (key: string) => void): void
{
    if (scene.textures.exists(assetKey))
    {
        onLoaded(assetKey);
        return;
    }

    scene.load.once(`filecomplete-image-${assetKey}`, () => onLoaded(assetKey));

    const loadingKeys = inFlightKeys(scene);
    if (!loadingKeys.has(assetKey))
    {
        loadingKeys.add(assetKey);
        scene.load.image(assetKey, `/textures/cards/images/${assetKey}.webp`);
        scene.load.once(`filecomplete-image-${assetKey}`, () => loadingKeys.delete(assetKey));
        // Clear on failure too, otherwise one failed fetch (a blip mid-match) would permanently
        // block any retry of that card's art for the rest of the game.
        scene.load.once(`loaderror`, (file: Phaser.Loader.File) =>
        {
            if (file.key === assetKey)
                loadingKeys.delete(assetKey);
        });
        if (!scene.load.isLoading())
            scene.load.start();
    }
}
