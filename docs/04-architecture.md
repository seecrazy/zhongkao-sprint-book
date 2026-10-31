# 架构设计

## 技术选型

| 分类 | 当前选择 | 原因 |
| --- | --- | --- |
| 构建 | Vite | 启动快，配置简单，适合静态站点。 |
| UI | React 18 | 生态成熟，组件化清晰。 |
| 语言 | TypeScript | 题目、判分、进度模型需要强类型。 |
| 样式 | 原生 CSS | 第一版避免样式框架负担。 |
| 存储 | localStorage | 零后端，离线可用，适合 MVP。 |
| 部署 | GitHub Pages | 免费、简单、支持静态站点。 |

## 页面结构

```text
冲刺看板
├── 学习进度
├── 考点数量
├── 错题数量
└── 下一步建议

考点地图
├── 考点列表
├── 重要程度
├── 当前状态
└── 完成度

专题练习
├── 考点筛选
├── 题目列表
├── 作答区
├── 一键打分
└── 题目反馈

错题本
├── 错题列表
├── 错误次数
├── 正确答案
└── 解析

设置
└── 清空本地数据
```

## 前端目录

```text
src/
├── components/
│   └── Layout.tsx
├── data/
│   └── sample-content.ts
├── lib/
│   ├── grading.ts
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
sample-content.ts
    ↓
Practice.tsx
    ↓ 用户作答
responses
    ↓ 一键打分
grading.ts
    ↓
QuestionResult[]
    ↓
UI 显示解析
    ↓
storage.ts
    ↓
completedQuestionIds / mistakes
    ↓
Home / Topics / Mistakes 更新
```

## 判分模块

`src/lib/grading.ts` 负责：

1. 接收题目和用户响应。
2. 按题型选择判分逻辑。
3. 返回统一结果结构。

当前支持：

```text
single-choice：比较选项 key。
numeric：数值容差比较。
expression：字符串归一化后比较。
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
key: sprintbook-progress-v0.1
```

结构：

```ts
interface ProgressState {
  completedQuestionIds: string[];
  mistakes: Record<string, MistakeRecord>;
}
```

后续如果题量和记录变多，应迁移到 IndexedDB。

## 路由策略

当前使用组件状态切换页面。

优点：

1. 简单。
2. 无额外依赖。
3. 适合 MVP。

缺点：

1. 刷新后回到首页。
2. 无法直接分享指定页面。

后续建议使用 hash router，避免 GitHub Pages 子路径部署时的服务端路由问题。

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
