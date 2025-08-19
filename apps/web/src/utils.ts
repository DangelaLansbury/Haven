import fuzz from 'fuzzball';

// Parse a numeric-looking token ($, commas, %, decimals)
export function parseNumeric(text: string): number | null {
  const m = text.match(/[-+]?\d{1,3}(?:,\d{3})*(?:\.\d+)?%?|\d+(?:\.\d+)?%?/);
  if (!m) return null;
  const raw = m[0].replace(/[%,$\s]/g, '').replace(/,/g, '');
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

// Horizontal overlap ratio relative to the narrower box (0..1)
export function overlapRatioX(a: { x0: number; x1: number }, b: { x0: number; x1: number }) {
  const overlap = Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0));
  const minWidth = Math.max(1, Math.min(a.x1 - a.x0, b.x1 - b.x0));
  return overlap / minWidth;
}

export function findValueBelow(
  lines: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }>,
  keyword: string,
  opts?: { xPad?: number; minXOverlap?: number; maxDyMult?: number; similarityThreshold?: number }
): number | null {
  // const normalize = (t: string) => t.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const similarityThreshold = opts?.similarityThreshold ?? 80;
  const label = lines.find((l) => fuzz.ratio(l.text, keyword) >= similarityThreshold);
  if (!label) return null;

  const kb = label.bbox;

  // Estimate a typical line height to define the “directly below” band
  const heights = lines.map((l) => l.bbox.y1 - l.bbox.y0).filter((h) => h > 0);
  const sorted = [...heights].sort((a, b) => a - b);
  const medH = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 16;

  const xPad = opts?.xPad ?? 8; // small horizontal tolerance
  const minXOverlap = opts?.minXOverlap ?? 0.4; // require 40% overlap with label’s x-window
  const maxDy = (opts?.maxDyMult ?? 2) * medH; // within ~2 line-heights below

  const colWindow = { x0: kb.x0 - xPad, x1: kb.x1 + xPad };

  // Candidates: below the label, within the first row band, overlapping its column
  const candidates = lines.filter((l) => {
    const lb = l.bbox;
    const dy = lb.y0 - kb.y1;
    if (dy <= 0 || dy > maxDy) return false;
    return overlapRatioX(colWindow, lb) >= minXOverlap;
  });

  if (!candidates.length) return null;

  // Choose the nearest by dy; tie-break by left-most
  candidates.sort((a, b) => {
    const ady = a.bbox.y0 - kb.y1;
    const bdy = b.bbox.y0 - kb.y1;
    if (ady !== bdy) return ady - bdy;
    return a.bbox.x0 - b.bbox.x0;
  });

  return parseNumeric(candidates[0].text.trim());
}

export function findValueBelowByWord(
  lines: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }>,
  words: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }>,
  keyword: string,
  opts?: { xPad?: number; minXOverlap?: number; maxDyMult?: number }
): number | null {
  const normalize = (t: string) => t.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const xPad = opts?.xPad ?? 12;
  const minXOverlap = opts?.minXOverlap ?? 0.25;

  const heights = lines.map((l) => l.bbox.y1 - l.bbox.y0).filter((h) => h > 0);
  const sorted = [...heights].sort((a, b) => a - b);
  const medH = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 16;
  const maxDy = (opts?.maxDyMult ?? 2.5) * medH;

  // Anchor on the specific label WORD (e.g., “revenue” or “royalties”)
  const labelWord = words.find((w) => fuzz.ratio(normalize(w.text), keyword) >= 80);
  if (!labelWord) return null;

  const kb = labelWord.bbox;
  const colWindow = { x0: kb.x0 - xPad, x1: kb.x1 + xPad };

  // First line “directly below”
  const candidateLines = lines
    .map((l) => ({ l, dy: l.bbox.y0 - kb.y1 }))
    .filter(({ dy }) => dy > 0 && dy <= maxDy)
    .sort((a, b) => a.dy - b.dy);

  if (candidateLines.length === 0) return null;
  const row = candidateLines[0].l;

  // Words in that row
  const rowWords = words.filter((w) => w.bbox.y0 >= row.bbox.y0 && w.bbox.y1 <= row.bbox.y1 + 1);

  console.log('findValueBelowByWordRow: ', row.text);

  // Prefer numeric word overlapping the label's column window
  const aligned = rowWords
    .filter((w) => overlapRatioX(colWindow, w.bbox) >= minXOverlap)
    .map((w) => ({ w, n: parseNumeric(w.text) }))
    .filter((x) => x.n != null) as Array<{ w: (typeof words)[number]; n: number }>;

  if (aligned.length > 0) {
    aligned.sort((a, b) => a.w.bbox.x0 - b.w.bbox.x0);
    return aligned[0].n!;
  }

  // Fallback: any numeric in the row (leftmost)
  const anyNumeric = rowWords.map((w) => ({ w, n: parseNumeric(w.text) })).filter((x) => x.n != null) as Array<{ w: (typeof words)[number]; n: number }>;

  if (anyNumeric.length > 0) {
    anyNumeric.sort((a, b) => a.w.bbox.x0 - b.w.bbox.x0);
    return anyNumeric[0].n!;
  }

  return null;
}

