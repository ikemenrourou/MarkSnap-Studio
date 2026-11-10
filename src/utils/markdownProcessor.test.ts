import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanseAiMarkdown,
  calculateCanvasExportMetrics,
  extractDocumentStats,
  findSourceOffsetBySnippet,
} from './markdownProcessor';
import { renderMarkdownToHtml, renderMermaidToSvg } from './markdownRenderer';
import { convertHtmlToMarkdown } from './htmlToMarkdown';
import { CARD_THEMES } from './themes';

test('cleanseAiMarkdown removes AI conversational preamble and normalizes blank lines', () => {
  const input = `好的，为您整理如下：\n\n# 父母体检指南\n\n\n\n这是第一段内容。\n\n希望以上内容对您有帮助！`;
  const result = cleanseAiMarkdown(input, {
    stripAiPreamble: true,
    normalizeSpacing: true,
  });
  assert.equal(result, '# 父母体检指南\n\n这是第一段内容。');
});

test('cleanseAiMarkdown converts wide tables into structured list items when enabled', () => {
  const input = [
    '| 项目 | 频次 | 适用人群 | 备注 |',
    '| --- | --- | --- | --- |',
    '| 血压测量 | 每周2次 | 50岁以上 | 晨起空腹 |',
  ].join('\n');

  const converted = cleanseAiMarkdown(input, {
    convertWideTablesToCards: true,
  });
  assert.ok(converted.includes('- **血压测量**'));
  assert.ok(converted.includes('**频次**：每周2次'));
  assert.ok(converted.includes('**适用人群**：50岁以上'));
});

test('calculateCanvasExportMetrics enforces safe canvas height ceiling and computes physical size', () => {
  const standard = calculateCanvasExportMetrics(400, 1200, 3, true);
  assert.equal(standard.physicalWidth, 1200);
  assert.equal(standard.physicalHeight, 3600);
  assert.equal(standard.autoScaledDown, false);
  assert.equal(standard.wechatStatus, 'optimal');

  const ultraTall = calculateCanvasExportMetrics(400, 8000, 3, true);
  assert.equal(ultraTall.autoScaledDown, true);
  assert.ok(ultraTall.physicalHeight <= 15800);
  assert.equal(ultraTall.wechatStatus, 'ultra-long-warning');
});

test('extractDocumentStats counts CJK characters, headings, tables, and code blocks accurately', () => {
  const sample = `# 标题一\n\n## 标题二\n\n你好世界 Hello World\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n\`\`\`ts\nconsole.log(1);\n\`\`\``;
  const stats = extractDocumentStats(sample);
  assert.equal(stats.headingCount, 2);
  assert.equal(stats.tableCount, 1);
  assert.equal(stats.codeBlockCount, 1);
  assert.ok(stats.wordAndCjkCount >= 10);
});

test('renderMarkdownToHtml renders KaTeX math, Mermaid flowcharts, clean fenced code blocks, and imageVault tokens', () => {
  const md = `# 标题\n\n公式：$E=mc^2$\n\n![测试图](img://pic_1)\n\n\`\`\`ts\nconst x = 1;\n\`\`\`\n\n\`\`\`mermaid\nflowchart TD\n  A[开始] --> B[结束]\n\`\`\``;
  const html = renderMarkdownToHtml(md, {
    theme: CARD_THEMES[0],
    fontSize: 20,
    lineHeight: 1.8,
    highlightBold: true,
    showMacCodeHeader: true,
    imageVault: { 'img://pic_1': 'data:image/png;base64,AAAA' },
  });
  assert.ok(html.includes('<svg'));
  assert.ok(html.includes('开始'));
  assert.ok(html.includes('katex'));
  assert.ok(html.includes('<pre style='));
  assert.ok(html.includes('<code><span'));
  assert.ok(html.includes('data:image/png;base64,AAAA'));
});

test('renderMermaidToSvg produces valid SVG elements', () => {
  const svg = renderMermaidToSvg('flowchart TD\nA[第一步] --> B[第二步]', CARD_THEMES[0]);
  assert.ok(svg.includes('<svg'));
  assert.ok(svg.includes('第一步'));
  assert.ok(svg.includes('第二步'));
});

test('convertHtmlToMarkdown converts headings, bold, lists, and tables accurately', () => {
  const html = `<h2>健康叮嘱</h2><p>请记住<strong>按时量血压</strong>：</p><ul><li>早上一次</li><li>睡前一次</li></ul><table><tr><th>项目</th><th>数值</th></tr><tr><td>收缩压</td><td>120</td></tr></table>`;
  const md = convertHtmlToMarkdown(html);
  assert.ok(md.includes('## 健康叮嘱'));
  assert.ok(md.includes('**按时量血压**'));
  assert.ok(md.includes('- 早上一次'));
  assert.ok(md.includes('| 项目 | 数值 |'));
  assert.ok(md.includes('| 收缩压 | 120 |'));
});

test('findSourceOffsetBySnippet locates matching line number and offsets in raw Markdown', () => {
  const md = `# 第一行标题\n\n## 第二节标题\n\n- **温水泡脚别太烫**：水温控制在 40℃ 左右`;
  const found = findSourceOffsetBySnippet(md, '温水泡脚别太烫：水温控制在 40℃ 左右');
  assert.ok(found !== null);
  assert.equal(found?.lineNumber, 5);
  assert.ok(md.slice(found!.startOffset, found!.endOffset).includes('温水泡脚别太烫'));
});
