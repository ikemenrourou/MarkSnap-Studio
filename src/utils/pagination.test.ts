import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computePageBudget,
  estimateBlockHeight,
  estimateChromeLogicalHeight,
  paginateMarkdown,
  MAX_SAFE_CANVAS_AREA,
  MAX_SAFE_PHYSICAL_HEIGHT,
} from './pagination';
import { tokenizeMarkdownBlocks } from './markdownProcessor';

const budgetFor = (width = 380, scale = 3, chrome = 120) =>
  computePageBudget(width, scale, chrome);

const opts = (markdown: string, blockHeights?: number[], charCap?: number) => ({
  markdown,
  mode: 'auto-length' as const,
  budget: budgetFor(),
  blockHeights: blockHeights ?? null,
  contentWidth: 380 - 32,
  fontSize: 18,
  lineHeight: 1.75,
  charCap: charCap ?? null,
});

test('computePageBudget derives a physical budget from width and scale', () => {
  const phone = computePageBudget(380, 3, 0);
  assert.equal(phone.physicalWidth, 1140);
  assert.equal(
    phone.maxPhysicalHeight,
    Math.min(MAX_SAFE_PHYSICAL_HEIGHT, Math.floor(MAX_SAFE_CANVAS_AREA / 1140))
  );
  assert.ok(phone.contentLogicalHeight > 4000);
  assert.ok(phone.contentLogicalHeight < 5000);

  // Wider canvases hit the area limit sooner, so they get less logical height.
  const desktop = computePageBudget(820, 3, 0);
  assert.equal(desktop.physicalWidth, 2460);
  assert.ok(desktop.contentLogicalHeight < phone.contentLogicalHeight);
  assert.ok(desktop.contentLogicalHeight > 1500);
});

test('estimateChromeLogicalHeight accounts for padding, header and footer', () => {
  const bare = estimateChromeLogicalHeight({
    cardPadding: 16,
    outerFramePadding: 0,
    showMacWindowBar: false,
    showHeader: false,
    showFooter: false,
    footerHasText: false,
    footerHasQr: false,
    showPageIndicator: false,
  });
  assert.equal(bare, 32);

  const full = estimateChromeLogicalHeight({
    cardPadding: 16,
    outerFramePadding: 12,
    showMacWindowBar: true,
    showHeader: true,
    showFooter: true,
    footerHasText: true,
    footerHasQr: true,
    showPageIndicator: true,
  });
  assert.ok(full > bare + 150);
});

test('dividers (---) never force a page break in smart mode', () => {
  // 16 dividers + 16 short sections used to produce 16 cards.
  const lines: string[] = ['# 换季血压波动'];
  for (let i = 1; i <= 16; i++) {
    lines.push('---', `## 第 ${i} 小节`, `这是第 ${i} 节的正文内容，只有一行。`);
  }
  const markdown = lines.join('\n');
  const blocks = tokenizeMarkdownBlocks(markdown);
  // Every block is short enough that the whole document fits one page.
  const heights = blocks.map(() => 80);

  const result = paginateMarkdown(opts(markdown, heights));
  assert.equal(result.pages.length, 1);
  assert.ok(result.pages[0].includes('第 16 小节'));
  // Dividers are kept as visual rules, not swallowed.
  assert.ok(result.pages[0].includes('---'));
});

test('pages only split when the measured height overflows the budget', () => {
  const budget = budgetFor().contentLogicalHeight;
  const blocks = Array.from(
    { length: 10 },
    (_, i) => `第 ${i + 1} 段：${'正文内容。'.repeat(40)}`
  );
  const markdown = blocks.join('\n\n');
  const tokens = tokenizeMarkdownBlocks(markdown);
  assert.equal(tokens.length, 10);
  const perBlock = Math.floor(budget / 4); // exactly four blocks per page
  const heights = tokens.map(() => perBlock);

  const result = paginateMarkdown(opts(markdown, heights));
  assert.equal(result.pages.length, 3);
  result.pageHeights.forEach((h) => assert.ok(h <= budget));
});

test('a short document stays a single page', () => {
  const markdown = [
    '# 标题',
    '',
    '一段两百字左右的普通回答，用户只是想把 AI 的一段话存成长图。',
    '',
    '## 小标题',
    '',
    '再来一小段内容。',
  ].join('\n');

  const result = paginateMarkdown(opts(markdown));
  assert.equal(result.pages.length, 1);
  assert.equal(result.pages[0], markdown.trim());
});

