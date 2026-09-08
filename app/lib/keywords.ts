export const KEYWORD_LABELS: Record<string, string> = {
    RUEE:          'Ruée',
    RALE_DAGONIE:  "Râle d'agonie",
    CRI_DE_GUERRE: 'Cri de guerre',
    REGENERATION:  'Régénération',
    AVENTURIER:    'Aventurier',
    TAUNT:         'Taunt',
    SOIGNE:        'Soigné',
    VOL_DE_VIE:    'Vol de vie',
    SILENCE:       'Silence',
}

function normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export type TextSegment = { text: string; bold: boolean }

// Splits `desc` into segments, bolding the passages that match the card's keyword labels
// (case/accent-insensitive search, but the displayed text keeps its original casing/accents).
export function splitKeywordSegments(desc: string, keywords: string[]): TextSegment[] {
    if (keywords.length === 0) return [{ text: desc, bold: false }]

    const normDesc = normalize(desc)
    const ranges: Array<[number, number]> = []

    for (const kw of keywords) {
        const label = KEYWORD_LABELS[kw]
        if (!label) continue
        const normLabel = normalize(label)
        let from = 0
        while (true) {
            const at = normDesc.indexOf(normLabel, from)
            if (at === -1) break
            ranges.push([at, at + normLabel.length])
            from = at + normLabel.length
        }
    }

    if (ranges.length === 0) return [{ text: desc, bold: false }]

    ranges.sort((a, b) => a[0] - b[0])

    const segments: TextSegment[] = []
    let cursor = 0
    for (const [start, end] of ranges) {
        if (start < cursor) continue // skip overlaps
        if (start > cursor) segments.push({ text: desc.slice(cursor, start), bold: false })
        segments.push({ text: desc.slice(start, end), bold: true })
        cursor = end
    }
    if (cursor < desc.length) segments.push({ text: desc.slice(cursor), bold: false })

    return segments
}
