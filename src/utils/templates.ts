export interface MarkdownTemplate {
  id: string;
  name: string;
  badge: string;
  headerTitle: string;
  headerBadge: string;
  recommendedPresetId: string;
  recommendedThemeId: string;
  recommendedFontSize: number;
  content: string;
}

export const MARKDOWN_TEMPLATES: MarkdownTemplate[] = [
  {
    id: 'parents-health',
    name: '父母健康科普（微信适老版）',
    badge: '手机大字首选',
    headerTitle: '家庭健康实用笔记',
    headerBadge: '手机大字护眼版',
    recommendedPresetId: 'mobile-comfort',
    recommendedThemeId: 'warm-care',
    recommendedFontSize: 22,
    content: `# 换季血压波动：给爸妈的 4 条实用叮嘱

入秋后早晚温差变大，血管容易收缩，血压比夏天更容易出现波动。整理了医生最常叮嘱的 **4 个日常关键习惯**，平时对照看看就很安心。

> **核心原则**：起床慢半拍、测量定时间、吃药不凭感觉、出门护好颈部。

---

## 一、每天什么时候量血压最准？

建议固定在每天的**两个黄金时间点**测量，这样前后对比最有参考价值：

1. **早晨起床后 1 小时内**：排尿后、吃早饭和吃降压药之前，静坐休息 5 分钟再测。
2. **晚上睡前**：洗漱完毕准备上床前，静坐 5 分钟测量。

| 血压分级 | 收缩压(高压) | 舒张压(低压) | 日常应对建议 |
| :--- | :--- | :--- | :--- |
| **理想范围** | < 120 | < 80 | 继续保持规律作息与适度散步 |
| **家庭正常上限** | < 135 | < 85 | 每周固定记录 2~3 次即可 |
| **需要留心偏高** | ≥ 140 | ≥ 90 | 连续3天偏高请带记录本咨询医生 |

---

## 二、日常最容易忽视的 3 个细节

- **醒来先躺 30 秒**：早上醒来不要猛地坐起，先在床上活动一下手脚，慢坐半分钟再下床。
- **不要看血压正常就自己停药**：血压平稳正是降压药在起作用，擅自停药反而容易引起反弹。
- **温水泡脚别太烫**：水温控制在 **40℃ 左右**（手摸着温热不烫），时间 15 分钟刚好，微汗即可。`,
  },
  {
    id: 'ai-travel-plan',
    name: '家庭周末出行攻略（带流程图）',
    badge: '图文混排',
    headerTitle: '家庭周末慢游攻略',
    headerBadge: '平路不累腿版',
    recommendedPresetId: 'mobile-plus',
    recommendedThemeId: 'wechat-fresh',
    recommendedFontSize: 19,
    content: `# 周末带爸妈去杭州两日慢游清单

这次行程专门避开了陡峭台阶和拥挤打卡点，全程以**平路漫步 + 游船代步**为主，轻松不累腿。

\`\`\`mermaid
flowchart TD
  A[周六上午: 高铁抵达杭州东] --> B[打车直达酒店放行李]
  B --> C[下午: 西湖摇橹船 + 花港观鱼平路慢走]
  C --> D[傍晚: 知味观/湖畔清淡杭帮菜]
  D --> E[周日上午: 龙井村喝茶听溪水]
\`\`\`

## 必带随身物品清单

- **证件类**：身份证（满 60/70 周岁景点免票或半价）、医保卡
- **穿搭建议**：防滑软底健步鞋、薄款防风外套一件
- **随身小包**：保温杯、常用随身药盒、折叠晴雨伞

| 时间段 | 行程安排 | 体力消耗 | 贴心提示 |
| :--- | :--- | :--- | :--- |
| **周六 14:00** | 郭庄 — 乘手划船游内西湖 | 轻松坐船 | 船工慢摇约1.5小时，不用走路 |
| **周六 17:30** | 湖滨银泰附近晚餐 | 散步可达 | 点龙井虾仁、宋嫂鱼羹，少油少盐 |
| **周日 09:30** | 九溪烟树入口平路喝茶 | 缓坡平路 | 只走前段平路，累了随时坐茶室 |`,
  },
  {
    id: 'tech-summary',
    name: 'AI 技术笔记与公式（桌面/宽屏）',
    badge: '代码+公式',
    headerTitle: '算法与工程速查笔记',
    headerBadge: '桌面宽屏视图',
    recommendedPresetId: 'desktop-doc',
    recommendedThemeId: 'mac-studio',
    recommendedFontSize: 16,
    content: `# 注意力机制 (Scaled Dot-Product Attention) 核心速查

在现代 Transformer 架构中，缩放点积注意力通过查询向量 $Q$、键向量 $K$ 与值向量 $V$ 的矩阵运算捕获序列长程依赖。

## 1. 核心数学公式

给定输入维度 $d_k$，注意力权重矩阵的计算公式如下：

$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$

其中缩放因子 $\\frac{1}{\\sqrt{d_k}}$ 用于防止内积过大导致 $\\text{softmax}$ 进入梯度饱和区。

## 2. TypeScript 矩阵归一化示例

\`\`\`typescript
// 计算向量 Softmax 概率分布
export function softmax(logits: number[]): number[] {
  const maxLogit = Math.max(...logits);
  const exps = logits.map((x) => Math.exp(x - maxLogit));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  return exps.map((val) => Number((val / sumExps).toFixed(4)));
}
\`\`\`

| 模块名称 | 时间复杂度 | 空间复杂度 | 核心作用 |
| :--- | :--- | :--- | :--- |
| **Self-Attention** | $O(n^2 \\cdot d)$ | $O(n^2)$ | 全局上下文特征交互 |
| **FlashAttention** | $O(n^2 \\cdot d)$ | $O(n)$ | 分块计算降低显存读写 |
| **Linear Attention** | $O(n \\cdot d^2)$ | $O(n \\cdot d)$ | 超长文本近似线性加速 |`,
  },
];
