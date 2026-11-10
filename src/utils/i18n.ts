export type Locale = 'zh' | 'en';

export interface I18nStrings {
  // Top Header
  copyImage: string;
  exportImage: string;
  exportImagesCount: (count: number) => string;
  generating: string;
  toggleDarkMode: string;
  toggleLanguage: string;

  // Mobile Workspace Switcher
  mobileTabEditor: string;
  mobileTabPreview: string;
  mobileTabSettings: string;

  // Editor Toolbar & Footer
  insertH2: string;
  insertBold: string;
  insertQuote: string;
  insertTable: string;
  insertDivider: string;
  insertImage: string;
  aiCleanse: string;
  aiCleanseTitle: string;
  selectTemplatePlaceholder: string;
  importMdFile: string;
  clearEditor: string;
  editorPlaceholder: string;
  statsSummary: (words: number, minutes: number) => string;
  locatedLine: (line: number) => string;
  pasteHint: string;
  restoreSample: string;
  cardIndexLabel: (index: number, total: number) => string;
  copySingleCard: string;

  // Right Sidebar
  canvasSize: string;
  singleLongImage: string;
  smartPagination: (pages: number) => string;
  splitByHr: string;
  splitByH2: string;
  splitByLength: string;
  charsPerPage: string;
  themePalette: string;
  saveAsPreset: string;
  cancelSave: string;
  presetNamePlaceholder: string;
  saveBtn: string;
  bodyFontSize: string;
  fontSmall: string;
  fontMedium: string;
  fontLarge: string;
  fontXLarge: string;
  fontSans: string;
  fontSerif: string;
  fontMono: string;
  highlightBoldLabel: string;
  macWindowDotsLabel: string;
  headerFooterSection: string;
  showTopHeader: string;
  headerTitlePlaceholder: string;
  headerBadgePlaceholder: string;
  showBottomFooter: string;
  footerTextPlaceholder: string;
  footerQrPlaceholder: string;
  advancedSection: string;
  customCanvasWidth: string;
  lineHeightLabel: string;
  innerPaddingLabel: string;
  outerFrameLabel: string;
  pngLossless: string;
  jpgLightweight: string;
  scale1x: string;
  scale2x: string;
  scale3x: string;
  wideTablesToList: string;
  stripBareUrlsLabel: string;

  // Export Modal
  modalTitle: string;
  modalSummary: (
    count: number,
    w: number,
    h: number,
    scale: number,
    kb: number,
    fmt: string
  ) => string;
  modalTipMobileTitle: string;
  modalTipMobileBody: string;
  modalTipDesktopTitle: string;
  modalTipDesktopBody: string;
  downloadAllZip: (count: number) => string;
  singlePageItemLabel: (idx: number, total: number, kb: number) => string;
  fullLongImageLabel: (kb: number) => string;
  copiedLabel: string;
  downloadFormat: (fmt: string) => string;

  // Toasts & Default Snippets
  toastAppliedScheme: (name: string) => string;
  toastEnterPresetName: string;
  toastSavedPreset: (name: string) => string;
  toastDeletedPreset: string;
  toastLoadedTemplate: (name: string) => string;
  toastPastedImage: string;
  toastConvertedRichHtml: string;
  toastInsertedImage: (name: string) => string;
  toastInsertImageFailed: string;
  toastCleansed: string;
  toastImportedFile: (name: string) => string;
  toastEmptyContent: string;
  toastExportFailed: string;
  toastCopiedClipboard: string;
  toastManualCopyHint: string;
  toastCopiedCard: (idx: number) => string;
  toastDownloadedCard: (idx: number) => string;
  toastDownloadedZip: (count: number) => string;
  toastInsertedDivider: string;

  // Default Insert Snippets
  defaultH2Text: string;
  defaultBoldText: string;
  defaultQuotePrefix: string;
  defaultQuoteText: string;
  defaultTableSnippet: string;

  // Built-in Scheme Names
  schemeNames: Record<string, string>;
  // Canvas Preset Short Labels
  canvasPresetLabels: Record<string, string>;
  // Theme Names
  themeNames: Record<string, string>;
  // Template Names
  templateNames: Record<string, string>;
}

