# 架构设计

## 技术选型

| 分类 | 当前选择 | 原因 |
| --- | --- | --- |
| 构建 | Vite | 启动快，配置简单，适合静态站点。 |
| UI | React 18 | 生态成熟，组件化清晰。 |
| 语言 | TypeScript | 题目、判分、进度模型需要强类型。 |
| 数学公式 | KaTeX | 渲染中考数学题干、选项和解析。 |
| 样式 | 原生 CSS | 第一版避免样式框架负担。 |
| 存储 | localStorage | 零后端，离线可用，适合 MVP。 |
| 部署 | GitHub Pages | 免费、简单、支持静态站点。 |

## 页面结构

```text
冲刺看板
├── 学习进度
├── 今日做题
├── 连续学习
├── 综合掌握度
├── 到期错题
├── 累计用时
└── 下一步建议

考点地图
├── 考点列表
├── 重要程度
├── 当前状态
└── 完成度

专题练习
├── 考点筛选
├── 复习模式
├── 题目列表
├── 作答区
├── 一键打分
├── 用时记录
└── 题目反馈

错题本
├── 到期复习
├── 全部错题
├── 已掌握
├── 错误次数
├── 复习阶段
├── 下次复习时间
├── 正确答案
└── 解析

设置
└── 清空本地数据
```

## 前端目录

```text
src/
├── components/
│   ├── Layout.tsx
│   ├── MathText.tsx
│   └── QuestionCard.tsx
├── data/
│   ├── math.json
│   └── sample-content.ts
├── lib/
│   ├── grading.ts
│   ├── mastery.ts
│   └── storage.ts
├── pages/
│   ├── Home.tsx
│   ├── Topics.tsx
│   ├── Practice.tsx
│   ├── Mistakes.tsx
│   └── Settings.tsx
├── styles/
│   └── app.css
├── App.tsx
├── main.tsx
└── types.ts
```

## 核心数据流

```text
math.json
    ↓
sample-content.ts
    ↓ 类型化导出
Practice.tsx
    ↓ 用户作答
responses / question-timers
    ↓ 一键打分
grading.ts
    ↓
QuestionResult[] + timeSpentSeconds
    ↓
UI 显示解析与用时
    ↓
storage.recordAttempt
    ↓
attempts / completedQuestionIds / mistakes / reviewSchedule
    ↓
mastery.ts
    ↓
questionStats / topicStats / overallMastery
    ↓
Home / Topics / Mistakes 更新
```

## 掌握度模块

`src/lib/mastery.ts` 当前负责：

1. 从 `attempts` 中筛选单题记录。
2. 计算单题尝试次数、正确率、平均用时和连续答对次数。
3. 按考点聚合覆盖率、正确率和稳定性。
4. 计算考点掌握度和整体掌握度。
5. 计算连续学习天数、今日做题次数和累计用时。

当前公式：

```text
mastery = accuracy × 65% + coverage × 25% + stability × 10%
```

## 判分模块

`src/lib/grading.ts` 负责：

1. 接收题目和用户响应。
2. 按题型选择判分逻辑。
3. 返回统一结果结构和用时。

当前支持：

```text
single-choice：比较选项 key。
numeric：数值容差比较。
expression：solution-set 按解集比较；text 按归一化文本比较。
```

后续会拆分为：

```text
grading/
├── index.ts
├── choice.ts
├── numeric.ts
├── expression.ts
├── multi-step.ts
└── essay.ts
```

## 存储模块

当前使用 localStorage：

```text
key: sprintbook-progress-v0.3
```

结构：

```ts
interface ProgressState {
  completedQuestionIds: string[];
  mistakes: Record<string, MistakeRecord>;
  attempts: AttemptRecord[];
}
```

`MistakeRecord` 额外保存：

```text
reviewStage         当前复习阶段
consecutiveCorrect  连续答对次数
nextReviewAt        下次复习时间
```

加载时会归一化旧版本数据，当前兼容读取 `sprintbook-progress-v0.1`。

后续如果题量和记录变多，应迁移到 IndexedDB。

## 路由策略

当前使用组件状态 + URL Hash 切换页面。

优点：

1. 简单。
2. 无额外路由依赖。
3. 刷新后可停留在当前页面。
4. 适合 GitHub Pages 子路径部署。

缺点：

1. 还不是标准多路径路由。
2. 查询参数能力较简单。

当前已支持 Hash Query，例如：

```text
#/practice?review=1
```

## 后续架构方向

### 内容层

```text
content/
├── curriculum/
├── questions/
├── papers/
└── media/
```

### 学习记录层

```text
attempt-record   每次作答记录
mistake-record   错题记录
mastery-record   考点掌握度
review-record    复习记录
```

### 业务引擎

```text
grading-engine       判分
mastery-engine       掌握度
recommend-engine     推荐
review-scheduler     间隔复习
paper-engine         试卷与模考
```
