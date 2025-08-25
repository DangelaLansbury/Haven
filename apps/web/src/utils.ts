import * as fuzz from 'fuzzball';
import { GILTI_RATE } from './types';

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

export function extractBelow(
  words: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }>,
  labelKeyword: string,
  opts?: {
    xPad?: number; // widen label's column window
    minXOverlap?: number; // how much x-overlap to require (0..1)
    rowSlackMult?: number; // expand the row band upward (in word-heights)
    rowHeightMult?: number; // thickness of the row band (in word-heights)
    similarityThreshold?: number; // fuzzy match threshold for label
  }
): number | null {
  const normalize = (t: string) => t.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  // 1) anchor on the specific label WORD (handles multiple labels on one line)
  const similarityThreshold = opts?.similarityThreshold ?? 80;
  const label = words.find((w) => fuzz.ratio(normalize(w.text), labelKeyword) >= similarityThreshold);
  if (!label) return null;

  const kb = label.bbox;
  const xPad = opts?.xPad ?? 16;
  const minXOverlap = opts?.minXOverlap ?? 0.25;

  // estimate typical word height
  const hs = words
    .map((w) => w.bbox.y1 - w.bbox.y0)
    .filter((h) => h > 0)
    .sort((a, b) => a - b);
  const medH = hs.length ? hs[Math.floor(hs.length / 2)] : 16;

  // 2) find the first word *below* the label → defines the row’s y
  const below = words.filter((w) => w.bbox.y0 > kb.y1);
  if (!below.length) return null;
  const firstY0 = Math.min(...below.map((w) => w.bbox.y0));

  const rowSlackMult = opts?.rowSlackMult ?? 0.25; // a little cushion upward
  const rowHeightMult = opts?.rowHeightMult ?? 1.2; // band thickness
  const rowTop = firstY0 - rowSlackMult * medH;
  const rowBottom = firstY0 + rowHeightMult * medH;

  const colWindow = { x0: kb.x0 - xPad, x1: kb.x1 + xPad };

  // 3) restrict to words in that row band
  const rowWords = words.filter((w) => w.bbox.y0 >= rowTop && w.bbox.y0 <= rowBottom);

  // 4) prefer numeric tokens that overlap the label’s column
  const alignedNums = rowWords
    .filter((w) => overlapRatioX(colWindow, w.bbox) >= minXOverlap)
    .map((w) => ({ w, n: parseNumeric(w.text) }))
    .filter((x) => x.n != null) as Array<{ w: (typeof words)[number]; n: number }>;

  if (alignedNums.length) {
    alignedNums.sort((a, b) => a.w.bbox.x0 - b.w.bbox.x0); // left-most
    return alignedNums[0].n!;
  }

  // 5) fallback: any numeric in the row band (left-most)
  const anyNums = rowWords.map((w) => ({ w, n: parseNumeric(w.text) })).filter((x) => x.n != null) as Array<{ w: (typeof words)[number]; n: number }>;

  if (anyNums.length) {
    anyNums.sort((a, b) => a.w.bbox.x0 - b.w.bbox.x0);
    return anyNums[0].n!;
  }

  return null;
}

export const formatDollars = (amount: number): { value: number; suffix: string } => {
  if (amount > 1000000000) {
    return {
      value: amount / 1000000000,
      suffix: 'B',
    };
  } else if (amount > 1000000) {
    return {
      value: amount / 1000000,
      suffix: 'M',
    };
  } else {
    return {
      value: amount,
      suffix: '',
    };
  }
};

export const formatPercentage = (value: number): number => {
  return Math.round(value * 100) / 100;
};

export const calcTotalETR = (ftr: number): { ftc: number; topUp: number; etr: number } => {
  const ftc = ftr * 0.8;
  const topUp = Math.max(GILTI_RATE - ftc, 0);
  const etr = ftr + topUp;
  return { ftc, topUp, etr };
};
