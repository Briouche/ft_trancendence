// Phaser dessine son texte sur son propre <canvas> : avoir la police chargée pour le CSS de la
// page (globals.css / layout.tsx, via next/font) ne suffit pas — le navigateur doit l'avoir
// réellement parsée avant qu'un Text Phaser soit créé avec ce fontFamily, sinon ça retombe
// silencieusement sur la police par défaut. --font-pixel-game (posée sur <html> par next/font,
// voir layout.tsx) porte le nom généré (haché) de la police : on le lit puis on force son
// chargement via la Font Loading API avant de démarrer GameScene (voir BootScene.ts).
const FONT_FAMILY_VAR = "--font-pixel-game";
const FALLBACK_FAMILY = "sans-serif";

let loadedFamily: Promise<string> | null = null;

export function ensureCardFontLoaded(): Promise<string>
{
    if (loadedFamily)
        return loadedFamily;

    loadedFamily = (async () => {
        const raw = getComputedStyle(document.documentElement).getPropertyValue(FONT_FAMILY_VAR).trim();
        const family = raw || FALLBACK_FAMILY;

        try
        {
            await document.fonts.load(`16px ${family}`);
            await document.fonts.ready;
        }
        catch
        {
            // Tant pis, on retombe sur la police par défaut de Phaser plutôt que de bloquer le boot.
        }

        return family;
    })();

    return loadedFamily;
}
