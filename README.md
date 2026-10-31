# 中考冲刺书 · SprintBook

一个面向中考冲刺阶段的互动练习平台。当前项目处于 **v0.4 数学试点阶段**，已经完成“每日计划 → 专题训练 → 限时模考 → 掌握度更新 → 错题间隔复习”的本地闭环。

## 产品定位

> 考点看得清，错题改得掉，冲刺有计划。

SprintBook 不只是题库，而是围绕冲刺阶段学习流程设计的训练工具：

1. 生成每日冲刺任务。
2. 按薄弱考点做专题训练。
3. 用限时模考检查速度和准确率。
4. 交卷后生成分考点报告。
5. 自动记录错题和间隔复习计划。
6. 用掌握度判断下一步优先级。

## 当前版本特性

### 每日冲刺

- 根据到期错题、考点掌握度和模考可用性生成今日任务。
- 支持错题复习、薄弱考点专项、限时模考和复盘任务。
- 每个任务可标记完成，进度保存在本地。
- 展示今日完成百分比和连续学习状态。

### 专题与掌握度

- 11 个数学知识点、25 道数学题。
- 支持单选题、数值填空题和表达式填空题。
- 一键判分，记录状态、答案和用时。
- 计算考点覆盖率、正确率、稳定性和综合掌握度。
- 首页按薄弱考点排序，给出下一步建议。

### 限时模考

- 内置 1 套数学基础冲刺摸底卷：15 题、25 分钟、总分 15 分。
- 支持倒计时、答题卡、上一题 / 下一题、立即交卷。
- 时间归零后自动交卷。
- 交卷后生成总分、得分率、用时、分考点报告和冲刺建议。
- 逐题查看答案、解析、常见错误和更优方法。
- 本地保留最近 20 次模考成绩。

### 错题与复习

- 错题或未作答题自动进入间隔复习队列。
- 间隔计划：当天 → 1 天 → 2 天 → 4 天 → 7 天 → 15 天。
- 连续答对 2 次，复习阶段 +1；再错则重置。
- 连续答对 3 次且阶段达到 3，标记为已掌握。
- 支持到期复习、全部错题、已掌握筛选。

### 数学与工程

- KaTeX 渲染题干、选项、答案和解析。
- 题库、试卷外置为 JSON。
- 内容校验检查字段、引用、公式定界符、重复 ID 和试卷题目引用。
- 覆盖率报告统计题量、题型、难度和考点缺口。
- URL Hash 路由，刷新后可停留在当前页面。

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

## 错题复习规则

```text
阶段：0 → 1 → 2 → 3 → 4 → 5
间隔：0 → 1 → 2 → 4 → 7 → 15 天
```

- 连续答对 2 次，复习阶段 +1。
- 再错重置到阶段 0。
- 连续答对 3 次且阶段达到 3，标记为已掌握。

## 内容文件

题库：

```text
src/data/math.json
```

试卷：

```text
src/data/math-exams.json
```

当前内容：

```text
知识点：11 个
题目：25 道
基础题：14 道
中等题：9 道
较难题：2 道
试卷：1 套
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
│   │   ├── math-exams.json
│   │   ├── math.json
│   │   └── sample-content.ts
│   ├── lib/
│   │   ├── exam-storage.ts
│   │   ├── exam.ts
│   │   ├── grading.ts
│   │   ├── mastery.ts
│   │   ├── planner.ts
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

项目已配置 GitHub Actions，推送到 `main` 分支后会自动构建并部署。

仓库设置：

```text
Settings → Pages → Source → GitHub Actions
```

项目页地址示例：

```text
https://<username>.github.io/zhongkao-sprint-book/
```

`vite.config.ts` 已配置：

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
- 标准中考整卷结构和分区评分；
- 时间衰减式掌握度模型；
- 云端账号与多端同步；
- AI 讲解和作文评分。
