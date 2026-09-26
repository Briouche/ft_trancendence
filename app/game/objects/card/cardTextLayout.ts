import Phaser from "phaser";
import { CardBox, CARD_ATTACK_BOX, CARD_COST_BOX, CARD_COST_BOX_SPELL, CARD_HEALTH_BOX } from "@/lib/cardLayout";

// Text/image placement helpers for in-game cards, based on the % boxes of lib/cardLayout.ts.

function growBox(box: CardBox, extraWidth: number, extraHeight: number): CardBox
{
    return {
        left: box.left - extraWidth / 2,
        top: box.top - extraHeight / 2,
        width: box.width + extraWidth,
        height: box.height + extraHeight,
    };
}

// Number boxes enlarged a bit, since in-game cards are small.
export const GAME_COST_BOX = growBox(CARD_COST_BOX, 5, 5);
export const GAME_COST_BOX_SPELL = growBox(CARD_COST_BOX_SPELL, 5, 5);
export const GAME_ATTACK_BOX = growBox(CARD_ATTACK_BOX, 5, 5);
export const GAME_HEALTH_BOX = growBox(CARD_HEALTH_BOX, 5, 5);

/** Center of a percentage box (see lib/cardLayout.ts) relative to the card center, in pixels. */
export function boxCenterOffset(box: CardBox, width: number, height: number): { x: number; y: number }
{
    return {
        x: ((box.left + box.width / 2) / 100) * width - width / 2,
        y: ((box.top + box.height / 2) / 100) * height - height / 2,
    };
}

// Shrinks the font until the text fits the box.
function fitTextToBox(text: Phaser.GameObjects.Text, boxWidthPx: number, boxHeightPx: number, minSize = 8): void
{
    let size = parseInt(text.style.fontSize as string, 10);
    if (!Number.isFinite(size))
        return;

    while (size > minSize && (text.width > boxWidthPx || text.height > boxHeightPx))
    {
        size -= 1;
        text.setFontSize(size);
    }
}


const fitSizeCache = new Map<string, number>();

// Common prefix shared by both caches below — round pixel dimensions so float noise (e.g.
// 119.9999999) doesn't fragment the cache.
function textBoxCacheKey(text: Phaser.GameObjects.Text, boxWidthPx: number, boxHeightPx: number, minSize: number, maxSize: number): string
{
    return `${text.text}|${text.style.fontFamily}|${Math.round(boxWidthPx)}|${Math.round(boxHeightPx)}|${minSize}|${maxSize}`;
}

// maximizeTextToBox's result depends on the text's CURRENT word-wrap width (part of `text.style`,
// set by the caller before invoking it), so that's part of its cache key.
function fitCacheKey(text: Phaser.GameObjects.Text, boxWidthPx: number, boxHeightPx: number, minSize: number, maxSize: number): string
{
    return `${textBoxCacheKey(text, boxWidthPx, boxHeightPx, minSize, maxSize)}|${Math.round(text.style.wordWrapWidth ?? -1)}`;
}

/**
 * Finds the largest font size (between minSize and maxSize) that still fits the box — unlike
 * fitTextToBox, which only shrinks from a fixed starting point, this grows or shrinks from the
 * current size to maximize use of the available space (useful for the name, whose length varies
 * a lot from card to card). Binary search relies on `fits` being monotonic in size (a larger font
 * never fits where a smaller one didn't), which holds for a fixed wrap width.
 */
