import React from 'react';
import { CardTheme } from '../utils/themes';
import { renderMarkdownToHtml } from '../utils/markdownRenderer';

export interface CardStyleConfig {
  logicalWidth: number;
  fontSize: number;
  lineHeight: number;
  cardPadding: number;
  outerFramePadding: number;
  borderRadius: number;
  fontFamily: 'sans' | 'serif' | 'mono';
  highlightBold: boolean;
  showMacWindowBar: boolean;
  showHeader: boolean;
  headerTitle: string;
  headerBadge: string;
  showFooter: boolean;
  footerText: string;
  footerQrUrl: string;
  qrDataUrl: string;
}

interface MarkdownCardCanvasProps {
  pageMarkdown: string;
  pageIndex: number;
  totalPages: number;
  theme: CardTheme;
  config: CardStyleConfig;
  imageVault?: Record<string, string>;
  onLocateSourceText?: (snippet: string) => void;
  cardRef?: (el: HTMLDivElement | null) => void;
}

export const MarkdownCardCanvas: React.FC<MarkdownCardCanvasProps> = ({
  pageMarkdown,
  pageIndex,
  totalPages,
  theme,
  config,
  imageVault,
  onLocateSourceText,
  cardRef,
}) => {
  const fontClass =
    config.fontFamily === 'serif'
      ? 'font-serif-cn'
      : config.fontFamily === 'mono'
        ? 'font-mono-code'
        : 'font-sans-cn';

  const renderedHtml = React.useMemo(
    () =>
      renderMarkdownToHtml(pageMarkdown, {
        theme,
        fontSize: config.fontSize,
        lineHeight: config.lineHeight,
        highlightBold: config.highlightBold,
        showMacCodeHeader: true,
        imageVault,
      }),
    [
      pageMarkdown,
      theme,
      config.fontSize,
      config.lineHeight,
      config.highlightBold,
      imageVault,
    ]
  );

  const handleBodyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onLocateSourceText) return;
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const blockEl = target.closest('h1, h2, h3, p, li, blockquote, tr, pre');
    const text = (blockEl?.textContent || target.textContent || '').trim();
    if (text) {
      onLocateSourceText(text);
    }
  };

  const showWindowBar = config.showMacWindowBar || Boolean(theme.macHeader);

  return (
    <div
      ref={cardRef}
      data-testid={`markdown-card-page-${pageIndex}`}
      className={fontClass}
      style={{
        width: `${config.logicalWidth}px`,
        padding: `${config.outerFramePadding}px`,
        background: config.outerFramePadding > 0 ? theme.outerBg : theme.cardBg,
        boxSizing: 'border-box',
        color: theme.textColor,
      }}
    >
      <div
        style={{
          background: theme.cardBg,
          borderRadius:
            config.outerFramePadding > 0 ? `${config.borderRadius}px` : '0px',
          border:
            config.outerFramePadding > 0
              ? `1px solid ${theme.borderColor}`
              : 'none',
          boxShadow:
            config.outerFramePadding > 0
              ? '0 16px 36px -10px rgba(15, 23, 42, 0.14)'
              : 'none',
          overflow: 'hidden',
        }}
      >
        {/* Optional Mac Window Chrome */}
        {showWindowBar && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderBottom: `1px solid ${theme.borderColor}`,
              background: theme.tableHeaderBg,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span
                style={{
                  width: '11px',
                  height: '11px',
                  borderRadius: '999px',
                  background: '#FF5F56',
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  width: '11px',
                  height: '11px',
                  borderRadius: '999px',
                  background: '#FFBD2E',
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  width: '11px',
                  height: '11px',
                  borderRadius: '999px',
                  background: '#27C93F',
                  display: 'inline-block',
                }}
              />
            </div>
            <span
              style={{
                fontSize: '12px',
                color: theme.secondaryTextColor,
                fontWeight: 500,
                fontFamily: 'var(--font-mono)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {config.showHeader
                ? `marksnap-note.md · ${config.logicalWidth}px`
                : totalPages > 1
                  ? `${config.headerTitle || '阅读卡片'} · ${pageIndex + 1}/${totalPages}`
                  : config.headerTitle || 'MarkSnap 阅读视图'}
            </span>
          </div>
        )}

        {/* Optional Custom Header Kicker */}
        {config.showHeader && (
          <div
            style={{
              padding: `${Math.max(16, Math.round(config.cardPadding * 0.65))}px ${config.cardPadding}px 14px ${config.cardPadding}px`,
              borderBottom: `1px solid ${theme.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: theme.accentColor,
                letterSpacing: '0.02em',
              }}
            >
              {config.headerTitle || '精选必读指南'}
            </span>
            <span
              style={{
                fontSize: '12px',
                color: theme.secondaryTextColor,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {totalPages > 1
                ? `第 ${pageIndex + 1} / ${totalPages} 页`
                : config.headerBadge || '手机适读版'}
            </span>
          </div>
        )}

        {/* Main Markdown Content Body */}
        <div
          onClick={handleBodyClick}
          title="点击任意段落或标题可快速定位左侧源码位置"
          style={{
            padding: `${config.cardPadding}px`,
            wordBreak: 'break-word',
            cursor: onLocateSourceText ? 'pointer' : 'default',
          }}
        >
          {renderedHtml ? (
            <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
          ) : (
            <div
              style={{
                padding: '48px 16px',
                textAlign: 'center',
                color: theme.secondaryTextColor,
                fontSize: '15px',
              }}
            >
              在左侧编辑器输入或粘贴 Markdown 内容，此处将实时渲染适配手机的高清长图。
            </div>
          )}
        </div>

        {/* Optional Footer with Signature & QR Code */}
        {(config.showFooter || totalPages > 1) && (
          <div
            style={{
              padding: `14px ${config.cardPadding}px ${Math.max(16, Math.round(config.cardPadding * 0.7))}px ${config.cardPadding}px`,
              borderTop: `1px solid ${theme.borderColor}`,
              background: theme.tableStripeBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              {config.showFooter && config.footerText && (
                <div
                  style={{
                    fontSize: '12px',
                    lineHeight: 1.5,
                    color: theme.secondaryTextColor,
                    fontWeight: 500,
                  }}
                >
                  {config.footerText}
                </div>
              )}
              {totalPages > 1 && (
                <div
                  style={{
                    fontSize: '11px',
                    color: theme.secondaryTextColor,
                    marginTop: config.showFooter && config.footerText ? '3px' : '0',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  左右滑动翻页 · {pageIndex + 1} / {totalPages}
                </div>
              )}
            </div>

            {config.showFooter && config.qrDataUrl && (
              <div
                style={{
                  flexShrink: 0,
                  padding: '4px',
                  background: '#FFFFFF',
                  borderRadius: '6px',
                  border: `1px solid ${theme.borderColor}`,
                }}
              >
                <img
                  src={config.qrDataUrl}
                  alt="分享二维码"
                  referrerPolicy="no-referrer"
                  style={{ width: '48px', height: '48px', display: 'block' }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
