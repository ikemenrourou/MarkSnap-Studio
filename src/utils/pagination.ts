/**
 * Height-driven pagination for MarkSnap Studio.
 *
 * A page only exists to keep ONE exported image inside the browser canvas
 * limits (and inside WeChat's "still looks sharp" range). Pagination therefore
 * packs as much content as physically fits into the safe pixel budget and only
 * breaks when the next block would overflow it. Markdown markers such as `---`
 * are visual dividers, never forced page breaks (unless the user explicitly
 * picks the "split by divider" mode).
 */

import { tokenizeMarkdownBlocks } from './markdownProcessor';

export type SplitMode = 'single' | 'auto-length' | 'h2' | 'hr';

/** Safe margin below the 16,384px Chrome/Safari single-dimension canvas limit. */
export const MAX_SAFE_PHYSICAL_HEIGHT = 15800;

/** iOS Safari starts failing above ~16.7M canvas pixels; keep a small margin. */
export const MAX_SAFE_CANVAS_AREA = 16_000_000;

/** Headroom for rounding and late-loading images. */
export const PAGE_SAFETY_RATIO = 0.97;

/** Minimum content height a page must be able to hold (never go below this). */
const MIN_CONTENT_HEIGHT = 480;

export interface PageBudget {
  logicalWidth: number;
  scale: number;
  physicalWidth: number;
  /** Hard ceiling of the exported image height, in physical pixels. */
  maxPhysicalHeight: number;
  /** Total logical height allowed for one page (chrome + padding + content). */
  maxLogicalHeight: number;
  /** Logical height left for markdown blocks after chrome & padding. */
  contentLogicalHeight: number;
}

/**
 * Derives the per-page height budget from the current canvas width and export
 * scale. Wider canvases get a shorter logical budget because the area limit
 * bites sooner.
 */
export function computePageBudget(
  logicalWidth: number,
  scale: number,
  chromeLogicalHeight = 0
): PageBudget {
  const safeWidth = Math.max(200, Math.round(logicalWidth || 380));
  const safeScale = Math.max(1, Math.min(4, scale || 3));
  const physicalWidth = Math.round(safeWidth * safeScale);

  const maxPhysicalHeight = Math.floor(
    Math.min(MAX_SAFE_PHYSICAL_HEIGHT, MAX_SAFE_CANVAS_AREA / physicalWidth)
  );
  const maxLogicalHeight = Math.floor(
    (maxPhysicalHeight / safeScale) * PAGE_SAFETY_RATIO
  );

  return {
    logicalWidth: safeWidth,
    scale: safeScale,
    physicalWidth,
    maxPhysicalHeight,
    maxLogicalHeight,
    contentLogicalHeight: Math.max(
      MIN_CONTENT_HEIGHT,
      maxLogicalHeight - Math.max(0, Math.round(chromeLogicalHeight))
    ),
  };
}

export interface ChromeMetrics {
  cardPadding: number;
  outerFramePadding: number;
  showMacWindowBar: boolean;
  macWindowBarByTheme?: boolean;
  showHeader: boolean;
  showFooter: boolean;
  footerHasText: boolean;
  footerHasQr: boolean;
  /** A page counter is appended to the footer whenever there is more than one page. */
  showPageIndicator: boolean;
}

/**
 * Mirrors the chrome formulas used by MarkdownCardCanvas so the budget we
 * subtract matches what actually gets rendered.
 */
export function estimateChromeLogicalHeight(m: ChromeMetrics): number {
  const pad = Math.max(0, m.cardPadding);
  let h = 0;

  // Outer frame padding + 1px border on both sides
  if (m.outerFramePadding > 0) h += m.outerFramePadding * 2 + 2;

  // Mac window bar: 12px padding * 2 + ~15px text + 1px border
  if (m.showMacWindowBar || m.macWindowBarByTheme) h += 40;

  // Header kicker: top pad + 14px bottom pad + ~16px text + 1px border
  if (m.showHeader) h += Math.max(16, Math.round(pad * 0.65)) + 14 + 16 + 1;

  // Card body padding (top + bottom)
  h += pad * 2;

  // Footer: 14px top pad + bottom pad + text block + 1px border
  if (m.showFooter || m.showPageIndicator) {
    const textBlock = m.showFooter && m.footerHasText ? 18 + 3 + 15 : 15;
    let footer = 14 + Math.max(16, Math.round(pad * 0.7)) + textBlock + 1;
    if (m.showFooter && m.footerHasQr) {
      footer = Math.max(footer, 14 + Math.max(16, Math.round(pad * 0.7)) + 48 + 8 + 1);
    }
    h += footer;
  }

  return h;
}

