export interface CardTheme {
  id: string;
  name: string;
  subtitle: string;
  outerBg: string; // CSS background for outer frame
  cardBg: string;
  textColor: string;
  secondaryTextColor: string;
  headingColor: string;
  accentColor: string;
  accentBg: string;
  borderColor: string;
  codeBg: string;
  codeText: string;
  blockquoteBg: string;
  blockquoteText: string;
  tableHeaderBg: string;
  tableStripeBg: string;
  isDark?: boolean;
  macHeader?: boolean;
}

export interface CanvasPreset {
  id: string;
  label: string;
  shortLabel: string;
  category: 'mobile' | 'tablet' | 'desktop' | 'custom';
  logicalWidth: number;
  recommendedFontSize: number;
  recommendedPadding: number;
  description: string;
}

export const CANVAS_PRESETS: CanvasPreset[] = [
  {
    id: 'mobile-comfort',
    label: '手机竖屏舒适',
    shortLabel: '手机 380px',
    category: 'mobile',
    logicalWidth: 380,
    recommendedFontSize: 20,
    recommendedPadding: 28,
    description: '单手满屏免放大，适合微信直接发长辈或朋友（3x导出 = 1140px物理宽）',
  },
  {
    id: 'mobile-plus',
    label: '手机大屏标准',
    shortLabel: '大屏 440px',
    category: 'mobile',
    logicalWidth: 440,
    recommendedFontSize: 18,
    recommendedPadding: 32,
    description: '主流大屏手机黄金比例，兼顾大字号与单行信息容量（3x导出 = 1320px物理宽）',
  },
  {
    id: 'mobile-wide',
    label: '手机宽屏/轻平板',
    shortLabel: '宽屏 540px',
    category: 'tablet',
    logicalWidth: 540,
    recommendedFontSize: 17,
    recommendedPadding: 36,
    description: '适合含多列表格、代码块或流程图的结构化 AI 回答',
  },
  {
    id: 'desktop-doc',
    label: '桌面端宽屏文档',
    shortLabel: '桌面 820px',
    category: 'desktop',
    logicalWidth: 820,
    recommendedFontSize: 16,
    recommendedPadding: 48,
    description: '适合发电脑微信/飞书/钉钉群、技术周报、完整文档海报',
  },
  {
    id: 'desktop-hd',
    label: '桌面超宽全屏',
    shortLabel: '超宽 1040px',
    category: 'desktop',
    logicalWidth: 1040,
    recommendedFontSize: 16,
    recommendedPadding: 56,
    description: '适合复杂架构对比表、多列代码对比与桌面大屏展示',
  },
];

