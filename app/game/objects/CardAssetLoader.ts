import Phaser from "phaser";

const loadingKeys = new Set<string>();

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
