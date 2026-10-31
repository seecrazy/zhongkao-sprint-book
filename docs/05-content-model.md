# 内容模型

## 当前内容文件

数学试点内容位于：

```text
src/data/math.json
```

文件结构：

```json
{
  "version": "math-v0.2",
  "knowledgePoints": [],
  "questions": []
}
```

题干、选项、解析中的公式使用 `$...$` 包裹，由 KaTeX 渲染。

## 当前基础模型

### 知识点

```ts
interface KnowledgePoint {
  id: string;
  name: string;
  subject: Subject;
  summary: string;
  examWeight: "high" | "medium" | "low";
  status: "not-started" | "learning" | "stable" | "mastered";
}
```

示例：

```json
{
  "id": "math-equation-quadratic",
  "name": "一元二次方程",
  "subject": "math",
  "summary": "掌握解法、根的判别式和根与系数关系。",
  "examWeight": "high",
  "status": "learning"
}
```

## 题目公共字段

```ts
interface BaseQuestion {
  id: string;
  subject: Subject;
  knowledgePointIds: string[];
  displayType: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedSeconds: number;
  stem: string;
  source: string;
  explanation: string;
  optimalSolution?: string;
  commonMistake?: string;
}
```

## 当前题型

### 单选题

```ts
interface ChoiceQuestion extends BaseQuestion {
  type: "single-choice";
  options: ChoiceOption[];
  answer: string;
}
```

示例字段：

```json
{
  "type": "single-choice",
  "options": [
    { "key": "A", "label": "x = 2" },
    { "key": "B", "label": "x = 3" },
    { "key": "C", "label": "x = 2 或 x = 3" },
    { "key": "D", "label": "x = -2 或 x = -3" }
  ],
  "answer": "C"
}
```

### 数值题

```ts
interface NumericQuestion extends BaseQuestion {
  type: "numeric";
  answer: number;
  tolerance?: number;
  unit?: string;
}
```

示例：

```json
{
  "type": "numeric",
  "answer": 3,
  "tolerance": 0.001,
  "unit": ""
}
```

### 表达式题

当前表达式题仍处于简化阶段，使用可接受答案列表。

```ts
interface ExpressionQuestion extends BaseQuestion {
  type: "expression";
  acceptedAnswers: string[];
}
```

示例：

```json
{
  "type": "expression",
  "acceptedAnswers": [
    "x = 3 或 x = -3",
    "x = -3 或 x = 3",
    "x = ±3"
  ]
}
```

## 后续题型

### 多步题

```ts
interface MultiStepQuestion extends BaseQuestion {
  type: "multi-step";
  steps: Array<{
    id: string;
    prompt: string;
    type: "numeric" | "expression" | "choice";
    answer: unknown;
    score: number;
  }>;
}
```

用途：

1. 解方程过程题。
2. 几何证明关键步骤。
3. 应用题分问。
4. 函数综合题。

### 几何图形题

```ts
interface GeometryQuestion extends BaseQuestion {
  type: "geometry-figure";
  figure: {
    svgPath: string;
    labels: string[];
    interactivePoints: string[];
  };
}
```

## 后续需要补充的题目元数据

```ts
interface QuestionMetadata {
  status: "draft" | "reviewing" | "verified" | "published" | "deprecated";
  year?: string;
  region?: string;
  sourceType: "textbook" | "mock" | "past-paper" | "original";
  cognitiveLevel: "remember" | "understand" | "apply" | "analyze" | "synthesize";
  skills: string[];
  estimatedSeconds: number;
  historyUsageCount?: number;
}
```

## 内容校验

当前已支持：

```bash
npm run validate:content
```

校验范围：

1. JSON 可解析。
2. 文件有版本号。
3. 知识点必填字段完整。
4. 题目必填字段完整。
5. 知识点 ID 唯一。
6. 题目 ID 唯一。
7. 题目引用的知识点存在。
8. 单选题必须有选项和答案。
9. 数值题必须有数值答案。
10. 表达式题必须有可接受答案。
11. 题干中的 `$` 符号必须成对。
12. 暂无题目的知识点给出警告。

## 解析结构方向

当前解析是纯文本：

```ts
explanation: string;
```

后续应升级为结构化解析：

```ts
interface Explanation {
  short: string;
  steps: Array<{
    title: string;
    content: string;
  }>;
  keyIdea: string;
  commonMistakes: Array<{
    mistake: string;
    reason: string;
  }>;
  relatedPoints: string[];
}
```

## 更优解法结构方向

```ts
interface AlternativeSolution {
  id: string;
  title: string;
  whenToUse: string;
  steps: string[];
  pros: string;
  cons: string;
}
```

题目可以配置：

```ts
alternativeSolutions: AlternativeSolution[];
optimalSolutionId: string;
```
