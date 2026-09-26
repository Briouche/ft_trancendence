import Phaser from "phaser";

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

/** Texture key of the card frame for a rarity (common frame for unknown rarities). */
export function resolveCardFrameKey(rarity: string): string
{
    return RARITY_FRAME_KEYS[rarity] ?? "frame_commune";
}

// "placeholder_card" is the DB default for cards without an illustration.
function hasCardArt(assetKey: string): boolean
{
    return !!assetKey && assetKey !== "placeholder_card";
}

/**
 * Illustration texture to use right away: its key if already loaded, otherwise null plus
 * `needsAsyncLoad` so the caller fetches it with ensureCardArt.
 */
export function resolveInitialCardArt(scene: Phaser.Scene, assetKey: string): { key: string | null; needsAsyncLoad: boolean }
{
    if (!hasCardArt(assetKey))
        return { key: null, needsAsyncLoad: false };

    const alreadyLoaded = scene.textures.exists(assetKey);
    return { key: alreadyLoaded ? assetKey : null, needsAsyncLoad: !alreadyLoaded };
}

/**
 * Loads a card illustration on demand (card art is not preloaded: there are too many) and calls
 * `onLoaded` once it is available, or `onFailed` if it can't be loaded. Concurrent requests for
 * the same art share one download.
 */
export function ensureCardArt(scene: Phaser.Scene, assetKey: string, onLoaded: (key: string) => void, onFailed?: () => void): void
{
    if (scene.textures.exists(assetKey))
    {
        onLoaded(assetKey);
        return;
    }

    const loadingKeys = inFlightKeys(scene);

    // Every waiter is told the outcome exactly once, whichever way it goes, so both listeners are
    // removed as soon as either fires. "loaderror" in particular is a single, non-keyed event
    // fired for *every* failing file, so each waiter has to filter for its own key and stay
    // subscribed otherwise — a `once` here gets consumed by whichever file happens to error
    // first, which is how a failed fetch could leave this key stuck in `loadingKeys` and block
    // every retry of that card's art for the rest of the match.
    const onComplete = () =>
    {
        scene.load.off("loaderror", onError);
        onLoaded(assetKey);
    };

    const onError = (file: Phaser.Loader.File) =>
    {
        if (file.key !== assetKey)
            return;

        scene.load.off(`filecomplete-image-${assetKey}`, onComplete);
        scene.load.off("loaderror", onError);
        loadingKeys.delete(assetKey);
        onFailed?.();
    };

    scene.load.once(`filecomplete-image-${assetKey}`, onComplete);
    scene.load.on("loaderror", onError);

    if (!loadingKeys.has(assetKey))
    {
        loadingKeys.add(assetKey);
        scene.load.image(assetKey, `/textures/cards/images/${assetKey}.webp`);
        scene.load.once(`filecomplete-image-${assetKey}`, () => loadingKeys.delete(assetKey));
        if (!scene.load.isLoading())
            scene.load.start();
    }
}
