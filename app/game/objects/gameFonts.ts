// Resolves the site font's generated family name (--font-pixel-game) and makes sure the browser
// has loaded it before Phaser draws any text.
const FONT_FAMILY_VAR = "--font-pixel-game";
const FALLBACK_FAMILY = "sans-serif";

let loadedFamily: Promise<string> | null = null;

/**
 * Waits until the site's pixel font is loaded and returns its family name, so Phaser (which
 * draws text into a canvas once) never renders with a fallback font. Memoized; a failure clears
 * the memo so the next call retries.
 */
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
        }

        return family;
    })();

    return loadedFamily;
}
