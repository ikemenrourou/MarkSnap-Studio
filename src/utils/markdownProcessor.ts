export interface CleanseOptions {
  stripAiPreamble?: boolean;
  normalizeSpacing?: boolean;
  stripBareUrls?: boolean;
  convertWideTablesToCards?: boolean;
}

export type SplitMode = 'single' | 'hr' | 'h2' | 'auto-length';

export interface CanvasExportMetrics {
  logicalWidth: number;
  estimatedHeight: number;
  requestedScale: number;
  effectiveScale: number;
  physicalWidth: number;
  physicalHeight: number;
  aspectRatio: number;
  estimatedPngSizeKB: number;
  estimatedJpgSizeKB: number;
  autoScaledDown: boolean;
  wechatStatus: 'optimal' | 'recommend-original' | 'ultra-long-warning';
  wechatTip: string;
}

export interface DocumentStats {
  charCount: number;
  wordAndCjkCount: number;
  headingCount: number;
  tableCount: number;
  codeBlockCount: number;
  readingMinutes: number;
}

const MAX_SAFE_CANVAS_DIMENSION = 15800; // Safe margin below 16,384px mobile/Safari/Chrome canvas limit

/**
 * Cleanses AI-generated Markdown text for mobile card/long-image presentation.
 */
export function cleanseAiMarkdown(raw: string, options: CleanseOptions = {}): string {
  const {
    stripAiPreamble = true,
    normalizeSpacing = true,
    stripBareUrls = false,
    convertWideTablesToCards = false,
  } = options;

  let text = raw.replace(/\r\n/g, '\n');

  if (stripAiPreamble) {
    // Strip typical conversational openings from ChatGPT/Claude/DeepSeek
    const preamblePatterns = [
      /^(好的|没问题|当然可以|为您整理|以下是|这是为您)[，,：:！!][^\n]*\n+/i,
      /^(Here is|Sure!|Certainly!|Below is)[^\n]*\n+/i,
    ];
    for (const pattern of preamblePatterns) {
      text = text.replace(pattern, '');
    }

    // Strip typical conversational closings at the end
    const postamblePatterns = [
      /\n+(希望以上(内容|信息|建议|回答)对(您|你|父母|家人)有(所)?帮助[^\n]*|祝(您|你|家人)[^\n]*|如果(您|你)还有其他问题[^\n]*)\s*$/i,
    ];
    for (const pattern of postamblePatterns) {
      text = text.replace(pattern, '');
    }
  }

  if (stripBareUrls) {
    // Convert [label](https://...) to label (outside code blocks)
    text = transformOutsideCodeBlocks(text, (segment) => {
      return segment
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
        .replace(/(?<![(\w])https?:\/\/[^\s)\]]+/g, '');
    });
  }

  if (convertWideTablesToCards) {
    text = transformOutsideCodeBlocks(text, (segment) => {
      return convertMarkdownTablesToList(segment, 3);
    });
  }

  if (normalizeSpacing) {
    text = transformOutsideCodeBlocks(text, (segment) => {
      return segment.replace(/\n{3,}/g, '\n\n');
    });
    text = text.trim();
  }

  return text;
}

/**
 * Helper to apply transformations only outside fenced code blocks.
 */
export function transformOutsideCodeBlocks(
  markdown: string,
  transformer: (nonCodeSegment: string) => string
): string {
  const parts: string[] = [];
  const codeBlockRegex = /```[\s\S]*?```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    if (match.index > lastIndex) {
      parts.push(transformer(markdown.slice(lastIndex, match.index)));
    }
    parts.push(match[0]);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < markdown.length) {
    parts.push(transformer(markdown.slice(lastIndex)));
  }

  return parts.join('');
}

/**
 * Converts Markdown tables with >= minCols into mobile-friendly structured bullet cards.
 */
export function convertMarkdownTablesToList(segment: string, minCols = 3): string {
  const lines = segment.split('\n');
  const out: string[] = [];
  let i = 0;

  const parseRow = (line: string): string[] =>
    line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());

  const isSeparatorRow = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed.includes('|') || !trimmed.includes('-')) return false;
    const cells = parseRow(trimmed);
    return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));
  };

  while (i < lines.length) {
    const line = lines[i];
    const nextLine = lines[i + 1];

    if (
      line &&
      line.trim().startsWith('|') &&
      nextLine &&
      isSeparatorRow(nextLine)
    ) {
      const headers = parseRow(line);
      const dataRows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && lines[j].trim().startsWith('|')) {
        dataRows.push(parseRow(lines[j]));
        j++;
      }

      if (headers.length >= minCols && dataRows.length > 0) {
        out.push('');
        for (const row of dataRows) {
          const title = row[0] || '条目';
          const details = headers
            .slice(1)
            .map((h, idx) => {
              const val = row[idx + 1];
              return val ? `**${h}**：${val}` : '';
            })
            .filter(Boolean)
            .join(' ｜ ');
          out.push(`- **${title}** — ${details}`);
        }
        out.push('');
        i = j;
        continue;
      }
    }

    out.push(line);
    i++;
  }

  return out.join('\n');
}

