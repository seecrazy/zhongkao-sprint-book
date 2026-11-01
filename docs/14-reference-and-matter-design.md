# 设计文档：速查表与化学构成扩容（v0.13）

状态：已定稿，按本设计实现。如实现中设计变化，先改本文档再改代码。

## 一、速查表（数学 / 物理 / 化学）

### 1. 目标

- 新增"速查表"页面，按学科分组展示中考核心原理、公式与口诀，可快速查阅。
- 支持关键字实时过滤（"快速查"），公式用 KaTeX 渲染。
- 数据驱动：内容外置到 `src/data/reference.json`，与题库同构维护。

### 2. 非目标

- 不做收藏、自定义条目、编辑功能。
- 不做英语 / 语文速查（后续版本再议）。
- 不引入后端，纯静态本地数据。

### 3. 用户流程

1. 导航栏点击"速查表"（新增 `reference` 页面，路由 `#/math/reference` 等）。
2. 页面顶部显示当前学科说明：速查表目前覆盖数学 / 物理 / 化学。
3. 页面按"分组 → 条目"两级展示：条目含名称、表达式（KaTeX）、备注。
4. 顶部搜索框输入关键字，实时过滤：条目的名称 / 表达式 / 备注 任一命中即保留；分组内条目全部被过滤时隐藏该分组；全部为空时显示"未找到相关条目"。
5. 英语 / 语文学科下访问速查表：显示占位说明，不渲染三学科内容。

### 4. 数据模型

```ts
// src/types.ts 新增
interface ReferenceItem {
  name: string;       // 条目名，如"求根公式"
  expression: string; // 公式 / 原理 / 口诀，支持 KaTeX
  note?: string;      // 使用要点
}
interface ReferenceGroup {
  title: string;      // 分组名，如"方程与不等式"
  items: ReferenceItem[];
}
interface ReferenceSubject {
  subject: Subject;   // 仅 math / physics / chemistry
  groups: ReferenceGroup[];
}
```

```json
// src/data/reference.json
{ "version": "reference-v0.13", "subjects": [ { "subject": "math", "groups": [] } ] }
```

### 5. 关键交互

- 学科跟随全局学科切换器（数学 / 物理 / 化学渲染内容，英语 / 语文渲染占位）。
- 过滤为纯前端 `useMemo` 计算，输入即生效，无需请求。
- 内容规模约每学科 4~5 组、每组 3~6 条，整页一屏到两屏，无需分页。

### 6. 边界与错误处理（实现期已修订）

- 【设计变化】`validate-content.mjs` 原实现对不含 `knowledgePoints` / `questions` 数组的内容文件直接报错，与最初"空键自动跳过"的假设不符。实现时已显式扩展校验器：含 `subjects` 数组的文件识别为速查表数据，只校验 `version`，并在报告中单列"速查表文件"数量。
- 搜索词统一 `toLowerCase()` 匹配，大小写不敏感。
- 页面加入 `pageKeys` 后，未知学科路由回退逻辑保持不变（回退数学）。
- 分子与原子考点补入 `chem-matter-004`（难度 3 单选），满足高频考点难度分层要求；已挂入摸底卷"物质构成与水溶液"分区。

### 7. 验收清单

- [x] 导航栏出现"速查表"入口，`#/math/reference` 可直达。
- [x] 数学 / 物理 / 化学三学科分组与条目渲染完整，KaTeX 正常。
- [x] 关键字过滤生效，空结果有提示。
- [x] 英语 / 语文下显示占位说明。
- [x] `test` / `typecheck` / `build` 通过。

## 二、化学构成扩容（分子 / 原子 / 元素）

### 1. 目标

- 现有考点 `chemistry-matter-structure`（分子、原子与元素，3 题）承载过重，拆分为 3 个考点，把"元素、原子、分子"讲透：
  1. `chemistry-matter-structure` → 改名"分子与原子"（id 不变，保护已有学习记录）。
  2. 新增 `chemistry-atomic-structure`"原子的结构与离子"。
  3. 新增 `chemistry-elements`"元素与元素周期表"。
- 每个考点提供完整结构化讲解（目标 / 思路 / 概念 / 公式 / 例题 / 易错 / 策略）。

### 2. 题目与试卷变化

| 考点 | 题目 | 说明 |
| --- | --- | --- |
| 分子与原子 | `chem-matter-001`、`chem-matter-002`（保留） | 去掉元素相关内容 |
| 原子的结构与离子 | 新增 `chem-atom-001~004` | 原子构成、相对原子质量、离子形成、离子符号 |
| 元素与元素周期表 | `chem-matter-003`（改挂）+ 新增 `chem-elem-001~003` | 地壳元素、元素定义、元素符号、周期表 |

- 试卷：摸底卷"物质构成与水溶液"分区加入 `chem-atom-001/002`、`chem-elem-001`；精准卷加入 `chem-atom-003`、`chem-elem-002`；挑战卷 concept-hard 分区加入 `chem-atom-004`、`chem-elem-003`。

### 3. 数量变化

```text
化学：8 → 10 考点，28 → 35 题
全库：42 → 44 考点，133 → 140 题
```

### 4. 边界与错误处理

- 题目 ID 全部不变或新增，不删除，已有本地学习记录 / 错题本不受影响。
- `chem-matter-003` 仅改 `knowledgePointIds`，题目内容不变。
- 新考点 `examWeight`：三个新考点均为 high；新题目需满足高频考点"题型 ≥2、难度分层 ≥2"的结构健康要求。

### 5. 验收清单

- [x] 化学考点数 10，分子 / 原子 / 元素各有独立完整讲解。
- [x] `chem-matter-003` 已改挂 `chemistry-elements`，试卷引用全部有效。
- [x] `validate:content` 通过；`report:coverage` 题目覆盖与结构健康 44/44。
- [x] `test` / `typecheck` / `build` 通过。
