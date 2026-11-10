/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toJpeg, toPng } from 'html-to-image';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import {
  Bold,
  BookmarkPlus,
  ChevronDown,
  Copy,
  Download,
  FileUp,
  Globe,
  Heading2,
  ImagePlus,
  Monitor,
  Moon,
  Quote,
  RotateCcw,
  Scissors,
  Smartphone,
  Sun,
  Table,
  Tablet,
  Trash2,
  Wand2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  calculateCanvasExportMetrics,
  cleanseAiMarkdown,
  extractDocumentStats,
  findSourceOffsetBySnippet,
  tokenizeMarkdownBlocks,
} from './utils/markdownProcessor';
import {
  computePageBudget,
  estimateChromeLogicalHeight,
  paginateMarkdown,
  SplitMode,
} from './utils/pagination';
import { renderMarkdownToHtml } from './utils/markdownRenderer';
import { convertHtmlToMarkdown } from './utils/htmlToMarkdown';
import {
  CANVAS_PRESETS,
  CARD_THEMES,
  CardTheme,
  DEFAULT_STYLE_SCHEMES,
  UserStyleScheme,
} from './utils/themes';
import { MARKDOWN_TEMPLATES } from './utils/templates';
import { I18N, Locale } from './utils/i18n';
import {
  CardStyleConfig,
  MarkdownCardCanvas,
} from './components/MarkdownCardCanvas';
import {
  ExportPreviewModal,
  GeneratedCardImage,
} from './components/ExportPreviewModal';

const STORAGE_KEY = 'marksnap_studio_prefs_v2';
const CUSTOM_SCHEMES_KEY = 'marksnap_custom_schemes_v1';

