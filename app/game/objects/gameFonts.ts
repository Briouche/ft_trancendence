// Phaser draws its text on its own <canvas>: having the font loaded for the page's CSS
// (globals.css / layout.tsx, via next/font) isn't enough — the browser must have actually parsed
// it before a Phaser Text object is created with that fontFamily, otherwise it silently falls
// back to the default font. --font-pixel-game (set on <html> by next/font, see layout.tsx) holds
// the font's generated (hashed) name: we read it, then force-load it via the Font Loading API
// before starting GameScene (see BootScene.ts).
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
            // Falls back to Phaser's default font rather than block boot on a load failure.
        }

        return family;
    })();

    return loadedFamily;
}