export const CARD_THEMES: CardTheme[] = [
  {
    id: 'warm-care',
    name: '暖阳护眼',
    subtitle: '柔和米黄纸感 · 长时间阅读不刺眼',
    outerBg: 'linear-gradient(145deg, #EAE2D3 0%, #DFD5C3 100%)',
    cardBg: '#FBF8F1',
    textColor: '#26231E',
    secondaryTextColor: '#6E6659',
    headingColor: '#16130F',
    accentColor: '#B45309',
    accentBg: '#FEF3C7',
    borderColor: '#E6DEC8',
    codeBg: '#F2ECE1',
    codeText: '#3E382F',
    blockquoteBg: '#F4EFE4',
    blockquoteText: '#4A4238',
    tableHeaderBg: '#EFE8D8',
    tableStripeBg: '#F7F3E9',
  },
  {
    id: 'wechat-fresh',
    name: '微信翠竹',
    subtitle: '国民级清爽绿意 · 适合健康与生活科普',
    outerBg: 'linear-gradient(135deg, #D8EFE2 0%, #C3E6D3 100%)',
    cardBg: '#FFFFFF',
    textColor: '#1E2923',
    secondaryTextColor: '#5B6E63',
    headingColor: '#075E36',
    accentColor: '#07C160',
    accentBg: '#E7F8EE',
    borderColor: '#E2ECE6',
    codeBg: '#F3F8F5',
    codeText: '#1A3A2A',
    blockquoteBg: '#F0F9F4',
    blockquoteText: '#264E3A',
    tableHeaderBg: '#EBF6F0',
    tableStripeBg: '#F7FBF9',
  },
  {
    id: 'notion-clean',
    name: '极简白纸',
    subtitle: '现代数字文档风 · 干净克制',
    outerBg: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
    cardBg: '#FFFFFF',
    textColor: '#1E293B',
    secondaryTextColor: '#64748B',
    headingColor: '#0F172A',
    accentColor: '#2563EB',
    accentBg: '#DBEAFE',
    borderColor: '#E2E8F0',
    codeBg: '#F8FAFC',
    codeText: '#0F172A',
    blockquoteBg: '#F8FAFC',
    blockquoteText: '#334155',
    tableHeaderBg: '#F1F5F9',
    tableStripeBg: '#F8FAFC',
  },
  {
    id: 'senior-contrast',
    name: '长辈高对比',
    subtitle: '加深字重与暖白底 · 爸妈免戴老花镜',
    outerBg: 'linear-gradient(135deg, #E5DDD0 0%, #D6CBB9 100%)',
    cardBg: '#FFFDF9',
    textColor: '#111111',
    secondaryTextColor: '#4B4843',
    headingColor: '#991B1B',
    accentColor: '#B91C1C',
    accentBg: '#FEE2E2',
    borderColor: '#D6CFC2',
    codeBg: '#F5F2EB',
    codeText: '#111111',
    blockquoteBg: '#FEF2F2',
    blockquoteText: '#1F2937',
    tableHeaderBg: '#F3EEE4',
    tableStripeBg: '#FAF7F2',
  },
  {
    id: 'mac-studio',
    name: 'Mac 拟物窗口',
    subtitle: '精致红黄绿标题栏 · 适合技术与效率笔记',
    outerBg: 'linear-gradient(135deg, #CBD5E1 0%, #94A3B8 100%)',
    cardBg: '#FFFFFF',
    textColor: '#1E293B',
    secondaryTextColor: '#64748B',
    headingColor: '#0F172A',
    accentColor: '#0284C7',
    accentBg: '#E0F2FE',
    borderColor: '#E2E8F0',
    codeBg: '#0F172A',
    codeText: '#E2E8F0',
    blockquoteBg: '#F1F5F9',
    blockquoteText: '#334155',
    tableHeaderBg: '#F1F5F9',
    tableStripeBg: '#F8FAFC',
    macHeader: true,
  },
  {
    id: 'github-dark',
    name: '深邃暗黑',
    subtitle: 'OLED 夜间护眼 · 极客代码高对比',
    outerBg: 'linear-gradient(135deg, #090D16 0%, #111827 100%)',
    cardBg: '#161F30',
    textColor: '#E2E8F0',
    secondaryTextColor: '#94A3B8',
    headingColor: '#F8FAFC',
    accentColor: '#38BDF8',
    accentBg: 'rgba(56, 189, 248, 0.18)',
    borderColor: '#26334D',
    codeBg: '#0B111E',
    codeText: '#E2E8F0',
    blockquoteBg: '#1E293B',
    blockquoteText: '#CBD5E1',
    tableHeaderBg: '#1E293B',
    tableStripeBg: '#192336',
    isDark: true,
    macHeader: true,
  },
  {
    id: 'editorial-press',
    name: '学院报刊',
    subtitle: '人文书卷气息 · 适合深度长文与书评',
    outerBg: 'linear-gradient(135deg, #DDD6FE 0%, #E0E7FF 100%)',
    cardBg: '#FAF9F6',
    textColor: '#1C1917',
    secondaryTextColor: '#57534E',
    headingColor: '#312E81',
    accentColor: '#4F46E5',
    accentBg: '#E0E7FF',
    borderColor: '#E7E5E4',
    codeBg: '#F5F5F4',
    codeText: '#292524',
    blockquoteBg: '#EEF2FF',
    blockquoteText: '#312E81',
    tableHeaderBg: '#F0EFEA',
    tableStripeBg: '#F7F6F2',
  },
  {
    id: 'sunset-poster',
    name: '微光海报',
    subtitle: '温暖渐变画框 · 适合社媒分享与金句卡片',
    outerBg: 'linear-gradient(135deg, #FDE68A 0%, #FCA5A5 50%, #C4B5FD 100%)',
    cardBg: 'rgba(255, 255, 255, 0.96)',
    textColor: '#1F2937',
    secondaryTextColor: '#6B7280',
    headingColor: '#111827',
    accentColor: '#DB2777',
    accentBg: '#FCE7F3',
    borderColor: '#F3E8FF',
    codeBg: '#F9FAFB',
    codeText: '#1F2937',
    blockquoteBg: '#FDF2F8',
    blockquoteText: '#831843',
    tableHeaderBg: '#FDF2F8',
    tableStripeBg: '#FAFAFA',
  },
];