/**
 * Word-anchored "next band" extractor.
 * Anchors on a label WORD (e.g., "revenue"), then:
 *   1) finds the first row by *words* below the label (smallest y0 > label.y1),
 *   2) builds a vertical band around that y using median word height,
 *   3) returns the left-most numeric token in that band whose x overlaps
 *      the label's column window (label.x +/- xPad).
 * Falls back to any numeric token in the band if no aligned numeric is found.
 */
export function findValueBelowByWordNextBand(
  words: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }>,
  keyword: string,
  opts?: { xPad?: number; minXOverlap?: number; rowSlackMult?: number; rowHeightMult?: number }
): number | null {
  const normalize = (t: string) => t.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  // 1) Find the label as a *word*
  const labelWord = words.find((w) => fuzz.ratio(normalize(w.text), keyword) >= 80);
  if (!labelWord) return null;

  const kb = labelWord.bbox;
  const xPad = opts?.xPad ?? 16;
  const minXOverlap = opts?.minXOverlap ?? 0.25;

  // Typical word height → size the row band
  const wordHeights = words.map((w) => w.bbox.y1 - w.bbox.y0).filter((h) => h > 0);
  const sorted = [...wordHeights].sort((a, b) => a - b);
  const medH = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 16;

  // 2) Next band: centered on the first word just below the label
  const below = words.filter((w) => w.bbox.y0 > kb.y1);
  if (below.length === 0) return null;
  const firstY0 = Math.min(...below.map((w) => w.bbox.y0));

  const rowSlackMult = opts?.rowSlackMult ?? 0.25; // expand upward a little to catch jitter
  const rowHeightMult = opts?.rowHeightMult ?? 1.2; // band thickness in multiples of medH
  const rowTop = firstY0 - rowSlackMult * medH;
  const rowBottom = firstY0 + rowHeightMult * medH;

  const colWindow = { x0: kb.x0 - xPad, x1: kb.x1 + xPad };

  // 3) Words in that band
  const rowWords = words.filter((w) => w.bbox.y0 >= rowTop && w.bbox.y0 <= rowBottom);

  // Prefer numeric tokens that overlap the label's column window
  const aligned = rowWords
    .filter((w) => overlapRatioX(colWindow, w.bbox) >= minXOverlap)
    .map((w) => ({ w, n: parseNumeric(w.text) }))
    .filter((x) => x.n != null) as Array<{ w: (typeof words)[number]; n: number }>;

  if (aligned.length > 0) {
    aligned.sort((a, b) => a.w.bbox.x0 - b.w.bbox.x0);
    return aligned[0].n!;
  }

  // Fallback: any numeric token in the band (left-most)
  const anyNumeric = rowWords.map((w) => ({ w, n: parseNumeric(w.text) })).filter((x) => x.n != null) as Array<{ w: (typeof words)[number]; n: number }>;

  if (anyNumeric.length > 0) {
    anyNumeric.sort((a, b) => a.w.bbox.x0 - b.w.bbox.x0);
    return anyNumeric[0].n!;
  }

  return null;
}
