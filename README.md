# MarkSnap Studio

**Convert Markdown, AI responses, tables, LaTeX math, and Mermaid diagrams into mobile-friendly, high-DPI long images and multi-card carousels.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-emerald.svg)](https://opensource.org/licenses/Apache-2.0)

MarkSnap Studio is a 100% client-side web tool designed to turn raw Markdown or rich web content into crisp, mobile-adapted images that are comfortable to read on phones (WeChat, WhatsApp, Telegram, iMessage, X/Twitter) or desktop screens without pinching and zooming.

---

## ✨ Key Features

- **Pure Default & One-Click Presets**
  - Starts with a **Pure Default** borderless, headerless, footerless layout (`380px` logical width, `0px` outer frame).
  - Includes built-in presets (**Parents Large Text**, **Mobile Card**, **Desktop Tech**) plus support for saving custom user presets in `localStorage`.
- **Mobile & Desktop Viewport Presets**
  - Switch between `Mobile 380px`, `Plus 440px`, `Wide 540px`, `Desktop 820px`, `Ultra 1040px`, or any custom width (`320px–1200px`).
- **Dual Output Modes: Single Long Image vs. Smart Multi-Card Pagination**
  - **Single Long Image**: Export the entire document as one continuous vertical image with automatic canvas height protection.
  - **Multi-Card Pagination**: Automatically split long documents into swipeable cards by horizontal dividers (`---`), `##` headings, or character count, with **1-click ZIP batch download**.
- **Rich Markdown, Math & Diagram Rendering**
  - **GitHub Flavored Markdown (GFM)**: Tables, task lists, blockquotes, and syntax-highlighted code blocks.
  - **LaTeX Math**: Inline (`$...$`) and block (`$$...$$`) equations powered by KaTeX.
  - **Mermaid Flowcharts**: Deterministic inline SVG flowchart rendering (`graph TD` / `flowchart LR`).
- **Smart Editor Workflow**
  - **Rich HTML Paste to Markdown**: Copy content directly from web pages or AI chat interfaces and paste—rich HTML headings, lists, bold text, and tables are automatically converted into clean Markdown.
  - **Clipboard Image Paste (`Ctrl+V` / `Cmd+V`)**: Paste screenshots or upload local images directly into your document with automatic client-side compression.
  - **One-Click AI Cleanse**: Strip conversational AI openings/closings and normalize blank lines for mobile reading.
  - **Click-to-Locate**: Click any paragraph or heading on the live preview canvas to jump to and highlight the corresponding line in the Markdown source editor.
- **8 Curated Visual Themes & Fine-Grained Typography**
  - `Warm Care`, `WeChat Fresh`, `Notion Clean`, `High Contrast`, `Mac Studio`, `GitHub Dark`, `Editorial`, and `Sunset Poster`.
  - Customize font size (`16px–26px+`), font family (`Sans`, `Serif`, `Mono`), line height, inner/outer padding, bold marker highlights, optional header/footer, and dynamic QR codes.
- **Bilingual Interface (`EN` / `中文`) & Dark Mode**
  - Instant switching between English and Chinese UI, with full light/dark workspace support.
- **100% Client-Side & Privacy-First**
  - All parsing, rendering, QR generation, and high-DPI PNG/JPEG/ZIP exports happen locally in the browser. Zero server uploads.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** `>= 18.0.0`
- **npm** / **pnpm** / **yarn**

### Installation & Local Development

```bash
# 1. Clone the repository
git clone https://github.com/your-username/marksnap-studio.git
cd marksnap-studio

# 2. Install dependencies
npm install

# 3. Start the development server (http://localhost:3000)
npm run dev
```

### Build & Run Tests

```bash
# Run unit tests
npx tsx --test src/utils/markdownProcessor.test.ts

# Type-check
npm run lint

# Build static production bundle (outputs to dist/)
npm run build
```

---

## 📦 Static Deployment

MarkSnap Studio compiles into a pure static bundle (`dist/`) and can be deployed to any static hosting provider:

- **Cloudflare Pages / Vercel / Netlify**
  - **Build command**: `npm run build`
  - **Build output directory**: `dist`
  - **Node.js version**: `18` or `20`

---

## 🗂️ Project Structure

```text
├── src/
│   ├── components/
│   │   ├── MarkdownCardCanvas.tsx   # Live high-DPI card renderer
│   │   └── ExportPreviewModal.tsx   # Image preview, clipboard copy & ZIP download modal
│   ├── utils/
│   │   ├── markdownProcessor.ts     # AI cleanse, pagination splitter & export metrics
│   │   ├── markdownRenderer.ts      # GFM, KaTeX math & Mermaid SVG HTML pipeline
│   │   ├── mermaidSvg.ts            # Deterministic SVG flowchart layout engine
│   │   ├── htmlToMarkdown.ts        # Rich HTML clipboard-to-Markdown converter
│   │   ├── themes.ts                # Canvas presets, 8 card themes & default schemes
│   │   ├── templates.ts             # Built-in sample documents
│   │   └── i18n.ts                  # Bilingual (EN / ZH) localization dictionary
│   ├── App.tsx                      # Main studio workspace
│   └── main.tsx                     # Application entry point
├── index.html
├── package.json
└── vite.config.ts
```

---

## 🇨🇳 中文简介 (Chinese Overview)

**MarkSnap Studio** 是一款纯前端、零后端的 **Markdown 转手机长图与多图卡片工具**：

- **纯净默认预设**：默认无页眉、无页脚、无外边框留白，打开即得干净紧凑的阅读长图；同时保留「爸妈微信大字」「手机清爽卡片」「桌面技术周报」等一键预设。
- **双模式导出**：支持**一图流高清长图**与**智能分页多图**（按 `---` 分割线、`##` 二级标题或手机屏高字数自动切分，支持 ZIP 批量打包下载）。
- **富文本与贴图支持**：支持粘贴网页富文本自动转为 Markdown、编辑器内直接 `Ctrl+V` 粘贴截图、一键 AI 净化寒暄语、点击画布段落反向定位源码。
- **完整语法支持**：原生支持 GFM 表格、代码高亮、KaTeX 数学公式（`$...$` / `$$...$$`）与 Mermaid 矢量流程图。
- **中英双语切换**：顶栏支持一键切换 `中文 / EN` 界面与亮暗主题。

---

## 📄 License

Licensed under the [Apache-2.0 License](./LICENSE).