const CJK_RE =
  /[\u1100-\u115f\u2e80-\ua4cf\ua960-\ua97f\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/;

function textWidthPx(text: string, fontSize: number): number {
  let width = 0;
  for (const ch of text) {
    width += CJK_RE.test(ch) ? fontSize : fontSize * 0.55;
  }
  return width;
}

/**
 * Cheap pre-measurement estimate. Only used for the very first paint, before
 * the hidden measuring stage reports real pixel heights.
 */
export function estimateBlockHeight(
  block: string,
  contentWidth: number,
  fontSize: number,
  lineHeight: number
): number {
  const text = block.trim();
  if (!text) return 0;

  const width = Math.max(120, contentWidth);
  const linePx = fontSize * lineHeight;

  // Tables: header + separator + body rows
  if (/^\|/.test(text)) {
    const rows = text.split('\n').filter((l) => l.trim().startsWith('|'));
    const bodyRows = Math.max(1, rows.length - 2);
    return bodyRows * (Math.max(13, fontSize * 0.88) * 1.5 + 19) + 30;
  }

  // Fenced code / mermaid
  if (/^```/.test(text)) {
    const lines = Math.max(2, text.split('\n').length - 2);
    return lines * Math.max(13, Math.round(fontSize * 0.82)) * 1.6 + 62;
  }

  // Standalone image
  if (/^!\[[^\]]*\]\([^)]*\)$/.test(text)) {
    return width * 0.62 + fontSize;
  }

  // Headings
  const heading = text.match(/^(#{1,6})\s+/);
  if (heading) {
    const level = heading[1].length;
    const scale = level === 1 ? 1.42 : level === 2 ? 1.22 : 1.08;
    const lines = Math.max(1, Math.ceil(textWidthPx(text, fontSize * scale) / width));
    return lines * fontSize * scale * 1.4 + fontSize * 1.2;
  }

  // Paragraphs / lists / quotes
  const isQuote = /^>/.test(text);
  const isList = /^\s*([-*+]|\d+\.)\s+/.test(text);
  const plain = text.replace(/^\s*(>\s*|[-*+]\s+|\d+\.\s+)/gm, '');
  const lines = plain
    .split('\n')
    .reduce(
      (sum, line) => sum + Math.max(1, Math.ceil(textWidthPx(line, fontSize) / width)),
      0
    );

  const quotePad = isQuote ? 28 + 2 : 0;
  const listPad = isList ? fontSize * 0.4 : 0;
  return lines * linePx + fontSize * 0.95 + quotePad + listPad;
}

export interface PaginationOptions {
  markdown: string;
  mode: SplitMode;
  budget: PageBudget;
  /** Measured logical block heights, aligned with tokenizeMarkdownBlocks(). */
  blockHeights?: number[] | null;
  contentWidth: number;
  fontSize: number;
  lineHeight: number;
  /** Optional hard character cap per page (advanced override). */
  charCap?: number | null;
}

export interface PaginationResult {
  pages: string[];
  pageHeights: number[];
  /** True when real measured heights were used instead of estimates. */
  measured: boolean;
  budgetLogicalHeight: number;
  /** Blocks that alone exceeded the budget and had to be sliced. */
  slicedBlocks: number;
}

interface Unit {
  text: string;
  height: number;
  chars: number;
  isHeading: boolean;
  isDivider: boolean;
  forceBreakBefore: boolean;
}

/** Splits a table body so every slice repeats the header row. */
function splitTableBlock(block: string, parts: number): string[] {
  const lines = block.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 4) return [block];
  const header = lines.slice(0, 2);
  const body = lines.slice(2);
  const perSlice = Math.ceil(body.length / Math.max(2, parts));
  const out: string[] = [];
  for (let i = 0; i < body.length; i += perSlice) {
    out.push([...header, ...body.slice(i, i + perSlice)].join('\n'));
  }
  return out;
}

/** Splits a fenced code block, re-wrapping every slice in the same fence. */
function splitCodeBlock(block: string, parts: number): string[] {
  const match = block.match(/^```([a-zA-Z0-9_-]*)\n([\s\S]*?)```\s*$/);
  if (!match) return [block];
  const lang = match[1] || '';
  const body = match[2].replace(/\n$/, '').split('\n');
  if (body.length < 4) return [block];
  const perSlice = Math.ceil(body.length / Math.max(2, parts));
  const out: string[] = [];
  for (let i = 0; i < body.length; i += perSlice) {
    out.push('```' + lang + '\n' + body.slice(i, i + perSlice).join('\n') + '\n```');
  }
  return out;
}

/** Splits prose at line boundaries, falling back to sentence boundaries. */
function splitProseBlock(block: string, parts: number): string[] {
  const lines = block.split('\n');
  if (lines.length >= parts * 2) {
    const perSlice = Math.ceil(lines.length / parts);
    const out: string[] = [];
    for (let i = 0; i < lines.length; i += perSlice) {
      const slice = lines.slice(i, i + perSlice).join('\n').trim();
      if (slice) out.push(slice);
    }
    return out.length > 1 ? out : [block];
  }

  const text = block.trim();
  const sentences = text.split(/(?<=[。！？!?；;])\s*/);
  if (sentences.length < 2) {
    // Last resort: hard slice by character count
    const perSlice = Math.ceil(text.length / parts);
    const out: string[] = [];
    for (let i = 0; i < text.length; i += perSlice) {
      out.push(text.slice(i, i + perSlice));
    }
    return out;
  }
  const perSlice = Math.ceil(sentences.length / parts);
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += perSlice) {
    const slice = sentences.slice(i, i + perSlice).join('').trim();
    if (slice) out.push(slice);
  }
  return out.length > 1 ? out : [block];
}

function sliceOversizedBlock(
  block: string,
  height: number,
  budgetHeight: number
): string[] {
  const parts = Math.max(2, Math.ceil(height / budgetHeight));
  const trimmed = block.trim();
  if (/^\|/.test(trimmed)) return splitTableBlock(trimmed, parts);
  if (/^```/.test(trimmed)) return splitCodeBlock(trimmed, parts);
  return splitProseBlock(trimmed, parts);
}

function buildUnits(
  blocks: string[],
  heights: number[],
  budgetHeight: number,
  mode: SplitMode
): { units: Unit[]; sliced: number } {
  const units: Unit[] = [];
  let sliced = 0;
  let headingSeen = false;
  let pendingBreak = false;

  blocks.forEach((block, index) => {
    const text = block.trim();
    if (!text) return;

    const isDivider = /^(-{3,}|\*{3,}|_{3,})$/.test(text);
    const isH2 = /^##\s+/.test(text);
    const isHeading = /^#{1,6}\s+/.test(text);
    const height = Math.max(0, heights[index] ?? 0);

    // Section-aligned modes turn markers into hard boundaries.
    if (mode === 'hr' && isDivider) {
      if (units.length > 0) pendingBreak = true;
      return; // divider is consumed as a page break
    }

    const forceBreakBefore =
      pendingBreak || (mode === 'h2' && isH2 && headingSeen);
    pendingBreak = false;
    if (isHeading) headingSeen = true;

    if (height > budgetHeight && !isDivider) {
      const slices = sliceOversizedBlock(text, height, budgetHeight);
      const sliceHeight = height / slices.length;
      sliced += 1;
      slices.forEach((slice, i) => {
        units.push({
          text: slice,
          height: sliceHeight,
          chars: slice.length,
          isHeading: false,
          isDivider: false,
          forceBreakBefore: i === 0 ? forceBreakBefore : false,
        });
      });
      return;
    }

    units.push({
      text,
      height,
      chars: text.length,
      isHeading,
      isDivider,
      forceBreakBefore,
    });
  });

  return { units, sliced };
}

function packUnits(
  units: Unit[],
  budgetHeight: number,
  charCap: number | null,
  mode: SplitMode
): number[][] {
  const pages: number[][] = [];
  let current: number[] = [];
  let currentHeight = 0;
  let currentChars = 0;

  // A short H1 intro should travel with the first section instead of sitting
  // alone on a card of its own.
  const isShortIntroOnly = (page: number[]) =>
    mode === 'h2' &&
    page.length === 1 &&
    units[page[0]].isHeading &&
    units[page[0]].chars < 120 &&
    /^#\s/.test(units[page[0]].text);

  const flush = () => {
    if (current.length > 0) {
      pages.push(current);
      current = [];
      currentHeight = 0;
      currentChars = 0;
    }
  };

  units.forEach((unit, index) => {
    if (
      unit.forceBreakBefore &&
      current.length > 0 &&
      !isShortIntroOnly(current)
    ) {
      flush();
    }

    const heightOverflow = currentHeight + unit.height > budgetHeight;
    // The character cap is an advanced safety override: it only kicks in once
    // the page is already substantially full, so it can never shred a doc on
    // its own.
    const charOverflow =
      charCap != null &&
      charCap > 0 &&
      currentChars + unit.chars > charCap &&
      currentHeight > budgetHeight * 0.5;

    if (current.length > 0 && (heightOverflow || charOverflow)) flush();

    current.push(index);
    currentHeight += unit.height;
    currentChars += unit.chars;
  });

  flush();
  return pages;
}

/** Never leave a heading dangling on the last line of a page. */
function fixOrphanHeadings(pages: number[][], units: Unit[]): number[][] {
  for (let p = 0; p < pages.length - 1; p++) {
    let guard = 0;
    while (
      pages[p].length > 1 &&
      units[pages[p][pages[p].length - 1]].isHeading &&
      guard < 3
    ) {
      const moved = pages[p].pop() as number;
      pages[p + 1].unshift(moved);
      guard += 1;
    }
  }
  return pages;
}

/** Avoid a lonely last page holding one short paragraph. */
function rebalanceTail(pages: number[][], units: Unit[], budgetHeight: number): number[][] {
  if (pages.length < 2) return pages;
  const heightOf = (page: number[]) =>
    page.reduce((sum, i) => sum + units[i].height, 0);

  let guard = 0;
  while (guard < 20) {
    const last = pages[pages.length - 1];
    const prev = pages[pages.length - 2];
    if (!prev || prev.length <= 1) break;

    const lastHeight = heightOf(last);
    if (lastHeight > budgetHeight * 0.35) break;

    const candidate = prev[prev.length - 1];
    const candidateHeight = units[candidate].height;
    const prevAfter = heightOf(prev) - candidateHeight;

    // Only steal a block if the donor page still looks substantial.
    if (prevAfter < budgetHeight * 0.55) break;
    if (lastHeight + candidateHeight > budgetHeight) break;

    prev.pop();
    last.unshift(candidate);
    guard += 1;
  }

  return pages;
}

/**
 * Packs markdown into the minimum number of pages that each stay inside the
 * safe export budget.
 */
export function paginateMarkdown(opts: PaginationOptions): PaginationResult {
  const {
    markdown,
    mode,
    budget,
    blockHeights,
    contentWidth,
    fontSize,
    lineHeight,
    charCap = null,
  } = opts;

  const trimmed = markdown.trim();
  const budgetHeight = budget.contentLogicalHeight;

  if (!trimmed) {
    return {
      pages: [''],
      pageHeights: [0],
      measured: false,
      budgetLogicalHeight: budgetHeight,
      slicedBlocks: 0,
    };
  }

  const blocks = tokenizeMarkdownBlocks(trimmed);
  const measured =
    Array.isArray(blockHeights) && blockHeights.length === blocks.length;

  const heights = blocks.map((block, index) =>
    measured
      ? Math.max(0, (blockHeights as number[])[index])
      : estimateBlockHeight(block, contentWidth, fontSize, lineHeight)
  );

  if (mode === 'single') {
    return {
      pages: [trimmed],
      pageHeights: [heights.reduce((a, b) => a + b, 0)],
      measured,
      budgetLogicalHeight: budgetHeight,
      slicedBlocks: 0,
    };
  }

  const { units, sliced } = buildUnits(blocks, heights, budgetHeight, mode);

  if (units.length === 0) {
    return {
      pages: [trimmed],
      pageHeights: [0],
      measured,
      budgetLogicalHeight: budgetHeight,
      slicedBlocks: sliced,
    };
  }

  let pageIndexes = packUnits(units, budgetHeight, charCap, mode);
  pageIndexes = fixOrphanHeadings(pageIndexes, units);
  pageIndexes = rebalanceTail(pageIndexes, units, budgetHeight);

  const pages = pageIndexes.map((indexes) =>
    indexes.map((i) => units[i].text).join('\n\n').trim()
  );
  const pageHeights = pageIndexes.map((indexes) =>
    indexes.reduce((sum, i) => sum + units[i].height, 0)
  );

  return {
    pages: pages.length > 0 ? pages : [trimmed],
    pageHeights,
    measured,
    budgetLogicalHeight: budgetHeight,
    slicedBlocks: sliced,
  };
}