export interface UserStyleScheme {
  id: string;
  name: string;
  isBuiltIn?: boolean;
  logicalWidth: number;
  selectedThemeId: string;
  fontSize: number;
  lineHeight: number;
  cardPadding: number;
  outerFramePadding: number;
  fontFamily: 'sans' | 'serif' | 'mono';
  highlightBold: boolean;
  showMacWindowBar: boolean;
  showHeader: boolean;
  headerTitle: string;
  headerBadge: string;
  showFooter: boolean;
  footerText: string;
}

export const DEFAULT_STYLE_SCHEMES: UserStyleScheme[] = [
  {
    id: 'scheme-default-clean',
    name: '纯净默认',
    isBuiltIn: true,
    logicalWidth: 380,
    selectedThemeId: 'notion-clean',
    fontSize: 18,
    lineHeight: 1.75,
    cardPadding: 24,
    outerFramePadding: 0,
    fontFamily: 'sans',
    highlightBold: false,
    showMacWindowBar: false,
    showHeader: false,
    headerTitle: '家庭健康实用笔记',
    headerBadge: '手机大字护眼版',
    showFooter: false,
    footerText: '整理自 AI 助手 · 转发给家人随时查看',
  },
  {
    id: 'scheme-parents',
    name: '爸妈微信大字',
    isBuiltIn: true,
    logicalWidth: 380,
    selectedThemeId: 'warm-care',
    fontSize: 22,
    lineHeight: 1.85,
    cardPadding: 28,
    outerFramePadding: 16,
    fontFamily: 'sans',
    highlightBold: true,
    showMacWindowBar: false,
    showHeader: true,
    headerTitle: '家庭健康实用笔记',
    headerBadge: '手机大字护眼版',
    showFooter: true,
    footerText: '整理自 AI 助手 · 转发给家人随时查看',
  },
  {
    id: 'scheme-mobile-card',
    name: '手机清爽卡片',
    isBuiltIn: true,
    logicalWidth: 440,
    selectedThemeId: 'wechat-fresh',
    fontSize: 18,
    lineHeight: 1.75,
    cardPadding: 32,
    outerFramePadding: 20,
    fontFamily: 'sans',
    highlightBold: true,
    showMacWindowBar: false,
    showHeader: true,
    headerTitle: '今日精选干货',
    headerBadge: '手机满屏适读',
    showFooter: true,
    footerText: '长按保存高清卡片 · 欢迎分享',
  },
  {
    id: 'scheme-desktop-tech',
    name: '桌面技术周报',
    isBuiltIn: true,
    logicalWidth: 820,
    selectedThemeId: 'mac-studio',
    fontSize: 16,
    lineHeight: 1.7,
    cardPadding: 44,
    outerFramePadding: 24,
    fontFamily: 'sans',
    highlightBold: true,
    showMacWindowBar: true,
    showHeader: false,
    headerTitle: '技术架构周报',
    headerBadge: '桌面宽屏版',
    showFooter: true,
    footerText: 'Generated with MarkSnap Studio',
  },
];

