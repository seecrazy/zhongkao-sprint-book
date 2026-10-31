# 判分引擎设计

## 目标

判分引擎负责把用户答案转换为统一的题目结果，并支撑后续错题本、掌握度和报告系统。

第一版目标：

```text
一键判分
→ 判断对错
→ 标记未作答
→ 返回正确答案
→ 给出错误类型
→ 支撑错题记录
→ 支撑用时统计
→ 支撑整卷评分
```

## 当前入口

```ts
gradeQuestions(questions, responses)
```

输入：

```ts
questions: Question[]
responses: Record<string, string>
```

输出：

```ts
QuestionResult[]
```

## 当前结果结构

```ts
interface QuestionResult {
  questionId: string;
  status: "correct" | "wrong" | "skipped";
  userAnswer: string;
  correctAnswer: string;
  score: number;
  maxScore: number;
  errorType: "none" | "blank" | "concept" | "calculation" | "careless";
  timeSpentSeconds?: number;
}
```

## 得分规则

当前每题满分 1 分。

```text
correct：score = 1
wrong：score = 0
skipped：score = 0
```

整卷评分使用：

```text
试卷总分 = Σ QuestionResult.score
试卷满分 = 题目数 × scorePerQuestion
```

## 当前题型判分

### 单选题

规则：

```text
用户选项 key === answer → correct
否则 → wrong
未答 → skipped
```

### 数值题

规则：

```text
提取数字
→ 与 answer 比较
→ 允许 tolerance 容差
```

示例：

```ts
{
  answer: 3,
  tolerance: 0.001
}
```

### 表达式题

当前表达式题分为两类。

### `answerKind: "solution-set"`

适合方程解等只关心最终解集的题目。

判分步骤：

1. 去除空格。
2. 转小写。
3. 统一中文逗号。
4. 统一“或”为 `or`。
5. 处理 `±`。
6. 提取带符号数字。
7. 将答案转换成解集。
8. 比较用户解集与可接受答案解集。

以下形式在“解集相同”时可以判对：

```text
x = 2 或 x = 3
x=2,x=3
2,3
x1=2,x2=3
x2=3,x1=2
```

如果无法从答案中提取数字，则退回字符串归一化比较。

### `answerKind: "text"`

适合因式分解、不等式解集、概率分数等答案方向和书写形式都重要的题目。

判分步骤：

1. 去除空格。
2. 转小写。
3. 统一部分中文符号。
4. 与 `acceptedAnswers` 逐个归一化比较。

例如下面两题必须使用 `text`，否则容易误判：

```text
x >= -3 与 x <= -3
(x + 2)(x - 2) 与 (x + 2)^2
```

后续需要升级为真正的表达式等价判断，覆盖分数、根式、区间、集合和含字母表达式。

## 用时记录

`Practice.tsx` 在用户首次修改某题答案时记录开始时间；点击“一键打分”时计算：

```text
timeSpentSeconds = max(1, round((submittedAt - firstInteractionAt) / 1000))
```

未作答题记录为 0 秒。

当前记录的是“从首次输入到交卷”的时间，还不是严格意义上的独立思考时间。

## 错误类型

当前错误类型：

| errorType | 含义 |
| --- | --- |
| none | 正确 |
| blank | 未作答 |
| concept | 概念或方法错误 |
| calculation | 计算错误 |
| careless | 粗心错误 |

后续应扩展：

```text
misread：审题错误
incomplete：答案不完整
symbol：符号错误
unit：单位错误
method：方法选择错误
time：时间不足
```

## 后续多步题判分

多步题应支持部分得分。

示例：

```json
{
  "questionId": "math-quadratic-100",
  "status": "partial",
  "score": 2,
  "maxScore": 3,
  "stepResults": [
    {
      "stepId": "factor",
      "status": "correct"
    },
    {
      "stepId": "root-1",
      "status": "correct"
    },
    {
      "stepId": "root-2",
      "status": "wrong"
    }
  ]
}
```

## 后续表达式判分方向

### 简单方案

继续使用归一化答案：

```text
x = 2 或 x = 3
x=2,x=3
2,3
x1=2,x2=3
```

全部归一化为同一集合：

```text
{2, 3}
```

### 中级方案

引入数学表达式解析库，比较表达式树。

适合：

```text
(x - 2)(x - 3)
(x-3)*(x-2)
```

### 高级方案

定义中考数学专用答案类型：

```ts
type MathAnswer =
  | { type: "number"; value: number }
  | { type: "solution-set"; values: number[] }
  | { type: "point"; x: number; y: number }
  | { type: "interval"; start: number; end: number; open: boolean }
  | { type: "expression"; expression: string }
  | { type: "set"; values: string[] };
```

这样避免所有题目都使用自由文本。