export const I18N: Record<Locale, I18nStrings> = {
  zh: {
    copyImage: '复制图片',
    exportImage: '导出高清图',
    exportImagesCount: (count) => `导出高清图 (${count}张)`,
    generating: '正在生成...',
    toggleDarkMode: '切换亮暗模式',
    toggleLanguage: 'Switch to English',

    mobileTabEditor: '编辑内容',
    mobileTabPreview: '图片预览',
    mobileTabSettings: '外观排版',

    insertH2: '插入二级标题',
    insertBold: '加粗高亮',
    insertQuote: '插入提示引用框',
    insertTable: '插入表格',
    insertDivider: '插入分页分割线 (---)',
    insertImage: '插入配图（也支持直接粘贴截图）',
    aiCleanse: 'AI 净化',
    aiCleanseTitle: '清理 AI 开场白与多余空行',
    selectTemplatePlaceholder: '示例模板...',
    importMdFile: '导入本地 .md 文件',
    clearEditor: '清空',
    editorPlaceholder: '在此输入或粘贴 Markdown、网页富文本或截图...',
    statsSummary: (words, minutes) => `${words} 字 · 约 ${minutes} 分钟阅读`,
    locatedLine: (line) => `· 已定位第 ${line} 行`,
    pasteHint: '支持粘贴富文本自动转 MD 与 Ctrl+V 贴图',
    restoreSample: '恢复示例文档',
    cardIndexLabel: (idx, total) => `卡片 ${idx} / ${total}`,
    copySingleCard: '复制此张',

    canvasSize: '画布尺寸',
    singleLongImage: '一图流长图',
    smartPagination: (pages) => `智能分页 (${pages}页)`,
    splitByHr: '按分割线 (---) 切分卡片',
    splitByH2: '按二级标题 (##) 切分卡片',
    splitByLength: '按手机屏高字数自动切分',
    charsPerPage: '单页字数',
    themePalette: '主题配色',
    saveAsPreset: '存为预设',
    cancelSave: '取消',
    presetNamePlaceholder: '输入预设名称...',
    saveBtn: '保存',
    bodyFontSize: '正文字号',
    fontSmall: '小 16',
    fontMedium: '中 19',
    fontLarge: '大 22',
    fontXLarge: '特大 26',
    fontSans: '现代黑体',
    fontSerif: '人文宋体',
    fontMono: '极客等宽',
    highlightBoldLabel: '加粗文字荧光笔高亮',
    macWindowDotsLabel: '显示顶部 Mac 窗口圆点',
    headerFooterSection: '页眉与落款二维码',
    showTopHeader: '显示顶部页眉栏',
    headerTitlePlaceholder: '顶部栏目名',
    headerBadgePlaceholder: '右上角标签',
    showBottomFooter: '显示底部落款与二维码',
    footerTextPlaceholder: '底部落款说明',
    footerQrPlaceholder: '分享二维码链接 (选填)',
    advancedSection: '边距微调与导出格式',
    customCanvasWidth: '自定义画布宽度',
    lineHeightLabel: '行距倍数',
    innerPaddingLabel: '内边距',
    outerFrameLabel: '外画框',
    pngLossless: 'PNG 无损高清',
    jpgLightweight: 'JPG 轻量长图',
    scale1x: '1x 标准',
    scale2x: '2x 高清',
    scale3x: '3x 超清',
    wideTablesToList: 'AI 净化时将宽表格转为列表',
    stripBareUrlsLabel: 'AI 净化时移除裸链接',

    modalTitle: '图片已生成 · 支持一键复制或手机长按保存',
    modalSummary: (count, w, h, scale, kb, fmt) =>
      `共 ${count} 张 · 物理分辨率 ${w} × ${h} px (${scale}x) · 合计约 ${kb} KB · ${fmt}`,
    modalTipMobileTitle: '手机端提示',
    modalTipMobileBody: '：直接长按下方图片即可「保存到相册」或「发送给朋友」；',
    modalTipDesktopTitle: '电脑端提示',
    modalTipDesktopBody: '：点击「复制图片」后切到聊天窗口按 Ctrl+V / Cmd+V 直接粘贴。',
    downloadAllZip: (count) => `打包下载全部 (${count} 张 ZIP)`,
    singlePageItemLabel: (idx, total, kb) =>
      `第 ${idx} / ${total} 张 · 约 ${kb} KB`,
    fullLongImageLabel: (kb) => `完整长图 · 约 ${kb} KB`,
    copiedLabel: '已复制',
    downloadFormat: (fmt) => `下载 ${fmt}`,

    toastAppliedScheme: (name) => `已应用预设：${name}`,
    toastEnterPresetName: '请输入自定义方案名称',
    toastSavedPreset: (name) => `已保存预设：${name}`,
    toastDeletedPreset: '已删除自定义方案',
    toastLoadedTemplate: (name) => `已载入示例：${name}`,
    toastPastedImage: '已将剪贴板图片嵌入文档',
    toastConvertedRichHtml: '已自动将粘贴的富文本转为 Markdown',
    toastInsertedImage: (name) => `已插入图片：${name}`,
    toastInsertImageFailed: '插入图片失败',
    toastCleansed: '已清理 AI 寒暄语并优化手机排版间距',
    toastImportedFile: (name) => `已导入：${name}`,
    toastEmptyContent: '请先输入或粘贴 Markdown 内容',
    toastExportFailed: '生成图片失败，请尝试切换分页模式',
    toastCopiedClipboard: '高清图已复制到剪贴板，可直接粘贴发送！',
    toastManualCopyHint: '请在弹窗中长按或右键复制图片',
    toastCopiedCard: (idx) => `已复制第 ${idx} 张卡片`,
    toastDownloadedCard: (idx) => `已下载第 ${idx} 张图片`,
    toastDownloadedZip: (count) => `已打包下载全部 ${count} 张图片`,
    toastInsertedDivider: '已插入分割线并开启分页多图',

    defaultH2Text: '小节标题',
    defaultBoldText: '重点文字',
    defaultQuotePrefix: '\n> **提示**：',
    defaultQuoteText: '在此输入要点',
    defaultTableSnippet:
      '\n\n| 项目 | 标准 | 备注 |\n| :--- | :--- | :--- |\n| 示例 | 正常 | 保持规律 |\n\n',

    schemeNames: {
      'scheme-default-clean': '纯净默认',
      'scheme-parents': '爸妈微信大字',
      'scheme-mobile-card': '手机清爽卡片',
      'scheme-desktop-tech': '桌面技术周报',
    },
    canvasPresetLabels: {
      'mobile-comfort': '手机 380px',
      'mobile-plus': '大屏 440px',
      'mobile-wide': '宽屏 540px',
      'desktop-doc': '桌面 820px',
      'desktop-hd': '超宽 1040px',
    },
    themeNames: {
      'warm-care': '暖阳护眼',
      'wechat-fresh': '微信翠竹',
      'notion-clean': '极简白纸',
      'senior-contrast': '长辈高对比',
      'mac-studio': 'Mac 拟物窗口',
      'github-dark': '深邃暗黑',
      'editorial-press': '学院报刊',
      'sunset-poster': '微光海报',
    },
    templateNames: {
      'parents-health': '父母健康科普',
      'weekend-trip': '家庭周末出行攻略',
      'tech-summary': 'AI 技术笔记与公式',
    },
  },
  en: {
    copyImage: 'Copy Image',
    exportImage: 'Export HD',
    exportImagesCount: (count) => `Export HD (${count})`,
    generating: 'Rendering...',
    toggleDarkMode: 'Toggle Dark Mode',
    toggleLanguage: '切换到中文',

    mobileTabEditor: 'Editor',
    mobileTabPreview: 'Preview',
    mobileTabSettings: 'Style',

    insertH2: 'Insert Heading (H2)',
    insertBold: 'Bold / Highlight',
    insertQuote: 'Insert Callout Quote',
    insertTable: 'Insert Table',
    insertDivider: 'Insert Page Break (---)',
    insertImage: 'Insert Image (or Ctrl+V paste)',
    aiCleanse: 'AI Cleanse',
    aiCleanseTitle: 'Strip AI conversational filler & normalize spacing',
    selectTemplatePlaceholder: 'Templates...',
    importMdFile: 'Import .md file',
    clearEditor: 'Clear',
    editorPlaceholder:
      'Type or paste Markdown, rich web text, or screenshots (Ctrl+V)...',
    statsSummary: (words, minutes) => `${words} words · ~${minutes} min read`,
    locatedLine: (line) => `· Line ${line}`,
    pasteHint: 'Auto-converts rich HTML paste & Ctrl+V images',
    restoreSample: 'Restore Sample',
    cardIndexLabel: (idx, total) => `Card ${idx} / ${total}`,
    copySingleCard: 'Copy Card',

    canvasSize: 'Canvas Width',
    singleLongImage: 'Single Long Image',
    smartPagination: (pages) => `Multi-Card (${pages}p)`,
    splitByHr: 'Split by Divider (---)',
    splitByH2: 'Split by Heading (##)',
    splitByLength: 'Auto-Split by Length',
    charsPerPage: 'Chars/Page',
    themePalette: 'Themes',
    saveAsPreset: '+ Save Preset',
    cancelSave: 'Cancel',
    presetNamePlaceholder: 'Preset name...',
    saveBtn: 'Save',
    bodyFontSize: 'Font Size',
    fontSmall: 'S 16',
    fontMedium: 'M 19',
    fontLarge: 'L 22',
    fontXLarge: 'XL 26',
    fontSans: 'Sans',
    fontSerif: 'Serif',
    fontMono: 'Mono',
    highlightBoldLabel: 'Marker Highlight on Bold Text',
    macWindowDotsLabel: 'Show macOS Window Dots',
    headerFooterSection: 'Header, Footer & QR Code',
    showTopHeader: 'Show Top Header',
    headerTitlePlaceholder: 'Header title',
    headerBadgePlaceholder: 'Right badge',
    showBottomFooter: 'Show Footer & QR Code',
    footerTextPlaceholder: 'Footer signature text',
    footerQrPlaceholder: 'QR Code URL (optional)',
    advancedSection: 'Padding & Export Format',
    customCanvasWidth: 'Custom Width',
    lineHeightLabel: 'Line Height',
    innerPaddingLabel: 'Inner Padding',
    outerFrameLabel: 'Outer Frame',
    pngLossless: 'PNG Lossless',
    jpgLightweight: 'JPG Compact',
    scale1x: '1x Standard',
    scale2x: '2x Retina',
    scale3x: '3x Ultra HD',
    wideTablesToList: 'Convert wide tables on AI Cleanse',
    stripBareUrlsLabel: 'Strip bare URLs on AI Cleanse',

    modalTitle: 'HD Images Ready · Copy to Clipboard or Download',
    modalSummary: (count, w, h, scale, kb, fmt) =>
      `${count} image(s) · ${w} × ${h} px (${scale}x) · ~${kb} KB total · ${fmt}`,
    modalTipMobileTitle: 'Mobile Tip',
    modalTipMobileBody: ': Long-press any image below to save to Photos or share; ',
    modalTipDesktopTitle: 'Desktop Tip',
    modalTipDesktopBody: ': Click "Copy Image" and press Ctrl+V / Cmd+V in any chat app.',
    downloadAllZip: (count) => `Download All (${count} ZIP)`,
    singlePageItemLabel: (idx, total, kb) =>
      `Card ${idx} of ${total} · ~${kb} KB`,
    fullLongImageLabel: (kb) => `Full Long Image · ~${kb} KB`,
    copiedLabel: 'Copied',
    downloadFormat: (fmt) => `Download ${fmt}`,

    toastAppliedScheme: (name) => `Applied preset: ${name}`,
    toastEnterPresetName: 'Please enter a preset name',
    toastSavedPreset: (name) => `Saved preset: ${name}`,
    toastDeletedPreset: 'Deleted custom preset',
    toastLoadedTemplate: (name) => `Loaded template: ${name}`,
    toastPastedImage: 'Embedded clipboard image into document',
    toastConvertedRichHtml: 'Converted rich HTML paste to Markdown',
    toastInsertedImage: (name) => `Inserted image: ${name}`,
    toastInsertImageFailed: 'Failed to insert image',
    toastCleansed: 'Cleaned AI filler and normalized spacing',
    toastImportedFile: (name) => `Imported: ${name}`,
    toastEmptyContent: 'Please enter or paste Markdown content first',
    toastExportFailed: 'Export failed, try enabling Multi-Card pagination',
    toastCopiedClipboard: 'HD image copied to clipboard!',
    toastManualCopyHint: 'Long-press or right-click the image to copy',
    toastCopiedCard: (idx) => `Copied card #${idx}`,
    toastDownloadedCard: (idx) => `Downloaded image #${idx}`,
    toastDownloadedZip: (count) => `Downloaded all ${count} images as ZIP`,
    toastInsertedDivider: 'Inserted divider and enabled Multi-Card mode',

    defaultH2Text: 'Section Title',
    defaultBoldText: 'key point',
    defaultQuotePrefix: '\n> **Note**: ',
    defaultQuoteText: 'Enter key takeaway here',
    defaultTableSnippet:
      '\n\n| Item | Target | Notes |\n| :--- | :--- | :--- |\n| Example | Optimal | Keep routine |\n\n',

    schemeNames: {
      'scheme-default-clean': 'Pure Default',
      'scheme-parents': 'Parents Large',
      'scheme-mobile-card': 'Mobile Card',
      'scheme-desktop-tech': 'Desktop Tech',
    },
    canvasPresetLabels: {
      'mobile-comfort': 'Mobile 380px',
      'mobile-plus': 'Plus 440px',
      'mobile-wide': 'Wide 540px',
      'desktop-doc': 'Desktop 820px',
      'desktop-hd': 'Ultra 1040px',
    },
    themeNames: {
      'warm-care': 'Warm Care',
      'wechat-fresh': 'WeChat Fresh',
      'notion-clean': 'Notion Clean',
      'senior-contrast': 'High Contrast',
      'mac-studio': 'Mac Studio',
      'github-dark': 'GitHub Dark',
      'editorial-press': 'Editorial',
      'sunset-poster': 'Sunset Poster',
    },
    templateNames: {
      'parents-health': 'Family Health Guide',
      'weekend-trip': 'Weekend Trip Checklist',
      'tech-summary': 'AI Tech & Math Notes',
    },
  },
};
