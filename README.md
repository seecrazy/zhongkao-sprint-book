# 中考冲刺书 · SprintBook

一个面向中考冲刺阶段的互动练习平台。当前项目处于 **v0.15 真实中考题型阶段**：五科 54 个考点 / 1332 道题（每考点 ≥20 题）/ 64 套卷（每科 10 套模拟卷），题型覆盖单选 / 多选 / 数值 / 表达式 / 解答题（含计算题、应用题，分步解析自评），支持学科切换、速查表检索、分区模考、掌握度加权、模考趋势追踪和自动化业务规则测试。

## 产品定位

> 考点看得清，错题改得掉，冲刺有计划。

SprintBook 围绕冲刺学习闭环设计：

```text
每日计划
→ 考点讲解
→ 薄弱考点专项
→ 错题间隔复习
→ 分区限时模考
→ 自动判分与报告
→ 掌握度与趋势更新
```

## 当前版本特性

### 每日冲刺

- 根据到期错题、薄弱考点和模考可用性生成今日任务。
- 支持错题复习、专项训练、限时模考和复盘任务。
- 任务完成状态按日期保存在本地。

### 题型

- 单选题、多选题（全对才得分）、数值题（支持容差）、表达式题（解集 / 中英文填空）、解答题 / 计算题 / 应用题（填最终答案，解析含分步过程）。

### 专题与掌握度

- 数学 16 考点 / 46 题 / 4 卷 + 物理 8 考点 / 27 题 / 3 卷 + 化学 8 考点 / 28 题 / 3 卷 + 英语 5 考点 / 16 题 / 2 卷 + 语文 5 考点 / 16 题 / 2 卷。
- 每个考点提供结构化讲解。
- 讲解包含学习目标、核心思路、概念、公式、例题、易错警示和解题策略。
- 讲解中的公式和例题由 KaTeX 渲染。
- 考点卡片可一键查看讲解，并跳转到对应专题练习。
- 记录每题状态、答案和用时。
- 计算覆盖率、正确率、稳定性、加权掌握度。
- 掌握度加入时间衰减和难度调整。
- 考点地图按掌握度展示薄弱优先级。

### 学科切换

- 导航栏一键切换数学 / 物理 / 化学 / 英语 / 语文。
- 学习进度、错题本、模考记录按学科独立保存，互不干扰。
- 路由带学科前缀：`#/math/practice`、`#/physics/exam`，旧链接自动兼容。

### 速查表

- 数学 / 物理 / 化学 14 组 55 条核心原理、公式与口诀。
- 支持关键字实时检索，公式 KaTeX 渲染。
- 导航栏"速查表"入口，路由 `#/math/reference` 等。

### 限时模考

- 64 套分区试卷：每科 2 套精品卷 + 10 套冲刺模拟卷（参考真实中考卷面结构）。
- 支持倒计时、答题卡、上一题 / 下一题、立即交卷。
- 时间归零自动交卷。
- 支持未完成会话暂离保存。
- 报告包含总分、分区成绩、分考点成绩、冲刺建议和逐题解析。
- 最近 20 次成绩本地保存。
- SVG 趋势图展示历次得分率变化。

### 错题与复习

- 错题或未作答题自动进入间隔复习队列。
- 间隔计划：当天 → 1 天 → 2 天 → 4 天 → 7 天 → 15 天。
- 连续答对 2 次提升阶段，再错重置。
- 支持到期复习、全部错题、已掌握筛选。

### 工程质量