test('tables and code fences are never cut in half when they fit', () => {
  const table = [
    '| 项目 | 频次 | 备注 |',
    '| --- | --- | --- |',
    '| 血压 | 每周2次 | 晨起空腹 |',
    '| 血糖 | 每月1次 | 空腹 |',
  ].join('\n');
  const code = ['```js', 'const a = "---";', 'console.log(a);', '```'].join('\n');
  const markdown = ['## 数据', table, '## 代码', code, '## 结尾', '普通段落。'].join(
    '\n\n'
  );
  const tokens = tokenizeMarkdownBlocks(markdown);
  const heights = tokens.map(() => 180);

  const result = paginateMarkdown(opts(markdown, heights));
  assert.equal(result.pages.length, 1);
  assert.ok(result.pages[0].includes('| 血糖 | 每月1次 | 空腹 |'));
  assert.ok(result.pages[0].includes('console.log(a);'));
});

test('an oversized table is sliced with the header repeated on every part', () => {
  const budget = budgetFor().contentLogicalHeight;
  const rows = Array.from({ length: 60 }, (_, i) => `| 行 ${i + 1} | 值 ${i + 1} |`);
  const table = ['| 名称 | 数值 |', '| --- | --- |', ...rows].join('\n');
  const markdown = ['## 大表', table].join('\n\n');
  const tokens = tokenizeMarkdownBlocks(markdown);
  const heights = tokens.map((_, i) => (i === 0 ? 120 : budget * 2.5));

  const result = paginateMarkdown(opts(markdown, heights));
  assert.ok(result.pages.length >= 3);
  // Every sliced page keeps the table header.
  const tablePages = result.pages.filter((p) => p.includes('| 名称 | 数值 |'));
  assert.ok(tablePages.length >= 2);
  assert.ok(result.pages.every((p) => !p.includes('| --- |\n| 名称')));
});

test('split-by-divider mode still honours explicit --- boundaries', () => {
  const markdown = ['## A', '内容一', '---', '## B', '内容二', '---', '## C', '内容三'].join(
    '\n\n'
  );
  const tokens = tokenizeMarkdownBlocks(markdown);
  const heights = tokens.map(() => 100);

  const result = paginateMarkdown({ ...opts(markdown, heights), mode: 'hr' });
  assert.equal(result.pages.length, 3);
  assert.ok(result.pages[0].includes('内容一'));
  assert.ok(result.pages[2].includes('内容三'));
});

test('split-by-heading mode keeps each ## section on its own page', () => {
  const markdown = ['# 总标题', '## 第一节', '内容一', '## 第二节', '内容二'].join('\n\n');
  const tokens = tokenizeMarkdownBlocks(markdown);
  const heights = tokens.map(() => 100);

  const result = paginateMarkdown({ ...opts(markdown, heights), mode: 'h2' });
  assert.equal(result.pages.length, 2);
  assert.ok(result.pages[0].includes('第一节'));
  assert.ok(result.pages[1].includes('第二节'));
});

test('character cap only kicks in as an advanced override', () => {
  const para = (i: number) => `第 ${i} 段：${'内容'.repeat(120)}`; // ~250 chars
  const markdown = Array.from({ length: 16 }, (_, i) => para(i + 1)).join('\n\n');
  const tokens = tokenizeMarkdownBlocks(markdown);
  const heights = tokens.map(() => 700);

  const wideOpen = paginateMarkdown(opts(markdown, heights, 20000));
  // A loose cap is a no-op: pages are decided purely by rendered height.
  assert.equal(wideOpen.pages.length, 3);

  const tight = paginateMarkdown(opts(markdown, heights, 600));
  // A tight cap can only shrink pages that are already more than half full.
  assert.ok(tight.pages.length > wideOpen.pages.length);
  tight.pages.forEach((page) => assert.ok(page.length > 0));
});

test('estimateBlockHeight scales with content and prefers tall structures', () => {
  const width = 348;
  const short = estimateBlockHeight('一句话。', width, 18, 1.75);
  const long = estimateBlockHeight('这是一段很长的中文内容。'.repeat(20), width, 18, 1.75);
  assert.ok(long > short);

  const table = estimateBlockHeight(
    ['| a | b |', '| --- | --- |', ...Array(10).fill('| x | y |')].join('\n'),
    width,
    18,
    1.75
  );
  assert.ok(table > long);
});