/**
 * Splits Markdown into 1 or more pages safely without breaking fenced code blocks or tables.
 */
export function splitMarkdownIntoPages(
  markdown: string,
  splitMode: SplitMode,
  maxCharsPerPage = 520
): string[] {
  const trimmed = markdown.trim();
  if (!trimmed) return [''];
  if (splitMode === 'single') return [trimmed];

  // Tokenize into top-level blocks (preserving fenced code blocks and tables together)
  const blocks = tokenizeMarkdownBlocks(trimmed);

  if (splitMode === 'hr') {
    const pages: string[] = [];
    let current: string[] = [];
    for (const block of blocks) {
      if (/^(---|\*\*\*|___)\s*$/.test(block.trim())) {
        if (current.length > 0) {
          pages.push(current.join('\n\n').trim());
          current = [];
        }
      } else {
        current.push(block);
      }
    }
    if (current.length > 0) {
      pages.push(current.join('\n\n').trim());
    }
    return pages.length > 0 ? pages : [trimmed];
  }

  if (splitMode === 'h2') {
    const pages: string[] = [];
    let current: string[] = [];
    for (const block of blocks) {
      const isH2 = /^##\s+/.test(block.trim());
      if (isH2 && current.length > 0) {
        const joined = current.join('\n\n').trim();
        // Keep short title-only intro together with the first H2 section
        const isOnlyShortH1 =
          pages.length === 0 &&
          current.length <= 2 &&
          joined.length < 120 &&
          /^#\s+/.test(joined);
        if (!isOnlyShortH1) {
          pages.push(joined);
          current = [block];
          continue;
        }
      }
      current.push(block);
    }
    if (current.length > 0) {
      pages.push(current.join('\n\n').trim());
    }
    return pages.length > 0 ? pages : [trimmed];
  }

  // 'auto-length' mode: pack blocks up to maxCharsPerPage
  const pages: string[] = [];
  let current: string[] = [];
  let currentLen = 0;

  for (const block of blocks) {
    if (/^(---|\*\*\*|___)\s*$/.test(block.trim())) {
      if (current.length > 0) {
        pages.push(current.join('\n\n').trim());
        current = [];
        currentLen = 0;
      }
      continue;
    }

    const blockLen = block.length;
    const isMajorHeading = /^#{1,2}\s+/.test(block.trim());

    if (
      current.length > 0 &&
      (currentLen + blockLen > maxCharsPerPage || (isMajorHeading && currentLen > maxCharsPerPage * 0.45))
    ) {
      pages.push(current.join('\n\n').trim());
      current = [block];
      currentLen = blockLen;
    } else {
      current.push(block);
      currentLen += blockLen;
    }
  }

  if (current.length > 0) {
    pages.push(current.join('\n\n').trim());
  }

  return pages.length > 0 ? pages : [trimmed];
}

/**
 * Splits markdown into atomic top-level blocks (keeping code blocks and tables intact).
 */
export function tokenizeMarkdownBlocks(markdown: string): string[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: string[] = [];
  let buffer: string[] = [];
  let inFence = false;
  let inTable = false;

  const flush = () => {
    if (buffer.length > 0) {
      const text = buffer.join('\n').trim();
      if (text) blocks.push(text);
      buffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (!inFence) {
        flush();
        inFence = true;
        buffer.push(line);
      } else {
        buffer.push(line);
        inFence = false;
        flush();
      }
      continue;
    }

    if (inFence) {
      buffer.push(line);
      continue;
    }

    // Table detection
    if (trimmed.startsWith('|')) {
      if (!inTable) {
        flush();
        inTable = true;
      }
      buffer.push(line);
      continue;
    } else if (inTable) {
      inTable = false;
      flush();
    }

    // Horizontal rule
    if (/^(---|\*\*\*|___)\s*$/.test(trimmed)) {
      flush();
      blocks.push('---');
      continue;
    }

    // Heading starts a new block
    if (/^#{1,6}\s+/.test(trimmed)) {
      flush();
      blocks.push(trimmed);
      continue;
    }

    // Blank line flushes current paragraph/list block
    if (trimmed === '') {
      flush();
      continue;
    }

    buffer.push(line);
  }

  flush();
  return blocks;
}

/**
 * Calculates physical export pixel dimensions, dynamic DPR protection, and WeChat compression advice.
 */
