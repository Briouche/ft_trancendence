import Phaser from "phaser";
import { CardBox } from "@/lib/cardLayout";

export function boxCenterOffset(box: CardBox, width: number, height: number): { x: number; y: number }
{
    return {
        x: ((box.left + box.width / 2) / 100) * width - width / 2,
        y: ((box.top + box.height / 2) / 100) * height - height / 2,
    };
}

// Rétrécit la police de `text` jusqu'à ce qu'il tienne dans sa case (mesurée en pixels, pas en %)
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

// Trouve la plus grande taille de police (entre minSize et maxSize) qui tient encore dans la
// case — contrairement à fitTextToBox, qui ne fait que rétrécir depuis un point de départ fixe,
// celle-ci grandit ou rétrécit depuis la taille courante pour maximiser l'usage de l'espace
// disponible (utile pour le nom, dont la longueur varie beaucoup d'une carte à l'autre).
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

// Largeurs de retour à la ligne essayées par maximizeWrappedTextToBox, en fraction de la largeur
// de la case — 1 = une seule ligne (retour naturel de Phaser), les suivantes forcent de plus en
// plus de lignes.
const WRAP_WIDTH_FRACTIONS = [1, 0.8, 0.65, 0.5, 0.4];

// Comme maximizeTextToBox, mais essaie aussi plusieurs largeurs de retour à la ligne (donc plus
// ou moins de lignes) et garde celle qui permet la plus grande police — un texte court/large
// souvent bridé par la LARGEUR d'une seule ligne peut devenir bien plus gros une fois réparti sur
// 2-3 lignes plus étroites, qui utilisent la hauteur encore disponible dans la case.
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

// Repositionne `text` au centre de `box` et le redimensionne pour qu'il y tienne — combine
export function layoutBoxText(text: Phaser.GameObjects.Text, box: CardBox, width: number, height: number, baseSizeRatio: number): void
{
    const boxWidthPx = (box.width / 100) * width;
    const boxHeightPx = (box.height / 100) * height;
    const offset = boxCenterOffset(box, width, height);
    text.setPosition(offset.x, offset.y);
    text.setFontSize(Math.round(height * baseSizeRatio));
    fitTextToBox(text, boxWidthPx, boxHeightPx);
}

// "Cover" à la CSS : chaque illustration source a son propre ratio (voir CardAssetLoader.ts), qui
// ne colle jamais exactement à celui de la case. Plutôt que de la faire tenir entière dans la case
// (quitte à laisser du vide sur un axe), on la fait toujours remplir la case en entier, en rognant
// l'excédent — centré, donc symétrique — sur l'axe qui dépasse. Le rognage se fait en repère
// source (setCrop, avant setDisplaySize) : une fois la zone recadrée à ce ratio, l'étirer aux
// dimensions exactes de la case ne déforme plus rien.
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
