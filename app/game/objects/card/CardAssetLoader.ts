import Phaser from "phaser";

// Card illustrations load on demand; `loadingKeys` dedupes concurrent requests for one key.
const loadingKeys = new Set<string>();

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

// "placeholder_card" is the DB default for cards without an illustration.
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

    if (!loadingKeys.has(assetKey))
    {
        loadingKeys.add(assetKey);
        scene.load.image(assetKey, `/textures/cards/images/${assetKey}.webp`);
        scene.load.once(`filecomplete-image-${assetKey}`, () => loadingKeys.delete(assetKey));
        if (!scene.load.isLoading())
            scene.load.start();
    }
}