export function calculateCanvasExportMetrics(
  logicalWidth: number,
  estimatedHeight: number,
  requestedScale: number,
  forceSinglePage = true
): CanvasExportMetrics {
  const safeWidth = Math.max(280, Math.min(2400, logicalWidth || 400));
  const safeHeight = Math.max(200, estimatedHeight || 600);
  const desiredScale = Math.max(1, Math.min(4, requestedScale || 3));

  let effectiveScale = desiredScale;
  let autoScaledDown = false;

  if (safeHeight * effectiveScale > MAX_SAFE_CANVAS_DIMENSION) {
    effectiveScale = Math.max(
      1,
      Math.floor((MAX_SAFE_CANVAS_DIMENSION / safeHeight) * 10) / 10
    );
    autoScaledDown = effectiveScale < desiredScale;
  }

  const physicalWidth = Math.round(safeWidth * effectiveScale);
  const physicalHeight = Math.round(safeHeight * effectiveScale);
  const aspectRatio = Number((physicalHeight / physicalWidth).toFixed(1));
  const totalMegapixels = (physicalWidth * physicalHeight) / 1_000_000;

  // Empirical estimation for crisp text/markdown graphics
  const estimatedPngSizeKB = Math.max(45, Math.round(totalMegapixels * 185));
  const estimatedJpgSizeKB = Math.max(30, Math.round(totalMegapixels * 95));

  let wechatStatus: CanvasExportMetrics['wechatStatus'] = 'optimal';
  let wechatTip = '黄金物理宽度，微信普通发送与点开预览均保持锐利清晰';

  if (autoScaledDown) {
    wechatStatus = 'ultra-long-warning';
    wechatTip = `长图高度较大，已自动将倍率优化为 ${effectiveScale}x 以保障浏览器 Canvas 稳定渲染；微信发送时建议勾选「原图」`;
  } else if (aspectRatio > 6.5 || estimatedPngSizeKB > 6500) {
    wechatStatus = 'recommend-original';
    wechatTip = forceSinglePage
      ? `当前高宽比 ${aspectRatio}:1，一图流较长，发微信时勾选「原图」或切换 JPG 格式可完全避免缩略图模糊`
      : `当前图片较长（高宽比 ${aspectRatio}:1），可切换为「智能分页多图」或发送时勾选「原图」`;
  } else if (physicalWidth >= 1000 && physicalWidth <= 1440) {
    wechatStatus = 'optimal';
    wechatTip = `物理宽度 ${physicalWidth}px 处于手机端免压缩黄金区间，无需放大即可满屏清晰阅读`;
  }

  return {
    logicalWidth: safeWidth,
    estimatedHeight: safeHeight,
    requestedScale: desiredScale,
    effectiveScale,
    physicalWidth,
    physicalHeight,
    aspectRatio,
    estimatedPngSizeKB,
    estimatedJpgSizeKB,
    autoScaledDown,
    wechatStatus,
    wechatTip,
  };
}

/**
 * Extracts document statistics for studio footer/header badges.
 */
export function extractDocumentStats(markdown: string): DocumentStats {
  const clean = markdown.trim();
  if (!clean) {
    return {
      charCount: 0,
      wordAndCjkCount: 0,
      headingCount: 0,
      tableCount: 0,
      codeBlockCount: 0,
      readingMinutes: 0,
    };
  }

  const cjkMatches = clean.match(/[\u4e00-\u9fa5]/g) || [];
  const englishWords = clean
    .replace(/[\u4e00-\u9fa5]/g, ' ')
    .match(/[a-zA-Z0-9_-]+/g) || [];
  const wordAndCjkCount = cjkMatches.length + englishWords.length;

  const headingCount = (clean.match(/^#{1,6}\s+/gm) || []).length;
  const codeBlockCount = Math.floor((clean.match(/```/g) || []).length / 2);
  const tableCount = (clean.match(/^\|.*\|$/gm) || []).length > 0
    ? (clean.match(/^\|[\s:|-]+\|$/gm) || []).length
    : 0;

  const readingMinutes = Math.max(1, Math.ceil(wordAndCjkCount / 320));

  return {
    charCount: clean.length,
    wordAndCjkCount,
    headingCount,
    tableCount,
    codeBlockCount,
    readingMinutes,
  };
}

export interface SourceLocationMatch {
  startOffset: number;
  endOffset: number;
  lineNumber: number;
  matchedLine: string;
}

/**
 * Locates the corresponding line range in raw Markdown given a plain-text snippet
 * clicked inside the rendered preview card.
 */
export function findSourceOffsetBySnippet(
  markdown: string,
  clickedText: string
): SourceLocationMatch | null {
  const probe = clickedText.replace(/\s+/g, ' ').trim();
  if (!probe || !markdown) return null;

  const stripMdSyntax = (line: string): string =>
    line
      .replace(/^#{1,6}\s+/, '')
      .replace(/^>\s*/, '')
      .replace(/^[-*+]\s+/, '')
      .replace(/^\d+\.\s+/, '')
      .replace(/[*_`~|]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();

  const lines = markdown.split('\n');
  let offset = 0;
  const shortProbe = probe.slice(0, 24);

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const cleanedLine = stripMdSyntax(rawLine);

    if (
      cleanedLine.length >= 2 &&
      (cleanedLine.includes(shortProbe) ||
        shortProbe.includes(cleanedLine.slice(0, Math.max(6, cleanedLine.length))))
    ) {
      return {
        startOffset: offset,
        endOffset: offset + rawLine.length,
        lineNumber: i + 1,
        matchedLine: rawLine,
      };
    }

    offset += rawLine.length + 1;
  }

  return null;
}

