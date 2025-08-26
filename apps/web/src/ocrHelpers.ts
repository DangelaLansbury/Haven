import * as fuzz from 'fuzzball';
import { Countries, CountryNames } from './types';

export const normalize = (t: string) => t.replace(/[^a-z0-9]/gi, '').toLowerCase();

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

function median(xs: number[]) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b),
    m = Math.floor(s.length / 2);
  return xs.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export type OcrBBox = { x0: number; y0: number; x1: number; y1: number };
export type OcrWord = { text: string; bbox: OcrBBox };

function medianWordHeight(words: OcrWord[]): number {
  return median(words.map((w) => w.bbox.y1 - w.bbox.y0).filter((h) => h > 0)) || 16;
}

function fuzzyFindLabel(words: OcrWord[], labelKeywords: string | string[], similarityThreshold = 80): OcrWord | null {
  const kws = Array.isArray(labelKeywords) ? labelKeywords.map(normalize) : [normalize(labelKeywords)];
  for (const w of words) {
    const t = normalize(w.text);
    for (const k of kws) {
      if (fuzz.ratio(t, k) >= similarityThreshold) return w;
    }
  }
  return null;
}

function columnWindowFor(b: OcrBBox, xPad = 16) {
  return { x0: b.x0 - xPad, x1: b.x1 + xPad };
}

type Row = { y0: number; y1: number; words: OcrWord[] };
function buildRows(words: OcrWord[], rowEpsMult = 0.4): Row[] {
  const hMed = medianWordHeight(words);
  const rowEps = rowEpsMult * hMed;
  const byY = [...words].sort((a, b) => (a.bbox.y0 + a.bbox.y1) / 2 - (b.bbox.y0 + b.bbox.y1) / 2);
  const rows: Row[] = [];
  for (const w of byY) {
    const yMid = (w.bbox.y0 + w.bbox.y1) / 2;
    const last = rows[rows.length - 1];
    if (!last || yMid - (last.y0 + last.y1) / 2 > rowEps) {
      rows.push({ y0: w.bbox.y0, y1: w.bbox.y1, words: [w] });
    } else {
      last.words.push(w);
      last.y0 = Math.min(last.y0, w.bbox.y0);
      last.y1 = Math.max(last.y1, w.bbox.y1);
    }
  }
  rows.forEach((r) => r.words.sort((a, b) => a.bbox.x0 - b.bbox.x0));
  return rows;
}

function bandForRow(y0: number, words: OcrWord[], rowSlackMult = 0.25, rowHeightMult = 1.2) {
  const hMed = medianWordHeight(words);
  return { top: y0 - rowSlackMult * hMed, bottom: y0 + rowHeightMult * hMed };
}

function wordsInBand(words: OcrWord[], top: number, bottom: number) {
  return words.filter((w) => w.bbox.y0 >= top && w.bbox.y0 <= bottom);
}

export function extractBelow(
  words: OcrWord[],
  labelKeyword: string,
  opts?: {
    xPad?: number;
    minXOverlap?: number;
    rowSlackMult?: number;
    rowHeightMult?: number;
    similarityThreshold?: number;
  }
): number | null {
  const label = fuzzyFindLabel(words, labelKeyword, opts?.similarityThreshold ?? 80);
  if (!label) return null;

  const xPad = opts?.xPad ?? 16;
  const minXOverlap = opts?.minXOverlap ?? 0.25;
  const colWindow = columnWindowFor(label.bbox, xPad);

  const belowAligned = words.filter((w) => w.bbox.y0 > label.bbox.y1 && overlapRatioX(colWindow, w.bbox) >= minXOverlap);
  const belowPool = belowAligned.length ? belowAligned : words.filter((w) => w.bbox.y0 > label.bbox.y1);
  if (!belowPool.length) return null;

  const firstY0 = Math.min(...belowPool.map((w) => w.bbox.y0));
  const { top, bottom } = bandForRow(firstY0, words, opts?.rowSlackMult ?? 0.25, opts?.rowHeightMult ?? 1.2);

  const rowWords = wordsInBand(words, top, bottom);

  const alignedNums = rowWords
    .filter((w) => overlapRatioX(colWindow, w.bbox) >= minXOverlap)
    .map((w) => ({ w, n: parseNumeric(w.text) }))
    .filter((x) => x.n != null) as Array<{ w: OcrWord; n: number }>;

  if (alignedNums.length) {
    alignedNums.sort((a, b) => a.w.bbox.x0 - b.w.bbox.x0);
    return alignedNums[0].n!;
  }

  const anyNums = rowWords.map((w) => ({ w, n: parseNumeric(w.text) })).filter((x) => x.n != null) as Array<{ w: OcrWord; n: number }>;

  if (anyNums.length) {
    anyNums.sort((a, b) => a.w.bbox.x0 - b.w.bbox.x0);
    return anyNums[0].n!;
  }
  return null;
}

export function extractTextColumnBelow(
  words: OcrWord[],
  labelKeywords: string | string[],
  opts?: {
    count?: number;
    stopWords?: string[];
    xPad?: number;
    minXOverlap?: number;
    rowEpsMult?: number;
    rowSlackMult?: number;
    rowHeightMult?: number;
    requireAlpha?: boolean;
    colWindowOverride?: { x0: number; x1: number };
  }
): string[] {
  const stop = (opts?.stopWords || []).map(normalize);
  const label = fuzzyFindLabel(words, labelKeywords, 80);
  if (!label) return [];

  const xPad = opts?.xPad ?? 16;
  const minXOverlap = opts?.minXOverlap ?? 0.25;
  const rows = buildRows(words, opts?.rowEpsMult ?? 0.4);
  const colWindow = opts?.colWindowOverride ?? columnWindowFor(label.bbox, xPad);

  const startIdx = rows.findIndex((r) => r.y0 > label.bbox.y1 - 1);
  if (startIdx < 0) return [];

  const want = opts?.count ?? Object.keys(CountryNames).length;
  const needAlpha = opts?.requireAlpha ?? true;
  const out: string[] = [];

  for (let i = startIdx; i < rows.length && out.length < want; i++) {
    const r = rows[i];
    const { top, bottom } = bandForRow(r.y0, words, opts?.rowSlackMult ?? 0.25, opts?.rowHeightMult ?? 1.2);
    const inBand = wordsInBand(r.words, top, bottom);

    let chosen = inBand.filter((w) => overlapRatioX(colWindow, w.bbox) >= minXOverlap);
    if (!chosen.length) chosen = inBand;

    let text = chosen
      .map((w) => w.text)
      .join(' ')
      .replace(/(?:\\.|•|·){2,}/g, ' ')
      .replace(/\\s{2,}/g, ' ')
      .trim();

    if (!text) continue;
    const lower = normalize(text);
    if (stop.length && stop.some((s) => lower.includes(s))) break;
    if (needAlpha && !/[A-Za-z]/.test(text)) continue;

    out.push(text);
  }
  return out;
}