export function maximizeTextToBox(text: Phaser.GameObjects.Text, boxWidthPx: number, boxHeightPx: number, minSize = 8, maxSize = 200): void
{
    const cacheKey = fitCacheKey(text, boxWidthPx, boxHeightPx, minSize, maxSize);
    const cached = fitSizeCache.get(cacheKey);
    if (cached !== undefined)
    {
        text.setFontSize(cached);
        return;
    }

    const fits = (size: number): boolean =>
    {
        text.setFontSize(size);
        return text.width <= boxWidthPx && text.height <= boxHeightPx;
    };

    if (!fits(minSize))
    {
        text.setFontSize(minSize);
        fitSizeCache.set(cacheKey, minSize);
        return;
    }

    let lo = minSize;
    let hi = maxSize;
    while (lo < hi)
    {
        const mid = lo + Math.ceil((hi - lo) / 2);
        if (fits(mid))
            lo = mid;
        else
            hi = mid - 1;
    }

    text.setFontSize(lo);
    fitSizeCache.set(cacheKey, lo);
}

const WRAP_WIDTH_FRACTIONS = [1, 0.8, 0.65, 0.5, 0.4];

const wrapFitCache = new Map<string, { bestSize: number; bestWrapWidth: number }>();

/**
 * Like maximizeTextToBox, but also tries several wrap widths (i.e. more or fewer lines) and keeps
 * whichever yields the largest font — a short/wide text often bottlenecked by the WIDTH of a
 * single line can end up much bigger once spread over 2-3 narrower lines that use the box's
 * remaining height.
 */
export function maximizeWrappedTextToBox(text: Phaser.GameObjects.Text, boxWidthPx: number, boxHeightPx: number, minSize = 8, maxSize = 200): void
{
    const cacheKey = textBoxCacheKey(text, boxWidthPx, boxHeightPx, minSize, maxSize);
    const cached = wrapFitCache.get(cacheKey);
    if (cached)
    {
        text.setWordWrapWidth(cached.bestWrapWidth);
        text.setFontSize(cached.bestSize);
        return;
    }

    let bestSize = minSize;
    let bestWrapWidth = boxWidthPx;

    for (const fraction of WRAP_WIDTH_FRACTIONS)
    {
        const wrapWidth = boxWidthPx * fraction;
        text.setWordWrapWidth(wrapWidth);
        maximizeTextToBox(text, boxWidthPx, boxHeightPx, minSize, maxSize);

        const size = parseInt(text.style.fontSize as string, 10);
        if (size > bestSize)
        {
            bestSize = size;
            bestWrapWidth = wrapWidth;
        }
    }

    text.setWordWrapWidth(bestWrapWidth);
    text.setFontSize(bestSize);
    wrapFitCache.set(cacheKey, { bestSize, bestWrapWidth });
}

/** Centers the text on its box at `baseSizeRatio` × card height, shrunk to fit. */
export function layoutBoxText(text: Phaser.GameObjects.Text, box: CardBox, width: number, height: number, baseSizeRatio: number): void
{
    const boxWidthPx = (box.width / 100) * width;
    const boxHeightPx = (box.height / 100) * height;
    const offset = boxCenterOffset(box, width, height);
    text.setPosition(offset.x, offset.y);
    text.setFontSize(Math.round(height * baseSizeRatio));
    fitTextToBox(text, boxWidthPx, boxHeightPx);
}

/** Fills the box with the image, center-cropping the overflowing axis ("cover"). */
export function layoutBoxImage(image: Phaser.GameObjects.Image, box: CardBox, width: number, height: number): void
{
    const boxWidthPx = (box.width / 100) * width;
    const boxHeightPx = (box.height / 100) * height;
    const offset = boxCenterOffset(box, width, height);
    image.setPosition(offset.x, offset.y);

    const source = image.frame;
    const boxRatio = boxWidthPx / boxHeightPx;
    const sourceRatio = source.width / source.height;

    let cropWidth = source.width;
    let cropHeight = source.height;
    if (sourceRatio > boxRatio)
        cropWidth = source.height * boxRatio;
    else
        cropHeight = source.width / boxRatio;

    image.setCrop((source.width - cropWidth) / 2, (source.height - cropHeight) / 2, cropWidth, cropHeight);
    image.setScale(boxWidthPx / cropWidth, boxHeightPx / cropHeight);
}
