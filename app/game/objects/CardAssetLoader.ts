import Phaser from "phaser";

const loadingKeys = new Set<string>();

// Presque aucune carte n'a de véritable illustration individuelle (assetKey reste sur son défaut
// "placeholder_card" en base) — plutôt que d'afficher la même image générique pour toutes les
// cartes du jeu, on retombe sur le cadre de la bonne rareté (mêmes textures que Collection/
// CardFace.tsx), préchargées dans BootScene sous ces clés.
const RARITY_FRAME_KEYS: Record<string, string> = {
    "Commune": "frame_commune",
    "Rare": "frame_rare",
    "Épique": "frame_epique",
    "Légendaire": "frame_legendaire",
};

function rarityFrameKey(rarity: string): string
{
    return RARITY_FRAME_KEYS[rarity] ?? "frame_commune";
}

// Décide quelle texture afficher pour une carte AVANT tout chargement asynchrone : sa propre
// illustration si elle existe déjà (assetKey réel, déjà chargé), sinon le cadre de sa rareté —
// jamais le placeholder générique. `needsAsyncLoad` indique s'il vaut la peine d'essayer de
// charger un assetKey réel qui n'est pas encore en mémoire (voir ensureCardAsset ci-dessous).
export function resolveInitialCardTexture(scene: Phaser.Scene, assetKey: string, rarity: string): { key: string; needsAsyncLoad: boolean }
{
    const isPlaceholderAsset = assetKey === "placeholder_card";
    const assetAlreadyLoaded = !isPlaceholderAsset && scene.textures.exists(assetKey);

    return {
        key: assetAlreadyLoaded ? assetKey : rarityFrameKey(rarity),
        needsAsyncLoad: !isPlaceholderAsset && !assetAlreadyLoaded,
    };
}

export function ensureCardAsset(scene: Phaser.Scene, assetKey: string, onLoaded: (key: string) => void): void
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
        scene.load.image(assetKey, `/gameAssets/cards/${assetKey}.png`);
        scene.load.once(`filecomplete-image-${assetKey}`, () => loadingKeys.delete(assetKey));
        if (!scene.load.isLoading())
            scene.load.start();
    }
}
