// Pure geometry shared by CardRow (minion positions) and Board (matching Target zone positions),
// so the two always agree on where a board slot sits regardless of row length.

const CARD_ASPECT_RATIO = 1.4;
const CARD_SPACING_ON_BOARD = 1.05;

export function computeXs(count: number, height: number, centerX: number, slotSizeRatio: number): number[]
{
    if (count === 0)
        return [];
    const slotSize = height * slotSizeRatio;
    const spacing = slotSize * CARD_SPACING_ON_BOARD;
    const totalWidth = (count - 1) * spacing + slotSize;
    const startX = centerX - totalWidth / 2;
    const xs: number[] = [];
    for (let i = 0; i < count; i++)
        xs.push(startX + i * spacing + slotSize * CARD_ASPECT_RATIO / 3);
    return xs;
}
