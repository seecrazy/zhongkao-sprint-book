# 中考冲刺书 · SprintBook

一个面向中考冲刺阶段的互动练习平台。当前项目处于 **v0.3 数学试点阶段**，已完成从“能做题”到“能判断掌握度、能安排错题复习”的本地闭环：

```text
考点练习 → 一键判分 → 解析复盘 → 尝试记录 → 掌握度计算 → 错题间隔复习
```

## 产品定位

> 考点看得清，错题改得掉，冲刺有计划。

SprintBook 不是简单题库，而是围绕冲刺阶段学习流程设计的训练工具：

1. 定位薄弱考点。
2. 按考点专题训练。
3. 一键判分并记录用时。
4. 展示答案解析和更优方法。
5. 错题自动进入间隔复习队列。
6. 根据掌握度推荐下一步练习。

## 当前版本特性

### 学习闭环

- 冲刺看板：查看综合掌握度、今日做题、连续学习、到期错题和累计用时。
- 考点地图：展示 11 个数学考点的覆盖、正确率、稳定性和掌握度。
- 专题练习：支持按考点筛选，当前内置 19 道数学题。
- 错题复习：错题按“当天 → 1 天 → 2 天 → 4 天 → 7 天 → 15 天”安排复习。
- 一键打分：支持单选题、数值填空题和表达式填空题。
- 做题记录：记录每题状态、用户答案和作答用时。

### 数学与内容

- 数学公式：基于 KaTeX 渲染题干、选项、答案和解析。
- 内容外置：知识点和题目保存在 `src/data/math.json`。
- 内容校验：检查 ID、引用、必填字段、公式定界符和答案结构。
- 覆盖率报告：统计题量、题型分布、难度分布和考点缺口。
- 表达式解集判分：支持 `x = 2 或 x = 3`、`2, 3`、`x1=2,x2=3` 等形式。

### 工程体验

- URL Hash 路由：刷新后可停留在当前页面。
- 本地进度：使用浏览器 `localStorage` 保存学习记录。
- 版本迁移：可读取 v0.1 错题记录并归一化为 v0.3 数据结构。
- 组件拆分：`QuestionCard` 已从练习页独立。

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

```bash
cd zhongkao-sprint-book
npm install
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
npm run report:coverage
```

## 掌握度算法

每个考点按下面方式计算：

```text
正确率 = 正确作答次数 / 总作答次数
覆盖率 = 已尝试题数 / 考点总题数
稳定性 = 连续答对总次数 / 考点题数 × 3
掌握度 = 正确率 × 65% + 覆盖率 × 25% + 稳定性 × 10%
```

状态阈值：

```text
0%        未开始
1%～64%   学习中
65%～84%  较稳
85%+      已掌握
```

这是第一版简化模型，后续会加入时间衰减、难度权重、近期窗口和题型权重。

## 错题复习规则

错题或未作答题会进入复习队列。

```text
复习阶段：0 → 1 → 2 → 3 → 4 → 5
间隔天数：0 → 1 → 2 → 4 → 7 → 15
```

- 连续答对 2 次，复习阶段 +1。
- 再错会重置到阶段 0。
- 连续答对 3 次且阶段达到 3，标记为已掌握。

## 内容文件

当前数学试点内容位于：

```text
src/data/math.json
```

内容结构：

```json
{
  "version": "math-v0.3",
  "knowledgePoints": [],
  "questions": []
}
```

当前包含：

```text
知识点：11 个
题目：19 道
题型：单选题、数值题、表达式题
难度：基础 12 道，中等 7 道
```

公式使用 `$...$` 包裹，例如：

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
│   ├── report-content-coverage.mjs
│   └── validate-content.mjs
├── src/
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── MathText.tsx
│   │   └── QuestionCard.tsx
│   ├── data/
│   │   ├── math.json
│   │   └── sample-content.ts
│   ├── lib/
│   │   ├── grading.ts
│   │   ├── mastery.ts
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
- 时间衰减式掌握度模型；
- 云端账号与多端同步；
- AI 讲解和作文评分。
