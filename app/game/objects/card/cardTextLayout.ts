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

// Largest font size in [minSize, maxSize] that fits the box.
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

const WRAP_WIDTH_FRACTIONS = [1, 0.8, 0.65, 0.5, 0.4];

// Like maximizeTextToBox, trying several wrap widths and keeping the one giving the largest font.
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

// Centers the text on its box at `baseSizeRatio` × card height, shrunk to fit.
export function layoutBoxText(text: Phaser.GameObjects.Text, box: CardBox, width: number, height: number, baseSizeRatio: number): void
{
    const boxWidthPx = (box.width / 100) * width;
    const boxHeightPx = (box.height / 100) * height;
    const offset = boxCenterOffset(box, width, height);
    text.setPosition(offset.x, offset.y);
    text.setFontSize(Math.round(height * baseSizeRatio));
    fitTextToBox(text, boxWidthPx, boxHeightPx);
}

// Fills the box with the image, center-cropping the overflowing axis ("cover").
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
