import { marked } from 'marked';
import katex from 'katex';
import { CardTheme } from './themes';

export interface RenderOptions {
  theme: CardTheme;
  fontSize: number;
  lineHeight: number;
  highlightBold: boolean;
  showMacCodeHeader: boolean;
  imageVault?: Record<string, string>;
}

/**
 * Lightweight deterministic SVG flowchart renderer for `mermaid` code blocks
 * so flowcharts render offline and capture cleanly inside html-to-image.
 */
export function renderMermaidToSvg(code: string, theme: CardTheme): string {
  const lines = code
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('%%') && !/^(flowchart|graph|sequenceDiagram)/i.test(l));

  interface Edge {
    fromId: string;
    fromLabel: string;
    toId: string;
    toLabel: string;
    edgeLabel?: string;
  }

  const nodeLabels = new Map<string, string>();
  const orderedNodes: string[] = [];
  const edges: Edge[] = [];

  const registerNode = (raw: string): { id: string; label: string } => {
    const match = raw.match(/^([A-Za-z0-9_]+)\s*(?:\[([^\]]+)\]|(?:\(([^)]+)\))|(?:\{([^}]+)\}))?$/);
    if (match) {
      const id = match[1];
      const label = (match[2] || match[3] || match[4] || '').trim();
      if (label) {
        nodeLabels.set(id, label);
      } else if (!nodeLabels.has(id)) {
        nodeLabels.set(id, id);
      }
      if (!orderedNodes.includes(id)) {
        orderedNodes.push(id);
      }
      return { id, label: nodeLabels.get(id) || id };
    }
    const clean = raw.replace(/[\[\](){}]/g, '').trim() || '步骤';
    if (!nodeLabels.has(clean)) {
      nodeLabels.set(clean, clean);
      orderedNodes.push(clean);
    }
    return { id: clean, label: clean };
  };

  for (const line of lines) {
    const arrowMatch = line.match(
      /^(.+?)\s*(?:-->|---|==>|->>)\s*(?:\|([^|]+)\|\s*)?(.+)$/
    );
    if (arrowMatch) {
      const from = registerNode(arrowMatch[1].trim());
      const edgeLabel = arrowMatch[2]?.trim();
      const to = registerNode(arrowMatch[3].trim());
      edges.push({
        fromId: from.id,
        fromLabel: from.label,
        toId: to.id,
        toLabel: to.label,
        edgeLabel,
      });
    } else {
      registerNode(line);
    }
  }

  if (orderedNodes.length === 0) {
    return `<pre style="padding:12px;border-radius:8px;background:${theme.codeBg};color:${theme.codeText};font-size:13px;">${escapeHtml(code)}</pre>`;
  }

  const boxWidth = 280;
  const boxHeight = 42;
  const gapY = 30;
  const padY = 16;
  const svgWidth = 320;
  const totalHeight =
    padY * 2 +
    orderedNodes.length * boxHeight +
    Math.max(0, orderedNodes.length - 1) * gapY;

  const nodeShapes = orderedNodes
    .map((id, idx) => {
      const label = nodeLabels.get(id) || id;
      const y = padY + idx * (boxHeight + gapY);
      const x = (svgWidth - boxWidth) / 2;
      const nextEdge = edges.find((e) => e.fromId === id);

      const arrowSvg =
        idx < orderedNodes.length - 1
          ? `<g>
              <line x1="${svgWidth / 2}" y1="${y + boxHeight}" x2="${svgWidth / 2}" y2="${y + boxHeight + gapY - 5}" stroke="${theme.accentColor}" stroke-width="2" />
              <polygon points="${svgWidth / 2 - 5},${y + boxHeight + gapY - 8} ${svgWidth / 2 + 5},${y + boxHeight + gapY - 8} ${svgWidth / 2},${y + boxHeight + gapY}" fill="${theme.accentColor}" />
              ${
                nextEdge?.edgeLabel
                  ? `<text x="${svgWidth / 2 + 10}" y="${y + boxHeight + gapY / 2 + 4}" font-size="11" fill="${theme.secondaryTextColor}">${escapeHtml(nextEdge.edgeLabel)}</text>`
                  : ''
              }
            </g>`
          : '';

      return `<g>
        <rect x="${x}" y="${y}" width="${boxWidth}" height="${boxHeight}" rx="8" fill="${theme.cardBg}" stroke="${theme.accentColor}" stroke-width="1.5" />
        <text x="${svgWidth / 2}" y="${y + boxHeight / 2 + 5}" text-anchor="middle" font-size="13" font-weight="600" fill="${theme.textColor}">${escapeHtml(label)}</text>
        ${arrowSvg}
      </g>`;
    })
    .join('\n');

  return `<div style="margin: 1.1em 0; padding: 14px; border-radius: 10px; background: ${theme.blockquoteBg}; border: 1px solid ${theme.borderColor}; text-align: center;">
    <svg viewBox="0 0 ${svgWidth} ${totalHeight}" width="100%" style="max-width: 360px; height: auto; display: inline-block; font-family: inherit;">
      ${nodeShapes}
    </svg>
  </div>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function highlightCodeSyntax(code: string): string {
  const escaped = escapeHtml(code);
  return escaped
    .replace(
      /\b(const|let|var|function|return|import|from|export|default|interface|type|async|await|if|else|for|while|class|new|true|false|null|undefined)\b/g,
      '<span style="color:#E11D48;font-weight:600;">$1</span>'
    )
    .replace(
      /(&quot;.*?&quot;|'.*?'|`.*?`)/g,
      '<span style="color:#059669;">$1</span>'
    )
    .replace(/(\/\/[^\n]*)/g, '<span style="opacity:0.55;font-style:italic;">$1</span>');
}

/**
 * Renders Markdown string with LaTeX math, Mermaid diagrams, and custom theme tokens into HTML.
 */
export function renderMarkdownToHtml(
  markdown: string,
  options: RenderOptions
): string {
  const {
    theme,
    fontSize,
    lineHeight,
    highlightBold,
    showMacCodeHeader,
    imageVault = {},
  } = options;

  if (!markdown.trim()) {
    return '';
  }

  // Resolve shorthand img://vault_id references to their DataURLs
  const resolvedMarkdown = markdown.replace(
    /!\[([^\]]*)\]\((img:\/\/[a-zA-Z0-9_-]+)\)/g,
    (_m, alt, key) => {
      const dataUrl = imageVault[key];
      return dataUrl ? `![${alt || '配图'}](${dataUrl})` : `*[图片 ${alt || key} 未找到]*`;
    }
  );

  // Step 1: Extract fenced code blocks first so math regex doesn't touch code
  const codePlaceholders: string[] = [];
  let working = resolvedMarkdown.replace(
    /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g,
    (_match, langRaw, codeContent) => {
      const lang = (langRaw || '').trim().toLowerCase();
      if (lang === 'mermaid') {
        const svgHtml = renderMermaidToSvg(codeContent.trim(), theme);
        const token = `@@CODE_BLOCK_${codePlaceholders.length}@@`;
        codePlaceholders.push(svgHtml);
        return token;
      }

      const highlighted = highlightCodeSyntax(codeContent.replace(/\n$/, ''));
      const headerBar = showMacCodeHeader
        ? `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 14px;border-bottom:1px solid ${theme.borderColor};font-size:12px;color:${theme.secondaryTextColor};">
            <span style="display:inline-flex;gap:6px;align-items:center;">
              <span style="width:9px;height:9px;border-radius:50%;background:#F87171;display:inline-block;"></span>
              <span style="width:9px;height:9px;border-radius:50%;background:#FBBF24;display:inline-block;"></span>
              <span style="width:9px;height:9px;border-radius:50%;background:#34D399;display:inline-block;"></span>
            </span>
            <span style="font-family:var(--font-mono);font-size:11px;opacity:0.85;">${escapeHtml(lang || 'text')}</span>
          </div>`
        : '';

      const htmlBlock = `<div style="margin:1.15em 0;border-radius:10px;overflow:hidden;background:${theme.codeBg};border:1px solid ${theme.borderColor};">
        ${headerBar}
        <pre style="margin:0;padding:14px;overflow-x:auto;white-space:pre-wrap;word-break:break-word;font-family:var(--font-mono);font-size:${Math.max(13, Math.round(fontSize * 0.82))}px;line-height:1.6;color:${theme.codeText};"><code>${highlighted}</code></pre>
      </div>`;

      const token = `@@CODE_BLOCK_${codePlaceholders.length}@@`;
      codePlaceholders.push(htmlBlock);
      return token;
    }
  );

  // Step 2: Render block math $$...$$ and inline math $...$
  const mathPlaceholders: string[] = [];
  working = working.replace(/\$\$([\s\S]+?)\$\$/g, (_m, tex) => {
    try {
      const rendered = katex.renderToString(tex.trim(), {
        displayMode: true,
        throwOnError: false,
      });
      const token = `@@MATH_BLOCK_${mathPlaceholders.length}@@`;
      mathPlaceholders.push(
        `<div style="margin:1em 0;padding:10px 12px;overflow-x:auto;text-align:center;background:${theme.blockquoteBg};border-radius:8px;border:1px solid ${theme.borderColor};">${rendered}</div>`
      );
      return token;
    } catch {
      return `$$${tex}$$`;
    }
  });

  working = working.replace(/(?<!\$)\$([^\n$]+?)\$(?!\$)/g, (_m, tex) => {
    try {
      const rendered = katex.renderToString(tex.trim(), {
        displayMode: false,
        throwOnError: false,
      });
      const token = `@@MATH_BLOCK_${mathPlaceholders.length}@@`;
      mathPlaceholders.push(rendered);
      return token;
    } catch {
      return `$${tex}$`;
    }
  });

  // Step 3: Parse standard Markdown via marked
  let rawHtml = marked.parse(working, {
    gfm: true,
    breaks: true,
  }) as string;

  // Step 4: Restore math placeholders
  mathPlaceholders.forEach((html, idx) => {
    rawHtml = rawHtml.replace(`@@MATH_BLOCK_${idx}@@`, html);
  });

  // Step 5: Apply inline theme styles to semantic elements so html-to-image captures 100% accurately
  const h1Size = Math.round(fontSize * 1.42);
  const h2Size = Math.round(fontSize * 1.22);
  const h3Size = Math.round(fontSize * 1.08);
  const smallSize = Math.max(13, Math.round(fontSize * 0.88));

  const strongStyle = highlightBold
    ? `color:${theme.headingColor};font-weight:700;background:${theme.accentBg};padding:1px 5px;border-radius:4px;`
    : `color:${theme.headingColor};font-weight:700;`;

  let styledHtml = rawHtml
    .replace(
      /<h1>/g,
      `<h1 style="font-size:${h1Size}px;line-height:1.35;font-weight:700;color:${theme.headingColor};margin:0 0 0.75em 0;padding-bottom:0.45em;border-bottom:1px solid ${theme.borderColor};letter-spacing:-0.01em;">`
    )
    .replace(
      /<h2>/g,
      `<h2 style="font-size:${h2Size}px;line-height:1.4;font-weight:700;color:${theme.headingColor};margin:1.35em 0 0.6em 0;padding-bottom:0.3em;border-bottom:1px solid ${theme.borderColor};">`
    )
    .replace(
      /<h3>/g,
      `<h3 style="font-size:${h3Size}px;line-height:1.45;font-weight:600;color:${theme.headingColor};margin:1.15em 0 0.45em 0;">`
    )
    .replace(
      /<p>/g,
      `<p style="margin:0 0 0.95em 0;font-size:${fontSize}px;line-height:${lineHeight};color:${theme.textColor};word-break:break-word;">`
    )
    .replace(
      /<ul>/g,
      `<ul style="margin:0 0 1em 0;padding-left:1.35em;list-style-type:disc;color:${theme.textColor};font-size:${fontSize}px;line-height:${lineHeight};">`
    )
    .replace(
      /<ol>/g,
      `<ol style="margin:0 0 1em 0;padding-left:1.45em;list-style-type:decimal;color:${theme.textColor};font-size:${fontSize}px;line-height:${lineHeight};">`
    )
    .replace(
      /<li>/g,
      `<li style="margin:0.38em 0;line-height:${lineHeight};color:${theme.textColor};">`
    )
    .replace(
      /<blockquote>/g,
      `<blockquote style="margin:1.1em 0;padding:14px 16px;border-radius:10px;background:${theme.blockquoteBg};border:1px solid ${theme.borderColor};color:${theme.blockquoteText};font-size:${Math.max(14, Math.round(fontSize * 0.95))}px;">`
    )
    .replace(/<strong>/g, `<strong style="${strongStyle}">`)
    .replace(
      /<code>/g,
      `<code style="font-family:var(--font-mono);font-size:0.88em;padding:2px 6px;border-radius:5px;background:${theme.codeBg};color:${theme.accentColor};border:1px solid ${theme.borderColor};">`
    )
    .replace(
      /<hr\s*\/?>/g,
      `<hr style="border:none;border-top:1px dashed ${theme.borderColor};margin:1.4em 0;" />`
    )
    .replace(
      /<table>/g,
      `<div style="margin:1.1em 0;border-radius:10px;overflow:hidden;border:1px solid ${theme.borderColor};"><table style="width:100%;border-collapse:collapse;font-size:${smallSize}px;line-height:1.5;font-variant-numeric:tabular-nums;">`
    )
    .replace(/<\/table>/g, `</table></div>`)
    .replace(
      /<thead>/g,
      `<thead style="background:${theme.tableHeaderBg};color:${theme.headingColor};font-weight:600;">`
    )
    .replace(
      /<th([^>]*)>/g,
      `<th$1 style="padding:10px 12px;text-align:left;border-bottom:1px solid ${theme.borderColor};font-weight:600;color:${theme.headingColor};">`
    )
    .replace(
      /<td([^>]*)>/g,
      `<td$1 style="padding:9px 12px;border-bottom:1px solid ${theme.borderColor};color:${theme.textColor};word-break:break-word;vertical-align:top;">`
    )
    .replace(
      /<a /g,
      `<a style="color:${theme.accentColor};text-decoration:underline;text-underline-offset:3px;" `
    )
    .replace(
      /<img /g,
      `<img referrerPolicy="no-referrer" style="max-width:100%;height:auto;border-radius:10px;margin:0.85em auto;display:block;border:1px solid ${theme.borderColor};" `
    );

  // Step 6: Restore fenced code blocks and Mermaid SVGs after inline code replacement
  codePlaceholders.forEach((html, idx) => {
    styledHtml = styledHtml.replace(
      new RegExp(`<p[^>]*>\\s*@@CODE_BLOCK_${idx}@@\\s*<\\/p>|@@CODE_BLOCK_${idx}@@`, 'g'),
      html
    );
  });

  return styledHtml;
}
