# 设计文档：多选题题型与全科目考点覆盖扩容（v0.14）

状态：已定稿，按本设计实现。实现中设计变化先回写本文档。

## 一、新题型：多选题（multi-choice）

### 1. 目标

- 判分引擎新增第四种题型 `multi-choice`（多选题），全科目可用。
- 答题卡组件支持多选交互（checkbox 勾选、答案按字母序合并）。
- 内容校验、覆盖率报告同步支持该题型。

### 2. 非目标

- 不做"少选得部分分"（中考部分省份规则），第一版采用**全对才得分**的严格判分，规则简单可解释。
- 不做选项乱序、连线题、解答题过程分（保留给"多步题与步骤分"里程碑）。

### 3. 数据模型

```ts
interface MultiChoiceQuestion extends BaseQuestion {
  type: "multi-choice";
  options: ChoiceOption[]; // 至少 3 个
  answer: string;          // 正确项组合，字母序，如 "ABD"
}
```

- `Question` 联合类型加入 `MultiChoiceQuestion`。
- 用户作答值：勾选项按字母序拼接，如 `"ABD"`、`"AC"`；未作答为空串。

### 4. 判分规则

```text
normalize(userAnswer)   = 去除非字母字符 → 大写 → 字母序排列
normalize(question.answer) = 大写 → 字母序排列
全对（完全一致）→ correct；否则 wrong（含少选、多选、错选）
未作答 → skipped
```

### 5. 关键交互

- `QuestionCard`：多选题渲染 checkbox；勾选 / 取消即时合并排序并上报 `onChange`。
- 已提交状态下正确答案显示为 `answer` 字母组合。

### 6. 校验规则（validate-content.mjs）

- `type: "multi-choice"`：`options` ≥ 3；`answer` 非空、字母数 ≥ 2（多选至少两项）、每个字母都必须在 `options` 中存在。

### 7. 验收清单

- [x] 多选题判分：全对 correct / 少选 wrong / 多选 wrong / 空白 skipped。
- [x] 答题卡可勾选多项、取消勾选后合并值正确。
- [x] 校验脚本支持 multi-choice 且能拦截非法 answer。
- [x] 覆盖率报告题型分布出现 `multi-choice`（15 道）。

## 二、全科目考点覆盖扩容

### 1. 目标

- 每个学科新增 2 个高频缺口考点（共 10 个），每考点 3 道题，其中至少 1 道多选题，使新题型覆盖全部学科。
- 5 个既有高频考点各补 1 道多选题，让老考点也覆盖新题型。
- 全库新增约 35 道题，达到 54 考点 / 约 176 题。

### 2. 新增考点清单

| 学科 | 考点 ID | 名称 | 权重 |
| --- | --- | --- | --- |
| 数学 | `math-function-inverse` | 反比例函数 | high |
| 数学 | `math-trigonometry` | 锐角三角函数 | high |
| 物理 | `physics-buoyancy` | 浮力 | high |
| 物理 | `physics-force-motion` | 力与运动 | high |
| 化学 | `chemistry-lab-experiment` | 化学实验基础 | medium |
| 化学 | `chemistry-combustion` | 燃烧与燃料 | medium |
| 英语 | `english-comparison` | 比较级与最高级 | high |
| 英语 | `english-modal-verbs` | 情态动词 | medium |
| 语文 | `chinese-classical-chinese` | 文言文基础 | high |
| 语文 | `chinese-language-use` | 语言运用与得体 | medium |

### 3. 既有考点补题

| 学科 | 考点 | 新题 |
| --- | --- | --- |
| 数学 | 一元二次方程 | `math-quadratic-004`（多选） |
| 物理 | 欧姆定律 | `physics-ohm-005`（多选） |
| 化学 | 空气与氧气 | `chem-air-005`（多选） |
| 英语 | 动词时态 | `en-tense-004`（多选） |
| 语文 | 词语与成语运用 | `cn-word-004`（多选） |

### 4. 边界与错误处理

- 新考点全部有题目，满足覆盖率；高频考点保证"题型 ≥2、难度分层 ≥2"的结构健康要求。
- 试卷不强制挂接新题（新考点先进入练习与每日计划，试卷扩展留给后续版本）。
- 题目 ID 按既有前缀规则新增，不删除既有题目。

### 5. 验收清单

- [x] 每学科新增 2 考点且各有 ≥3 题、≥2 题型。
- [x] 多选题出现在全部 5 个学科（每科 3 道，共 15 道）。
- [x] `validate:content` 通过；`report:coverage` 覆盖率与结构健康 54/54。
- [x] `test` / `typecheck` / `build` 通过。
