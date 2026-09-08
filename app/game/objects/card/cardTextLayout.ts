import Phaser from "phaser";
import { CardBox, CARD_ATTACK_BOX, CARD_COST_BOX, CARD_COST_BOX_SPELL, CARD_HEALTH_BOX } from "@/lib/cardLayout";

// Mana/ATK/DEF boxes are grown a bit larger than the ones shared with the DOM renderer
// (CardFace.tsx, cardLayout.ts) — in-game cards render much smaller (hand, board) than on the
// collection screen, so these numbers need more room to stay legible. Re-centered on the same
// point as the original box so they don't drift off the icon.
function growBox(box: CardBox, extraWidth: number, extraHeight: number): CardBox
{
    return {
        left: box.left - extraWidth / 2,
        top: box.top - extraHeight / 2,
        width: box.width + extraWidth,
        height: box.height + extraHeight,
    };
}

export const GAME_COST_BOX = growBox(CARD_COST_BOX, 5, 5);
export const GAME_COST_BOX_SPELL = growBox(CARD_COST_BOX_SPELL, 5, 5);
export const GAME_ATTACK_BOX = growBox(CARD_ATTACK_BOX, 5, 5);
export const GAME_HEALTH_BOX = growBox(CARD_HEALTH_BOX, 5, 5);

export function boxCenterOffset(box: CardBox, width: number, height: number): { x: number; y: number }
{
    return {
        x: ((box.left + box.width / 2) / 100) * width - width / 2,
        y: ((box.top + box.height / 2) / 100) * height - height / 2,
    };
}

// Shrinks `text`'s font size until it fits its box (measured in pixels, not %).
export function fitTextToBox(text: Phaser.GameObjects.Text, boxWidthPx: number, boxHeightPx: number, minSize = 8): void
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

// Finds the largest font size (between minSize and maxSize) that still fits the box — unlike
// fitTextToBox, which only shrinks from a fixed starting point, this grows or shrinks from the
// current size to maximize use of the available space (useful for the name, whose length varies
// a lot from card to card).
export function maximizeTextToBox(text: Phaser.GameObjects.Text, boxWidthPx: number, boxHeightPx: number, minSize = 8, maxSize = 200): void
{
    const fits = (size: number): boolean =>
    {
        text.setFontSize(size);
        return text.width <= boxWidthPx && text.height <= boxHeightPx;
    };

    if (!fits(minSize))
    {
        text.setFontSize(minSize);
        return;
    }

    let size = minSize;
    while (size < maxSize && fits(size + 1))
        size++;

    text.setFontSize(size);
}

// Wrap widths tried by maximizeWrappedTextToBox, as a fraction of the box width — 1 = a single
// line (Phaser's natural wrap), and each subsequent value forces progressively more lines.
const WRAP_WIDTH_FRACTIONS = [1, 0.8, 0.65, 0.5, 0.4];

// Like maximizeTextToBox, but also tries several wrap widths (i.e. more or fewer lines) and keeps
// whichever yields the largest font — a short/wide text often bottlenecked by the WIDTH of a
// single line can end up much bigger once spread over 2-3 narrower lines that use the box's
// remaining height.
export function maximizeWrappedTextToBox(text: Phaser.GameObjects.Text, boxWidthPx: number, boxHeightPx: number, minSize = 8, maxSize = 200): void
{
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
}

// Centers `text` on `box` and shrinks it to fit — combines boxCenterOffset + fitTextToBox.
export function layoutBoxText(text: Phaser.GameObjects.Text, box: CardBox, width: number, height: number, baseSizeRatio: number): void
{
    const boxWidthPx = (box.width / 100) * width;
    const boxHeightPx = (box.height / 100) * height;
    const offset = boxCenterOffset(box, width, height);
    text.setPosition(offset.x, offset.y);
    text.setFontSize(Math.round(height * baseSizeRatio));
    fitTextToBox(text, boxWidthPx, boxHeightPx);
}

// CSS "cover"-style fit: each source illustration's aspect ratio never exactly matches the box's,
// so instead of fitting the whole image inside the box (leaving empty space on one axis), this
// fills the box completely, center-cropping the excess on whichever axis overflows. The crop is
// applied in source pixel space (setCrop) before setDisplaySize, so the final stretch to the box's
// exact dimensions doesn't distort it.
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
    image.setDisplaySize(boxWidthPx, boxHeightPx);
}