export default function App() {
  // Studio UI theme (Light / Dark mode) & Locale ('zh' | 'en')
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [locale, setLocale] = useState<Locale>('zh');
  const t = I18N[locale];

  // Markdown source content & embedded image vault
  const [markdown, setMarkdown] = useState<string>(
    MARKDOWN_TEMPLATES[0].content
  );
  const [imageVault, setImageVault] = useState<Record<string, string>>({});

  // Selected preset, theme & active scheme (defaults to headerless/footerless/borderless 'scheme-default-clean')
  const [selectedPresetId, setSelectedPresetId] =
    useState<string>('mobile-comfort');
  const [selectedThemeId, setSelectedThemeId] =
    useState<string>('notion-clean');
  const [activeSchemeId, setActiveSchemeId] = useState<string>(
    'scheme-default-clean'
  );
  const [customSchemes, setCustomSchemes] = useState<UserStyleScheme[]>([]);
  const [newSchemeName, setNewSchemeName] = useState<string>('');
  const [isSavingScheme, setIsSavingScheme] = useState<boolean>(false);

  // Pagination & Split mode
  const [splitMode, setSplitMode] = useState<SplitMode>('single');
  const [maxCharsPerPage, setMaxCharsPerPage] = useState<number>(8000);
  const [showCharCapOverride, setShowCharCapOverride] =
    useState<boolean>(false);
  const [blockHeights, setBlockHeights] = useState<number[] | null>(null);
  const measureStageRef = useRef<HTMLDivElement | null>(null);

  // AI Cleanse & Paste options
  const [stripBareUrls, setStripBareUrls] = useState<boolean>(false);
  const [convertWideTables, setConvertWideTables] = useState<boolean>(false);
  const [autoConvertRichPaste, setAutoConvertRichPaste] =
    useState<boolean>(true);

  // Card Style Configuration (Default: no outer frame padding, no header, no footer)
  const [logicalWidth, setLogicalWidth] = useState<number>(380);
  const [fontSize, setFontSize] = useState<number>(18);
  const [lineHeight, setLineHeight] = useState<number>(1.75);
  const [cardPadding, setCardPadding] = useState<number>(16);
  const [outerFramePadding, setOuterFramePadding] = useState<number>(0);
  const [borderRadius, setBorderRadius] = useState<number>(16);
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>(
    'sans'
  );
  const [highlightBold, setHighlightBold] = useState<boolean>(false);
  const [showMacWindowBar, setShowMacWindowBar] = useState<boolean>(false);

  // Header & Footer Configuration (Default: off)
  const [showHeader, setShowHeader] = useState<boolean>(false);
  const [headerTitle, setHeaderTitle] = useState<string>('家庭健康实用笔记');
  const [headerBadge, setHeaderBadge] = useState<string>('手机大字护眼版');
  const [showFooter, setShowFooter] = useState<boolean>(false);
  const [footerText, setFooterText] = useState<string>(
    '整理自 AI 助手 · 转发给家人朋友随时查看'
  );
  const [footerQrUrl, setFooterQrUrl] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Export Settings
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');
  const [exportScale, setExportScale] = useState<number>(3);
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Collapsible advanced sections in right sidebar
  const [showAdvancedLayout, setShowAdvancedLayout] = useState<boolean>(false);
  const [showHeaderFooterConfig, setShowHeaderFooterConfig] =
    useState<boolean>(false);

  // Mobile responsive workspace tab ('editor' | 'preview' | 'settings')
  const [mobileWorkspaceTab, setMobileWorkspaceTab] = useState<
    'editor' | 'preview' | 'settings'
  >('preview');

  // Export & Modal States
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string>('');
  const [locatedLineHint, setLocatedLineHint] = useState<number | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedCardImage[]>(
    []
  );
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [copiedPageIndex, setCopiedPageIndex] = useState<number | null>(null);
  const [measuredCardHeight, setMeasuredCardHeight] = useState<number>(920);

  // Refs
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInsertInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const [stageWidth, setStageWidth] = useState<number>(560);

  // Measure available preview stage width so wide cards automatically fit without horizontal clipping
  useEffect(() => {
    const el = stageContainerRef.current;
    if (!el) return;
    const updateWidth = () => {
      if (el.clientWidth > 0) {
        setStageWidth(el.clientWidth);
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    window.addEventListener('resize', updateWidth);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, [mobileWorkspaceTab]);

  // Load saved preferences & custom schemes from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved.darkMode === 'boolean') setDarkMode(saved.darkMode);
        if (saved.locale === 'zh' || saved.locale === 'en')
          setLocale(saved.locale);
        if (saved.activeSchemeId) setActiveSchemeId(saved.activeSchemeId);
        if (saved.selectedThemeId) setSelectedThemeId(saved.selectedThemeId);
        if (saved.logicalWidth) setLogicalWidth(saved.logicalWidth);
        if (saved.fontSize) setFontSize(saved.fontSize);
        if (typeof saved.outerFramePadding === 'number')
          setOuterFramePadding(saved.outerFramePadding);
        if (typeof saved.showHeader === 'boolean')
          setShowHeader(saved.showHeader);
        if (typeof saved.showFooter === 'boolean')
          setShowFooter(saved.showFooter);
      }
      const rawSchemes = localStorage.getItem(CUSTOM_SCHEMES_KEY);
      if (rawSchemes) {
        const parsed = JSON.parse(rawSchemes);
        if (Array.isArray(parsed)) {
          setCustomSchemes(parsed);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Sync dark mode class on <html> and persist preferences
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          darkMode,
          locale,
          activeSchemeId,
          selectedThemeId,
          logicalWidth,
          fontSize,
          outerFramePadding,
          showHeader,
          showFooter,
        })
      );
    } catch {
      // Ignore storage errors
    }
  }, [
    darkMode,
    locale,
    activeSchemeId,
    selectedThemeId,
    logicalWidth,
    fontSize,
    outerFramePadding,
    showHeader,
    showFooter,
  ]);

  // Generate QR code Data URL when footerQrUrl changes
  useEffect(() => {
    let active = true;
    if (!footerQrUrl.trim()) {
      setQrDataUrl('');
      return;
    }
    QRCode.toDataURL(footerQrUrl.trim(), {
      width: 144,
      margin: 1,
      color: { dark: '#0F172A', light: '#FFFFFF' },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [footerQrUrl]);

  const allSchemes: UserStyleScheme[] = useMemo(
    () => [...DEFAULT_STYLE_SCHEMES, ...customSchemes],
    [customSchemes]
  );

  const currentTheme: CardTheme = useMemo(
    () =>
      CARD_THEMES.find((tItem) => tItem.id === selectedThemeId) ||
      CARD_THEMES[0],
    [selectedThemeId]
  );

  // --- Height-accurate pagination ------------------------------------------
  // Pages exist only to keep each exported image inside the browser canvas /
  // WeChat sharpness budget, so the splitter needs real rendered heights.
  const measureBlocks = useMemo(
    () => tokenizeMarkdownBlocks(markdown.trim()),
    [markdown]
  );

  const measureContentWidth = Math.max(
    160,
    logicalWidth - outerFramePadding * 2 - cardPadding * 2
  );

  const measureHtml = useMemo(
    () =>
      measureBlocks.map((block) =>
        renderMarkdownToHtml(block, {
          theme: currentTheme,
          fontSize,
          lineHeight,
          highlightBold,
          showMacCodeHeader: true,
          imageVault,
        })
      ),
    [
      measureBlocks,
      currentTheme,
      fontSize,
      lineHeight,
      highlightBold,
      imageVault,
    ]
  );

  // Measure every block in an off-screen stage that mirrors the card body, so
  // tables / code / images / math contribute their true pixel height.
  useEffect(() => {
    const stage = measureStageRef.current;
    if (!stage) return;
    let frame = 0;
    let cancelled = false;

    const read = () => {
      if (cancelled) return;
      const nodes = Array.from(
        stage.querySelectorAll<HTMLElement>('[data-ms-block]')
      );
      if (nodes.length === 0) {
        setBlockHeights((prev) => (prev && prev.length === 0 ? prev : []));
        return;
      }
      const tops = nodes.map((el) => el.getBoundingClientRect().top);
      const stageBottom = stage.getBoundingClientRect().bottom;
      const next = nodes.map((el, i) => {
        const bottom = i + 1 < nodes.length ? tops[i + 1] : stageBottom;
        return Math.max(12, Math.round(bottom - tops[i]));
      });
      setBlockHeights((prev) =>
        prev &&
        prev.length === next.length &&
        prev.every((v, i) => Math.abs(v - next[i]) <= 1)
          ? prev
          : next
      );
    };

    const schedule = () => {
      if (cancelled) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(read);
    };

    const firstPass = window.setTimeout(schedule, 120);
    const latePass = window.setTimeout(schedule, 420);
    stage.addEventListener('load', schedule, true);

    return () => {
      cancelled = true;
      window.clearTimeout(firstPass);
      window.clearTimeout(latePass);
      cancelAnimationFrame(frame);
      stage.removeEventListener('load', schedule, true);
    };
  }, [measureHtml, measureContentWidth, fontFamily, cardPadding]);

  const pageChromeHeight = useMemo(
    () =>
      estimateChromeLogicalHeight({
        cardPadding,
        outerFramePadding,
        showMacWindowBar,
        macWindowBarByTheme: Boolean(currentTheme.macHeader),
        showHeader,
        showFooter,
        footerHasText: Boolean(footerText),
        footerHasQr: Boolean(qrDataUrl),
        showPageIndicator: splitMode !== 'single',
      }),
    [
      cardPadding,
      outerFramePadding,
      showMacWindowBar,
      currentTheme,
      showHeader,
      showFooter,
      footerText,
      qrDataUrl,
      splitMode,
    ]
  );

  const pageBudget = useMemo(
    () => computePageBudget(logicalWidth, exportScale, pageChromeHeight),
    [logicalWidth, exportScale, pageChromeHeight]
  );

  // Split markdown into pages: pack by real height, break only on overflow.
  const pagination = useMemo(
    () =>
      paginateMarkdown({
        markdown,
        mode: splitMode,
        budget: pageBudget,
        blockHeights,
        contentWidth: measureContentWidth,
        fontSize,
        lineHeight,
        charCap: maxCharsPerPage,
      }),
    [
      markdown,
      splitMode,
      pageBudget,
      blockHeights,
      measureContentWidth,
      fontSize,
      lineHeight,
      maxCharsPerPage,
    ]
  );

  const pages = pagination.pages;

  // Measure height of the first card for accurate physical pixel & WeChat estimation
  useEffect(() => {
    const firstEl = cardRefs.current[0];
    if (firstEl) {
      const h = firstEl.offsetHeight;
      if (h > 0) setMeasuredCardHeight(h);
    }
  }, [
    pages,
    logicalWidth,
    fontSize,
    lineHeight,
    cardPadding,
    outerFramePadding,
    showHeader,
    showFooter,
    selectedThemeId,
  ]);

  const docStats = useMemo(() => extractDocumentStats(markdown), [markdown]);

  const exportMetrics = useMemo(
    () =>
      calculateCanvasExportMetrics(
        logicalWidth,
        measuredCardHeight,
        exportScale,
        splitMode === 'single'
      ),
    [logicalWidth, measuredCardHeight, exportScale, splitMode]
  );

  const cardStyleConfig: CardStyleConfig = useMemo(
    () => ({
      logicalWidth,
      fontSize,
      lineHeight,
      cardPadding,
      outerFramePadding,
      borderRadius,
      fontFamily,
      highlightBold,
      showMacWindowBar,
      showHeader,
      headerTitle,
      headerBadge,
      showFooter,
      footerText,
      footerQrUrl,
      qrDataUrl,
    }),
    [
      logicalWidth,
      fontSize,
      lineHeight,
      cardPadding,
      outerFramePadding,
      borderRadius,
      fontFamily,
      highlightBold,
      showMacWindowBar,
      showHeader,
      headerTitle,
      headerBadge,
      showFooter,
      footerText,
      footerQrUrl,
      qrDataUrl,
    ]
  );

  const showToast = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => {
      setStatusNotice((prev) => (prev === msg ? '' : prev));
    }, 3000);
  };

  const getSchemeDisplayName = (scheme: UserStyleScheme) =>
    t.schemeNames[scheme.id] || scheme.name;

  // Apply a complete UserStyleScheme (built-in or custom)
  const handleApplyScheme = (scheme: UserStyleScheme) => {
    setActiveSchemeId(scheme.id);
    setLogicalWidth(scheme.logicalWidth);
    setSelectedThemeId(scheme.selectedThemeId);
    setFontSize(scheme.fontSize);
    setLineHeight(scheme.lineHeight);
    setCardPadding(scheme.cardPadding);
    setOuterFramePadding(scheme.outerFramePadding);
    setFontFamily(scheme.fontFamily);
    setHighlightBold(scheme.highlightBold);
    setShowMacWindowBar(scheme.showMacWindowBar);
    setShowHeader(scheme.showHeader);
    setHeaderTitle(scheme.headerTitle);
    setHeaderBadge(scheme.headerBadge);
    setShowFooter(scheme.showFooter);
    setFooterText(scheme.footerText);
    const matchingPreset = CANVAS_PRESETS.find(
      (p) => p.logicalWidth === scheme.logicalWidth
    );
    setSelectedPresetId(matchingPreset ? matchingPreset.id : 'custom');
    setPreviewZoom(100);
    showToast(t.toastAppliedScheme(getSchemeDisplayName(scheme)));
  };

  // Save current configuration as a custom user scheme
  const handleSaveCustomScheme = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newSchemeName.trim();
    if (!label) {
      showToast(t.toastEnterPresetName);
      return;
    }
    const created: UserStyleScheme = {
      id: `custom-${Date.now()}`,
      name: label,
      logicalWidth,
      selectedThemeId,
      fontSize,
      lineHeight,
      cardPadding,
      outerFramePadding,
      fontFamily,
      highlightBold,
      showMacWindowBar,
      showHeader,
      headerTitle,
      headerBadge,
      showFooter,
      footerText,
    };
    const updated = [...customSchemes, created];
    setCustomSchemes(updated);
    setActiveSchemeId(created.id);
    setNewSchemeName('');
    setIsSavingScheme(false);
    try {
      localStorage.setItem(CUSTOM_SCHEMES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
    showToast(t.toastSavedPreset(label));
  };

  const handleDeleteCustomScheme = (id: string) => {
    const updated = customSchemes.filter((s) => s.id !== id);
    setCustomSchemes(updated);
    if (activeSchemeId === id) {
      setActiveSchemeId('scheme-default-clean');
    }
    try {
      localStorage.setItem(CUSTOM_SCHEMES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
    showToast(t.toastDeletedPreset);
  };

  // Apply Device Preset
  const handleSelectPreset = (presetId: string) => {
    const preset = CANVAS_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(preset.id);
    setLogicalWidth(preset.logicalWidth);
    setFontSize(preset.recommendedFontSize);
    setCardPadding(preset.recommendedPadding);
    setPreviewZoom(100);
  };

  // Apply Template
  const handleSelectTemplate = (templateId: string) => {
    const tpl = MARKDOWN_TEMPLATES.find((item) => item.id === templateId);
    if (!tpl) return;
    setMarkdown(tpl.content);
    setSelectedPresetId(tpl.recommendedPresetId);
    setSelectedThemeId(tpl.recommendedThemeId);
    setHeaderTitle(tpl.headerTitle);
    setHeaderBadge(tpl.headerBadge);
    const preset = CANVAS_PRESETS.find((p) => p.id === tpl.recommendedPresetId);
    if (preset) {
      setLogicalWidth(preset.logicalWidth);
      setCardPadding(preset.recommendedPadding);
    }
    setPreviewZoom(100);
    setFontSize(tpl.recommendedFontSize);
    showToast(
      t.toastLoadedTemplate(
        t.templateNames[tpl.id] || tpl.name.split('（')[0]
      )
    );
  };

  // Insert text or wrap selection in Markdown editor
  const insertAtEditorCursor = (
    prefix: string,
    suffix = '',
    defaultText = ''
  ) => {
    const el = textareaRef.current;
    if (!el) {
      setMarkdown((prev) => `${prev}${prefix}${defaultText}${suffix}`);
      return;
    }
    const start = el.selectionStart ?? markdown.length;
    const end = el.selectionEnd ?? markdown.length;
    const selected = markdown.slice(start, end) || defaultText;
    const replacement = `${prefix}${selected}${suffix}`;
    const next =
      markdown.slice(0, start) + replacement + markdown.slice(end);
    setMarkdown(next);
    setTimeout(() => {
      el.focus();
      const cursor = start + prefix.length + selected.length + suffix.length;
      el.setSelectionRange(cursor, cursor);
    }, 10);
  };

  // Compress and store an image file into imageVault, returning its shorthand token
  const storeImageFileInVault = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.onload = () => {
        const rawUrl = String(reader.result || '');
        const img = new Image();
        img.onload = () => {
          const maxW = 920;
          const ratio = img.width > maxW ? maxW / img.width : 1;
          const w = Math.max(1, Math.round(img.width * ratio));
          const h = Math.max(1, Math.round(img.height * ratio));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          const key = `img://pic_${Date.now().toString(36)}`;
          setImageVault((prev) => ({ ...prev, [key]: compressed }));
          resolve(key);
        };
        img.onerror = () => resolve(rawUrl);
        img.src = rawUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle Rich HTML Paste & Clipboard Image Paste inside Markdown Editor
  const handleEditorPaste = async (
    e: React.ClipboardEvent<HTMLTextAreaElement>
  ) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const key = await storeImageFileInVault(file);
            insertAtEditorCursor(`\n\n![Image](${key})\n\n`);
            showToast(t.toastPastedImage);
          }
          return;
        }
      }
    }

    if (!autoConvertRichPaste) return;
    const htmlData = e.clipboardData?.getData('text/html') || '';
    const plainData = e.clipboardData?.getData('text/plain') || '';

    const hasRichTags =
      /<(h[1-6]|strong|b|table|ul|ol|li|blockquote|pre|code|a)\b/i.test(
        htmlData
      );
    const looksAlreadyMarkdown = /(^#{1,6}\s+|\*\*|```|^\|.*\|$)/m.test(
      plainData
    );

    if (htmlData && hasRichTags && !looksAlreadyMarkdown) {
      const converted = convertHtmlToMarkdown(htmlData);
      if (converted && converted !== plainData.trim()) {
        e.preventDefault();
        insertAtEditorCursor(converted);
        showToast(t.toastConvertedRichHtml);
      }
    }
  };

  // Handle inserting local image file into Markdown
  const handleInsertImageFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const key = await storeImageFileInVault(file);
      const cleanName = file.name.replace(/\.[^.]+$/, '') || 'image';
      insertAtEditorCursor(`\n\n![${cleanName}](${key})\n\n`);
      showToast(t.toastInsertedImage(file.name));
    } catch {
      showToast(t.toastInsertImageFailed);
    }
    e.target.value = '';
  };

  // Click-to-Locate: clicking any paragraph/heading in preview scrolls and highlights source in editor
  const handleLocateSourceText = (snippet: string) => {
    const match = findSourceOffsetBySnippet(markdown, snippet);
    if (!match) return;
    setLocatedLineHint(match.lineNumber);
    setTimeout(() => {
      setLocatedLineHint((prev) =>
        prev === match.lineNumber ? null : prev
      );
    }, 2400);

    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(match.startOffset, match.endOffset);
    const totalLines = Math.max(1, markdown.split('\n').length);
    const ratio = Math.max(0, (match.lineNumber - 3) / totalLines);
    el.scrollTop = Math.round(el.scrollHeight * ratio);
  };

  // One-click AI Markdown Cleanse
  const handleCleanseMarkdown = () => {
    const cleaned = cleanseAiMarkdown(markdown, {
      stripAiPreamble: true,
      normalizeSpacing: true,
      stripBareUrls,
      convertWideTablesToCards: convertWideTables,
    });
    setMarkdown(cleaned);
    showToast(t.toastCleansed);
  };

  // Import local .md / .txt file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setMarkdown(reader.result);
        showToast(t.toastImportedFile(file.name));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Render DOM nodes to high-DPI DataURLs
  const renderAllCardsToImages = async (): Promise<GeneratedCardImage[]> => {
    const results: GeneratedCardImage[] = [];
    const scale = exportMetrics.effectiveScale;

    for (let i = 0; i < pages.length; i++) {
      const node = cardRefs.current[i];
      if (!node) continue;

      const options = {
        pixelRatio: scale,
        cacheBust: true,
        skipFonts: true,
        quality: 0.94,
      };

      const dataUrl =
        exportFormat === 'jpeg'
          ? await toJpeg(node, options)
          : await toPng(node, options);

      const base64Length = dataUrl.split(',')[1]?.length || 0;
      const sizeKB = Math.max(
        1,
        Math.round(((base64Length * 3) / 4) / 1024)
      );

      results.push({
        pageIndex: i,
        dataUrl,
        sizeKB,
      });
    }
    return results;
  };

  // Open Export & Preview Modal
  const handleGenerateAndPreview = async () => {
    if (!markdown.trim()) {
      showToast(t.toastEmptyContent);
      return;
    }
    setIsExporting(true);
    try {
      const imgs = await renderAllCardsToImages();
      setGeneratedImages(imgs);
      setIsExportModalOpen(true);
    } catch {
      showToast(t.toastExportFailed);
    } finally {
      setIsExporting(false);
    }
  };

  // Quick Copy First/Single Image to Clipboard
  const handleQuickCopyToClipboard = async () => {
    if (!markdown.trim()) {
      showToast(t.toastEmptyContent);
      return;
    }
    setIsExporting(true);
    try {
      const node = cardRefs.current[0];
      if (!node) return;
      const dataUrl = await toPng(node, {
        pixelRatio: exportMetrics.effectiveScale,
        cacheBust: true,
        skipFonts: true,
      });
      await copyDataUrlToClipboard(dataUrl, 0);
      showToast(t.toastCopiedClipboard);
    } catch {
      const imgs = await renderAllCardsToImages();
      setGeneratedImages(imgs);
      setIsExportModalOpen(true);
      showToast(t.toastManualCopyHint);
    } finally {
      setIsExporting(false);
    }
  };

  const copyDataUrlToClipboard = async (dataUrl: string, pageIndex: number) => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const pngBlob =
      blob.type === 'image/png'
        ? blob
        : new Blob([await blob.arrayBuffer()], { type: 'image/png' });

    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob }),
      ]);
      setCopiedPageIndex(pageIndex);
      setTimeout(() => setCopiedPageIndex(null), 2200);
    } else {
      throw new Error('ClipboardItem unsupported');
    }
  };

  const handleDownloadSingle = (dataUrl: string, pageIndex: number) => {
    const ext = exportFormat === 'jpeg' ? 'jpg' : 'png';
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download =
      pages.length > 1
        ? `marksnap-card-${pageIndex + 1}.${ext}`
        : `marksnap-long-image.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(t.toastDownloadedCard(pageIndex + 1));
  };

  const handleDownloadZip = async () => {
    if (generatedImages.length === 0) return;
    const zip = new JSZip();
    const ext = exportFormat === 'jpeg' ? 'jpg' : 'png';
    generatedImages.forEach((img) => {
      const base64Data = img.dataUrl.split(',')[1];
      if (base64Data) {
        zip.file(
          `marksnap-page-${String(img.pageIndex + 1).padStart(2, '0')}.${ext}`,
          base64Data,
          { base64: true }
        );
      }
    });
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `marksnap-cards-${generatedImages.length}p.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(t.toastDownloadedZip(generatedImages.length));
  };

  const fontClass =
    fontFamily === 'serif'
      ? 'font-serif-cn'
      : fontFamily === 'mono'
        ? 'font-mono-code'
        : 'font-sans-cn';

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Off-screen measurement stage: mirrors the card body 1:1 so pagination
          uses real rendered pixel heights instead of character counts. */}
      <div
        ref={measureStageRef}
        aria-hidden="true"
        className={`${fontClass} pointer-events-none`}
        style={{
          position: 'fixed',
          top: 0,
          left: '-100000px',
          width: `${measureContentWidth}px`,
          visibility: 'hidden',
          zIndex: -1,
          background: currentTheme.cardBg,
          color: currentTheme.textColor,
        }}
      >
        {measureHtml.map((html, index) => (
          <div
            key={index}
            data-ms-block={index}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ))}
      </div>

      {/* Single Clean Top Header Bar */}
      <header className="h-14 shrink-0 flex items-center justify-between gap-4 px-5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 z-20">
        {/* Left: Brand & Quick Preset Pills */}
        <div className="flex items-center gap-5 min-w-0">
          <a
            href="#top"
            className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            MarkSnap
          </a>

          <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-lg">
            {allSchemes.map((scheme) => {
              const isActive = activeSchemeId === scheme.id;
              return (
                <div key={scheme.id} className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => handleApplyScheme(scheme)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {getSchemeDisplayName(scheme)}
                  </button>
                  {!scheme.isBuiltIn && (
                    <button
                      type="button"
                      aria-label={`Delete ${scheme.name}`}
                      onClick={() => handleDeleteCustomScheme(scheme.id)}
                      className="pr-1.5 pl-0.5 py-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Primary Export Actions, Language Switcher & Theme Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {statusNotice && (
            <span
              role="status"
              className="hidden sm:inline-block text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md"
            >
              {statusNotice}
            </span>
          )}

          <button
            type="button"
            onClick={handleQuickCopyToClipboard}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            <Copy className="w-3.5 h-3.5" />
            {t.copyImage}
          </button>

          <button
            type="button"
            onClick={handleGenerateAndPreview}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 rounded-lg hover:bg-slate-800 dark:hover:bg-emerald-500 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting
              ? t.generating
              : pages.length > 1
                ? t.exportImagesCount(pages.length)
                : t.exportImage}
          </button>

          <button
            type="button"
            onClick={() => setLocale((l) => (l === 'zh' ? 'en' : 'zh'))}
            title={t.toggleLanguage}
            aria-label={t.toggleLanguage}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{locale === 'zh' ? 'EN' : '中文'}</span>
          </button>

          <button
            type="button"
            onClick={() => setDarkMode((d) => !d)}
            aria-label={t.toggleDarkMode}
            title={t.toggleDarkMode}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {darkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile View Switcher (only shown on < lg screens) */}
      <div className="flex lg:hidden shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-1.5 gap-1.5">
        {[
          { id: 'editor', label: t.mobileTabEditor },
          { id: 'preview', label: t.mobileTabPreview },
          { id: 'settings', label: t.mobileTabSettings },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() =>
              setMobileWorkspaceTab(
                tab.id as 'editor' | 'preview' | 'settings'
              )
            }
            className={`flex-1 py-1.5 text-xs font-medium rounded-md ${
              mobileWorkspaceTab === tab.id
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Workspace: Clean 3-Zone Split with Independent Scrolling */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* Zone 1: Calm Markdown Editor (4 cols) */}
        <section
          aria-label="Markdown Editor"
          className={`lg:col-span-4 flex flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-0 ${
            mobileWorkspaceTab !== 'editor' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Single Consolidated Editor Toolbar */}
          <div className="h-10 shrink-0 px-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
            {/* Left: Quick Formatting Icons */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() =>
                  insertAtEditorCursor('\n## ', '', t.defaultH2Text)
                }
                title={t.insertH2}
                className="p-1.5 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <Heading2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  insertAtEditorCursor('**', '**', t.defaultBoldText)
                }
                title={t.insertBold}
                className="p-1.5 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  insertAtEditorCursor(
                    t.defaultQuotePrefix,
                    '\n',
                    t.defaultQuoteText
                  )
                }
                title={t.insertQuote}
                className="p-1.5 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertAtEditorCursor(t.defaultTableSnippet)}
                title={t.insertTable}
                className="p-1.5 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <Table className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  insertAtEditorCursor('\n\n---\n\n');
                  if (splitMode === 'single') {
                    setSplitMode('hr');
                    showToast(t.toastInsertedDivider);
                  }
                }}
                title={t.insertDivider}
                className="p-1.5 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5" />
              </button>

              <input
                ref={imageInsertInputRef}
                type="file"
                accept="image/*"
                onChange={handleInsertImageFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => imageInsertInputRef.current?.click()}
                title={t.insertImage}
                className="p-1.5 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <ImagePlus className="w-3.5 h-3.5" />
              </button>

              <span className="mx-1 h-3.5 w-px bg-slate-200 dark:bg-slate-800" />

              <button
                type="button"
                onClick={handleCleanseMarkdown}
                title={t.aiCleanseTitle}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5 shrink-0" />
                {t.aiCleanse}
              </button>
            </div>

            {/* Right: Template Select, File Import & Clear */}
            <div className="flex items-center gap-1 shrink-0">
              <select
                aria-label={t.selectTemplatePlaceholder}
                value=""
                onChange={(e) => {
                  if (e.target.value) handleSelectTemplate(e.target.value);
                }}
                className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded px-2 py-1 border-0 cursor-pointer focus:outline-none max-w-[115px] truncate"
              >
                <option value="" disabled>
                  {t.selectTemplatePlaceholder}
                </option>
                {MARKDOWN_TEMPLATES.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {t.templateNames[tpl.id] || tpl.name.split('（')[0]}
                  </option>
                ))}
              </select>

              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title={t.importMdFile}
                className="p-1.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              >
                <FileUp className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setMarkdown('')}
                title={t.clearEditor}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1.5 py-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t.clearEditor}
              </button>
            </div>
          </div>

          {/* Spacious Distraction-Free Textarea */}
          <div className="flex-1 flex flex-col min-h-0 relative">
            <label htmlFor="markdown-source-input" className="sr-only">
              Markdown Source Editor
            </label>
            <textarea
              ref={textareaRef}
              id="markdown-source-input"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              onPaste={handleEditorPaste}
              placeholder={t.editorPlaceholder}
              className="flex-1 w-full p-5 resize-none border-0 bg-transparent text-sm leading-relaxed font-mono-code text-slate-800 dark:text-slate-200 focus:outline-none"
            />

            {/* Subtle Bottom Status Pill */}
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
              <span>
                {t.statsSummary(
                  docStats.wordAndCjkCount,
                  docStats.readingMinutes
                )}
                {locatedLineHint !== null && (
                  <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-medium">
                    {t.locatedLine(locatedLineHint)}
                  </span>
                )}
              </span>
              <span>{t.pasteHint}</span>
            </div>
          </div>
        </section>

        {/* Zone 2: Clean Center Canvas Stage (5 cols) */}
        <section
          aria-label="Live Canvas Preview"
          className={`lg:col-span-5 flex flex-col bg-slate-100/90 dark:bg-slate-950 relative min-h-0 ${
            mobileWorkspaceTab !== 'preview' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {!markdown.trim() && (
            <div className="absolute inset-x-0 top-4 z-10 flex justify-center pointer-events-none">
              <button
                type="button"
                onClick={() => handleSelectTemplate(MARKDOWN_TEMPLATES[0].id)}
                className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 text-xs font-medium text-emerald-700 dark:text-emerald-400 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t.restoreSample}
              </button>
            </div>
          )}

          {/* Scrollable Canvas Stage */}
          <div
            ref={stageContainerRef}
            className="flex-1 overflow-auto p-6 sm:p-8"
          >
            <div className="w-fit mx-auto flex flex-col items-center gap-8 pb-10">
              {pages.map((pageMd, index) => {
                const maxFitScale =
                  stageWidth > 64
                    ? Math.min(1, (stageWidth - 40) / logicalWidth)
                    : 1;
                const effectiveScaleRatio =
                  (previewZoom / 100) * maxFitScale;

                return (
                  <div key={index} className="flex flex-col items-center gap-2">
                    {pages.length > 1 && (
                      <div className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 tabular-nums">
                        <span>
                          {t.cardIndexLabel(index + 1, pages.length)}
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            const node = cardRefs.current[index];
                            if (!node) return;
                            const url = await toPng(node, {
                              pixelRatio: exportMetrics.effectiveScale,
                              cacheBust: true,
                              skipFonts: true,
                            });
                            await copyDataUrlToClipboard(url, index);
                            showToast(t.toastCopiedCard(index + 1));
                          }}
                          className="hover:text-slate-900 dark:hover:text-white underline underline-offset-2 cursor-pointer"
                        >
                          {t.copySingleCard}
                        </button>
                      </div>
                    )}

                    <div
                      style={{
                        zoom:
                          effectiveScaleRatio < 0.999 ||
                          effectiveScaleRatio > 1.001
                            ? `${Math.round(effectiveScaleRatio * 100)}%`
                            : undefined,
                      }}
                    >
                      <MarkdownCardCanvas
                        pageMarkdown={pageMd}
                        pageIndex={index}
                        totalPages={pages.length}
                        theme={currentTheme}
                        config={cardStyleConfig}
                        imageVault={imageVault}
                        onLocateSourceText={handleLocateSourceText}
                        cardRef={(el) => {
                          cardRefs.current[index] = el;
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subtle Floating Bottom Canvas Status & Zoom Bar */}
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-4">
            <div className="pointer-events-auto inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs text-slate-600 dark:text-slate-400 tabular-nums">
              <span>
                {exportMetrics.physicalWidth} × {exportMetrics.physicalHeight}px ({exportMetrics.effectiveScale}x)
              </span>
              <span className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Zoom out"
                  onClick={() => setPreviewZoom((z) => Math.max(50, z - 10))}
                  className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(100)}
                  className="px-1 font-medium hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  {previewZoom}%
                </button>
                <button
                  type="button"
                  aria-label="Zoom in"
                  onClick={() => setPreviewZoom((z) => Math.min(130, z + 10))}
                  className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Zone 3: Unified, Tab-Free Style Sidebar (3 cols) */}
        <aside
          aria-label="Style and Export Controls"
          className={`lg:col-span-3 flex flex-col border-l border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-0 overflow-y-auto ${
            mobileWorkspaceTab !== 'settings' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="p-4 space-y-5">
            {/* 1. Canvas Size & Split Mode (Core Layout Controls) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {t.canvasSize}
                </span>
                <span className="text-xs font-mono-code text-slate-400 tabular-nums">
                  {logicalWidth}px
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {CANVAS_PRESETS.map((preset) => {
                  const active =
                    selectedPresetId === preset.id &&
                    logicalWidth === preset.logicalWidth;
                  const Icon =
                    preset.category === 'desktop'
                      ? Monitor
                      : preset.category === 'tablet'
                        ? Tablet
                        : Smartphone;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        active
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {t.canvasPresetLabels[preset.id] || preset.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Single vs Multi-Page Switch */}
              <div className="pt-1">
                <div
                  role="group"
                  aria-label="Pagination Mode"
                  className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg"
                >
                  <button
                    type="button"
                    onClick={() => setSplitMode('single')}
                    className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      splitMode === 'single'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {t.singleLongImage}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSplitMode((prev) =>
                        prev === 'single' ? 'auto-length' : prev
                      )
                    }
                    className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      splitMode !== 'single'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {t.smartPagination(pages.length)}
                  </button>
                </div>

                {splitMode !== 'single' && (
                  <div className="mt-2 space-y-2">
                    <select
                      aria-label="Split Rule"
                      value={splitMode}
                      onChange={(e) =>
                        setSplitMode(e.target.value as SplitMode)
                      }
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 font-medium"
                    >
                      <option value="auto-length">{t.splitByLength}</option>
                      <option value="h2">{t.splitByH2}</option>
                      <option value="hr">{t.splitByHr}</option>
                    </select>

                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                      {t.pageBudgetHint(
                        Math.round(pagination.budgetLogicalHeight),
                        pageBudget.scale
                      )}
                    </p>

                    <button
                      type="button"
                      onClick={() => setShowCharCapOverride((v) => !v)}
                      className="flex w-full items-center justify-between text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <span>{t.charCapAdvanced}</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${
                          showCharCapOverride ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showCharCapOverride && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500 shrink-0">
                          {t.charsPerPage}
                        </span>
                        <input
                          type="range"
                          min={1000}
                          max={20000}
                          step={500}
                          value={maxCharsPerPage}
                          onChange={(e) =>
                            setMaxCharsPerPage(Number(e.target.value))
                          }
                          className="flex-1 accent-slate-900 dark:accent-emerald-500"
                        />
                        <span className="font-mono-code w-12 text-right tabular-nums">
                          {maxCharsPerPage}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* 2. Theme Swatches (Compact 2-Col Pill Grid) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {t.themePalette}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSavingScheme((v) => !v)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <BookmarkPlus className="w-3 h-3" />
                  {isSavingScheme ? t.cancelSave : t.saveAsPreset}
                </button>
              </div>

              {isSavingScheme && (
                <form
                  onSubmit={handleSaveCustomScheme}
                  className="flex items-center gap-1.5 pb-1"
                >
                  <input
                    type="text"
                    value={newSchemeName}
                    onChange={(e) => setNewSchemeName(e.target.value)}
                    placeholder={t.presetNamePlaceholder}
                    className="flex-1 px-2.5 py-1 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-transparent"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-900 dark:bg-emerald-600 text-white cursor-pointer"
                  >
                    {t.saveBtn}
                  </button>
                </form>
              )}

              <div className="grid grid-cols-2 gap-1.5">
                {CARD_THEMES.map((theme) => {
                  const isSelected = theme.id === selectedThemeId;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedThemeId(theme.id)}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-slate-900 dark:border-emerald-500 bg-slate-50 dark:bg-slate-800/90 font-semibold'
                          : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0"
                        style={{ background: theme.cardBg }}
                      />
                      <span className="text-xs text-slate-800 dark:text-slate-100 truncate">
                        {t.themeNames[theme.id] || theme.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* 3. Typography & Font Size */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {t.bodyFontSize}
                  </span>
                  <span className="text-xs font-mono-code text-slate-400 tabular-nums">
                    {fontSize}px
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: t.fontSmall, val: 16 },
                    { label: t.fontMedium, val: 19 },
                    { label: t.fontLarge, val: 22 },
                    { label: t.fontXLarge, val: 26 },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setFontSize(item.val)}
                      className={`py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                        fontSize === item.val
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'sans', label: t.fontSans },
                  { id: 'serif', label: t.fontSerif },
                  { id: 'mono', label: t.fontMono },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() =>
                      setFontFamily(f.id as 'sans' | 'serif' | 'mono')
                    }
                    className={`py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                      fontFamily === f.id
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="pt-1 space-y-2">
                <label className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <span>{t.highlightBoldLabel}</span>
                  <input
                    type="checkbox"
                    checked={highlightBold}
                    onChange={(e) => setHighlightBold(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                </label>
                <label className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <span>{t.macWindowDotsLabel}</span>
                  <input
                    type="checkbox"
                    checked={showMacWindowBar}
                    onChange={(e) => setShowMacWindowBar(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                </label>
              </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* 4. Progressive Disclosure: Collapsible Header & Footer Settings */}
            <div>
              <button
                type="button"
                onClick={() => setShowHeaderFooterConfig((v) => !v)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 py-1 cursor-pointer"
              >
                <span>{t.headerFooterSection}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    showHeaderFooterConfig ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showHeaderFooterConfig && (
                <div className="mt-3 space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <span>{t.showTopHeader}</span>
                    <input
                      type="checkbox"
                      checked={showHeader}
                      onChange={(e) => setShowHeader(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                  </label>
                  {showHeader && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={headerTitle}
                        onChange={(e) => setHeaderTitle(e.target.value)}
                        placeholder={t.headerTitlePlaceholder}
                        className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-transparent"
                      />
                      <input
                        type="text"
                        value={headerBadge}
                        onChange={(e) => setHeaderBadge(e.target.value)}
                        placeholder={t.headerBadgePlaceholder}
                        className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-transparent"
                      />
                    </div>
                  )}

                  <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                    <span>{t.showBottomFooter}</span>
                    <input
                      type="checkbox"
                      checked={showFooter}
                      onChange={(e) => setShowFooter(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                  </label>
                  {showFooter && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={footerText}
                        onChange={(e) => setFooterText(e.target.value)}
                        placeholder={t.footerTextPlaceholder}
                        className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-transparent"
                      />
                      <input
                        type="url"
                        value={footerQrUrl}
                        onChange={(e) => setFooterQrUrl(e.target.value)}
                        placeholder={t.footerQrPlaceholder}
                        className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-transparent"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* 5. Progressive Disclosure: Advanced Margin, Spacing & Export Format */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvancedLayout((v) => !v)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 py-1 cursor-pointer"
              >
                <span>{t.advancedSection}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    showAdvancedLayout ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showAdvancedLayout && (
                <div className="mt-3 space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                  <div>
                    <div className="flex justify-between mb-1 text-slate-600 dark:text-slate-400">
                      <span>{t.customCanvasWidth}</span>
                      <span className="font-mono-code">{logicalWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min={320}
                      max={1200}
                      step={10}
                      value={logicalWidth}
                      onChange={(e) => {
                        setLogicalWidth(Number(e.target.value));
                        setSelectedPresetId('custom');
                      }}
                      className="w-full accent-slate-900 dark:accent-emerald-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 text-slate-600 dark:text-slate-400">
                      <span>{t.lineHeightLabel}</span>
                      <span className="font-mono-code">
                        {lineHeight.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1.4}
                      max={2.2}
                      step={0.05}
                      value={lineHeight}
                      onChange={(e) => setLineHeight(Number(e.target.value))}
                      className="w-full accent-slate-900 dark:accent-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between mb-1 text-slate-600 dark:text-slate-400">
                        <span>{t.innerPaddingLabel}</span>
                        <span className="font-mono-code">{cardPadding}px</span>
                      </div>
                      <input
                        type="range"
                        min={16}
                        max={64}
                        step={2}
                        value={cardPadding}
                        onChange={(e) => setCardPadding(Number(e.target.value))}
                        className="w-full accent-slate-900 dark:accent-emerald-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-slate-600 dark:text-slate-400">
                        <span>{t.outerFrameLabel}</span>
                        <span className="font-mono-code">
                          {outerFramePadding}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={48}
                        step={2}
                        value={outerFramePadding}
                        onChange={(e) =>
                          setOuterFramePadding(Number(e.target.value))
                        }
                        className="w-full accent-slate-900 dark:accent-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setExportFormat('png')}
                      className={`py-1.5 rounded-md border font-medium cursor-pointer ${
                        exportFormat === 'png'
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {t.pngLossless}
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportFormat('jpeg')}
                      className={`py-1.5 rounded-md border font-medium cursor-pointer ${
                        exportFormat === 'jpeg'
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {t.jpgLightweight}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { scale: 1, label: t.scale1x },
                      { scale: 2, label: t.scale2x },
                      { scale: 3, label: t.scale3x },
                    ].map((item) => (
                      <button
                        key={item.scale}
                        type="button"
                        onClick={() => setExportScale(item.scale)}
                        className={`py-1 rounded-md border font-medium cursor-pointer ${
                          exportScale === item.scale
                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="pt-1 space-y-1.5 text-slate-600 dark:text-slate-400">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>{t.wideTablesToList}</span>
                      <input
                        type="checkbox"
                        checked={convertWideTables}
                        onChange={(e) => setConvertWideTables(e.target.checked)}
                        className="rounded border-slate-300"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>{t.stripBareUrlsLabel}</span>
                      <input
                        type="checkbox"
                        checked={stripBareUrls}
                        onChange={(e) => setStripBareUrls(e.target.checked)}
                        className="rounded border-slate-300"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>

      {/* Modals */}
      <ExportPreviewModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        images={generatedImages}
        exportFormat={exportFormat}
        metrics={exportMetrics}
        locale={locale}
        onCopySingle={async (dataUrl, idx) => {
          try {
            await copyDataUrlToClipboard(dataUrl, idx);
            showToast(t.toastCopiedCard(idx + 1));
          } catch {
            showToast(t.toastManualCopyHint);
          }
        }}
        onDownloadSingle={handleDownloadSingle}
        onDownloadZip={handleDownloadZip}
        copiedPageIndex={copiedPageIndex}
      />
    </div>
  );
}