- 16 个 Vitest 测试，覆盖考点讲解结构、题库引用、判分、分区评分、趋势、掌握度衰减和复习调度。
- 内容校验、覆盖率报告、单元测试已纳入 GitHub Actions。
- TypeScript strict 类型检查。

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 构建 | Vite |
| 前端 | React 18 |
| 语言 | TypeScript |
| 数学公式 | KaTeX |
| 测试 | Vitest |
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
npm run test
npm run typecheck
npm run build
npm run preview
npm run validate:content
npm run report:coverage
node scripts/generate-question-bank.mjs   # 重新生成变式题库与模拟卷
```

## 掌握度算法

单题先计算时间加权正确率：

```text
3 天内：权重 1
4～7 天：权重 0.8
8～14 天：权重 0.55
15～30 天：权重 0.3
30 天以上：权重 0.12
```

考点层再做难度调整：

```text
难度调整 = 平均((难度 - 3) × 4%)
加权表现 = 时间加权正确率 + 难度调整
```

考点掌握度：

```text
掌握度 =
  加权表现 × 50%
+ 覆盖率 × 25%
+ 稳定性 × 10%
+ 近期练习量 × 15%
```

状态阈值：

```text
0%        未开始
1%～64%   学习中
65%～84%  较稳
85%+      已掌握
```

## 当前内容

```text
数学：18 考点 / 53 题（基础 27 · 中等 18 · 较难 8）/ 4 卷
物理：10 考点 / 34 题（基础 20 · 中等 11 · 较难 3）/ 3 卷
化学：12 考点 / 43 题（基础 24 · 中等 16 · 较难 3）/ 3 卷
英语：7 考点 / 23 题（基础 15 · 中等 8）/ 2 卷
语文：7 考点 / 23 题（基础 15 · 中等 8）/ 2 卷
合计：54 考点 / 1332 题 / 64 卷（每考点 ≥20 题）
```

试卷列表：

```text
数学基础冲刺摸底卷：15 题 / 25 分钟 / 总分 20
薄弱考点精准卷：10 题 / 18 分钟 / 总分 10
压轴题提速挑战卷：11 题 / 25 分钟 / 总分 22
几何基础专项卷：12 题 / 20 分钟 / 总分 12
物理基础冲刺摸底卷：18 题 / 30 分钟 / 总分 21
物理薄弱考点精准卷：11 题 / 20 分钟 / 总分 11
化学基础冲刺摸底卷：25 题 / 30 分钟 / 总分 28
化学薄弱考点精准卷：13 题 / 25 分钟 / 总分 13
物理综合挑战卷：6 题 / 20 分钟 / 总分 12
化学综合挑战卷：9 题 / 20 分钟 / 总分 18
英语基础冲刺摸底卷：15 题 / 25 分钟 / 总分 15
英语薄弱考点精准卷：8 题 / 15 分钟 / 总分 8
语文基础冲刺摸底卷：15 题 / 20 分钟 / 总分 15
语文薄弱考点精准卷：8 题 / 15 分钟 / 总分 8
```

题库位于 `src/data/math.json`，试卷位于 `src/data/math-exams.json`。

当前考点讲解覆盖：

```text
知识点：54 个
结构化讲解：54 个
覆盖比例：54/54
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
│   ├── 11-changelog.md
│   ├── 12-project-state.md
│   └── 13-geometry-expansion-plan.md
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
│   │   ├── math-exams.json
│   │   ├── math.json
│   │   └── sample-content.ts
│   ├── lib/
│   │   ├── exam-storage.ts
│   │   ├── exam.test.ts
│   │   ├── exam.ts
│   │   ├── grading.test.ts
│   │   ├── grading.ts
│   │   ├── mastery.test.ts
│   │   ├── mastery.ts
│   │   ├── planner.ts
│   │   ├── storage.test.ts
│   │   └── storage.ts
│   ├── pages/
│   │   ├── Exam.tsx
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

项目已配置 GitHub Actions。推送到 `main` 后会依次执行：

```text
npm ci
npm run validate:content
npm run report:coverage
npm test
npm run typecheck
npm run build
```

构建成功后发布到 GitHub Pages。

项目页地址示例：

```text
https://<username>.github.io/zhongkao-sprint-book/
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
- 尺规作图；
- 英语听力音频；
- 语文作文与阅读主观题评分；
- 标准中考真实分区和官方分值；
- 作文 / 主观题 AI 评分；
- 云端账号与多端同步。
