# 中考冲刺书 · SprintBook

一个面向中考冲刺阶段的互动练习平台。当前项目处于 **v0.2 数学试点阶段**，已经跑通基础学习闭环：

```text
考点练习 → 一键判分 → 答案解析 → 错题记录 → 进度保存
```

## 产品定位

> 考点看得清，错题改得掉，冲刺有计划。

SprintBook 不是简单题库，而是围绕冲刺阶段学习流程设计的训练工具：

1. 诊断薄弱考点。
2. 按考点专题训练。
3. 交卷后自动判分。
4. 展示答案解析和更优方法。
5. 错题自动进入错题本。
6. 后续生成掌握度和复习计划。

## 当前版本特性

- 冲刺看板：查看基础进度、示例题量和待复习错题数。
- 考点地图：查看数学核心考点与完成度。
- 专题练习：支持按考点筛选题目。
- 一键打分：支持单选题、数值填空题和表达式填空题。
- 数学公式：基于 KaTeX 渲染题干、选项、答案和解析。
- 表达式解集判分：支持 `x = 2 或 x = 3`、`2, 3`、`x1=2,x2=3` 等形式。
- 答案解析：展示正确答案、解析、常见错误和更优方法。
- 错题本：错误或未作答题目自动进入本地错题本。
- 本地进度：使用浏览器 `localStorage` 保存学习记录。
- URL Hash 路由：刷新后可停留在当前页面。
- 内容外置：数学知识点和题目保存在 `src/data/math.json`。
- 内容校验：自动检查 ID、引用、必填字段和公式定界符。

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 构建 | Vite |
| 前端 | React 18 |
| 语言 | TypeScript |
| 数学公式 | KaTeX |
| 样式 | 原生 CSS |
| 存储 | localStorage |
| 部署 | GitHub Pages |

## 本地开发

进入项目目录：

```bash
cd zhongkao-sprint-book
```

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

默认访问：

```text
http://localhost:5175/
```

## 常用脚本

```bash
npm run dev
npm run build
npm run preview
npm run typecheck
npm run validate:content
```

## 内容文件

当前数学试点内容位于：

```text
src/data/math.json
```

内容结构：

```json
{
  "version": "math-v0.2",
  "knowledgePoints": [],
  "questions": []
}
```

题干、选项和解析中的公式使用 `$...$` 包裹，例如：

```text
$x^2 - 5x + 6 = 0$
```

## 目录结构

```text
.
├── docs/
│   ├── 01-product-overview.md
│   ├── 02-roadmap.md
│   ├── 03-progress.md
│   ├── 04-architecture.md
│   ├── 05-content-model.md
│   ├── 06-grading-engine.md
│   ├── 07-ui-ux.md
│   ├── 08-content-operations.md
│   ├── 09-deployment.md
│   ├── 10-decisions.md
│   └── 11-changelog.md
├── public/
├── scripts/
│   └── validate-content.mjs
├── src/
│   ├── components/
│   │   ├── Layout.tsx
│   │   └── MathText.tsx
│   ├── data/
│   │   ├── math.json
│   │   └── sample-content.ts
│   ├── lib/
│   │   ├── grading.ts
│   │   └── storage.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Mistakes.tsx
│   │   ├── Practice.tsx
│   │   ├── Settings.tsx
│   │   └── Topics.tsx
│   ├── styles/
│   ├── App.tsx
│   ├── main.tsx
│   └── types.ts
├── index.html
├── package.json
└── vite.config.ts
```

## GitHub Pages 部署

项目已配置 GitHub Actions，推送到 `main` 分支后会自动构建并部署。

仓库设置：

```text
Settings → Pages → Source → GitHub Actions
```

项目页地址示例：

```text
https://<username>.github.io/zhongkao-sprint-book/
```

`vite.config.ts` 中的 `base` 当前已设置为：

```ts
base: "/zhongkao-sprint-book/"
```

当前项目只在本地开发，是否推送远程由你手动执行。

## 开发计划

详细路线图见 [`docs/02-roadmap.md`](docs/02-roadmap.md)，当前进展见 [`docs/03-progress.md`](docs/03-progress.md)，版本记录见 [`docs/11-changelog.md`](docs/11-changelog.md)。

## 当前边界

当前版本是数学试点 Demo，还不包含：

- 完整中考题库；
- 多步题和过程判分；
- 完整数学表达式等价判断；
- 几何图形交互题；
- 模考计时和整卷报告；
- 掌握度模型和间隔复习；
- 云端账号与多端同步；
- AI 讲解和作文评分。
