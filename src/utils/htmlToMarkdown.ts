/**
 * Converts pasted HTML (from web pages, ChatGPT/Claude/WeChat articles, or docs)
 * into clean, well-structured Markdown without external DOM dependencies so it
 * works identically in both browser and Node unit tests.
 */
export function convertHtmlToMarkdown(html: string): string {
  if (!html || !html.trim()) return '';

  let working = html
    .replace(/\r\n/g, '\n')
    // Remove script, style, meta, head, svg, comments
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|head|meta|link|noscript)[^>]*>[\s\S]*?<\/\1>/gi, '');

  // Handle fenced <pre><code ...>...</code></pre> or <pre>...</pre>
  const codeBlocks: string[] = [];
  working = working.replace(
    /<pre[^>]*>\s*(?:<code([^>]*)>)?([\s\S]*?)(?:<\/code>)?\s*<\/pre>/gi,
    (_m, codeAttrs = '', inner = '') => {
      const langMatch = String(codeAttrs).match(/language-([a-zA-Z0-9_-]+)/i);
      const lang = langMatch ? langMatch[1] : '';
      const cleanCode = decodeHtmlEntities(stripHtmlTags(inner)).trim();
      const token = `@@HTML_MD_CODE_${codeBlocks.length}@@`;
      codeBlocks.push(`\n\n\`\`\`${lang}\n${cleanCode}\n\`\`\`\n\n`);
      return token;
    }
  );

  // Convert HTML tables <table>...</table> into Markdown GFM tables
  working = working.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_m, tableInner) => {
    const rows: string[][] = [];
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch: RegExpExecArray | null;
    while ((trMatch = trRegex.exec(tableInner)) !== null) {
      const cells: string[] = [];
      const cellRegex = /<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi;
      let cellMatch: RegExpExecArray | null;
      while ((cellMatch = cellRegex.exec(trMatch[1])) !== null) {
        const cellText = inlineHtmlToMd(cellMatch[2])
          .replace(/\s+/g, ' ')
          .replace(/\|/g, '\\|')
          .trim();
        cells.push(cellText);
      }
      if (cells.length > 0) {
        rows.push(cells);
      }
    }

    if (rows.length === 0) return '';
    const colCount = Math.max(...rows.map((r) => r.length));
    const normalized = rows.map((r) => {
      const copy = [...r];
      while (copy.length < colCount) copy.push('');
      return copy;
    });

    const headerLine = `| ${normalized[0].join(' | ')} |`;
    const sepLine = `| ${normalized[0].map(() => '---').join(' | ')} |`;
    const bodyLines = normalized
      .slice(1)
      .map((r) => `| ${r.join(' | ')} |`)
      .join('\n');

    return `\n\n${headerLine}\n${sepLine}${bodyLines ? `\n${bodyLines}` : ''}\n\n`;
  });

  // Headings h1 - h6
  working = working.replace(
    /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi,
    (_m, level, content) => {
      const hashes = '#'.repeat(Number(level));
      return `\n\n${hashes} ${inlineHtmlToMd(content).trim()}\n\n`;
    }
  );

  // Blockquotes
  working = working.replace(
    /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi,
    (_m, content) => {
      const lines = inlineHtmlToMd(content)
        .trim()
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      return `\n\n${lines.map((l) => `> ${l}`).join('\n')}\n\n`;
    }
  );

  // Ordered lists
  working = working.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_m, listInner) => {
    let idx = 1;
    const items = listInner.replace(
      /<li[^>]*>([\s\S]*?)<\/li>/gi,
      (_liMatch: string, itemInner: string) => {
        const cleanItem = inlineHtmlToMd(itemInner).replace(/\n+/g, ' ').trim();
        return `${idx++}. ${cleanItem}\n`;
      }
    );
    return `\n\n${stripHtmlTags(items).trim()}\n\n`;
  });

  // Unordered lists
  working = working.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_m, listInner) => {
    const items = listInner.replace(
      /<li[^>]*>([\s\S]*?)<\/li>/gi,
      (_liMatch: string, itemInner: string) => {
        const cleanItem = inlineHtmlToMd(itemInner).replace(/\n+/g, ' ').trim();
        return `- ${cleanItem}\n`;
      }
    );
    return `\n\n${stripHtmlTags(items).trim()}\n\n`;
  });

  // Horizontal rules & line breaks & paragraphs & divs
  working = working
    .replace(/<hr\s*\/?>/gi, '\n\n---\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div[^>]*>/gi, '');

  // Inline formatting
  working = inlineHtmlToMd(working);

  // Restore code blocks
  codeBlocks.forEach((block, idx) => {
    working = working.replace(`@@HTML_MD_CODE_${idx}@@`, block);
  });

  return working
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function inlineHtmlToMd(input: string): string {
  let out = input
    // Strong / Bold
    .replace(/<(strong|b)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi, (_m, _t, c) => {
      const inner = stripHtmlTags(c).trim();
      return inner ? `**${inner}**` : '';
    })
    // Emphasis / Italic
    .replace(/<(em|i)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi, (_m, _t, c) => {
      const inner = stripHtmlTags(c).trim();
      return inner ? `*${inner}*` : '';
    })
    // Inline code
    .replace(/<code(?:\s[^>]*)?>([\s\S]*?)<\/code>/gi, (_m, c) => {
      const inner = decodeHtmlEntities(stripHtmlTags(c)).trim();
      return inner ? `\`${inner}\`` : '';
    })
    // Links
    .replace(
      /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
      (_m, href, label) => {
        const text = stripHtmlTags(label).trim();
        if (!text) return '';
        if (href.startsWith('javascript:') || href === '#') return text;
        return `[${text}](${href})`;
      }
    )
    // Images
    .replace(
      /<img[^>]*src=["']([^"']+)["'][^>]*>/gi,
      (_m, src) => `![配图](${src})`
    );

  out = stripHtmlTags(out);
  return decodeHtmlEntities(out);
}

function stripHtmlTags(input: string): string {
  return input.replace(/<\/?[a-zA-Z][^>]*>/g, '');
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}
