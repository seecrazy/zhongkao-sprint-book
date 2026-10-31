# 几何扩展计划

这份计划用于 v0.7 几何模块扩展。目标是让几何覆盖从当前“三角形 / 全等 / 相似”扩展为更完整的中考几何基础体系。

## 当前状态

当前几何相关考点：

```text
math-geometry-triangle       三角形与证明
math-geometry-congruence     全等三角形
math-geometry-similarity     相似三角形
```

当前不足：

1. 缺少相交线与平行线。
2. 缺少四边形与特殊平行四边形。
3. 缺少圆的基本性质和计算。
4. 缺少直角三角形与勾股定理。
5. 缺少平移、旋转、轴对称等图形变换。
6. 暂不要求第一版覆盖尺规作图，但后续应保留扩展位。

## 新增考点清单

建议按以下顺序添加 5 个考点。

### 1. 相交线与平行线

建议 ID：

```text
math-geometry-lines-angles
```

名称：

```text
相交线与平行线
```

考试权重：

```text
high
```

讲解应覆盖：

- 余角、补角、对顶角。
- 垂直、垂线段最短。
- 同位角、内错角、同旁内角。
- 平行线的判定与性质。
- 数轴或图形中的角度计算。

建议题目：

```text
3 道
单选题 1 道
数值题 1 道
表达式题 1 道
难度：1～3
```

### 2. 四边形与特殊平行四边形

建议 ID：

```text
math-geometry-quadrilateral
```

名称：

```text
四边形与特殊平行四边形
```

考试权重：

```text
high
```

讲解应覆盖：

- 平行四边形的定义和判定。
- 矩形、菱形、正方形的性质与判定。
- 对角线关系。
- 特殊四边形的面积计算。
- 中位线定理。

建议题目：

```text
3 道
单选题 1 道
数值题 2 道
难度：1～3
```

### 3. 圆的基本性质与计算

建议 ID：

```text
math-geometry-circle
```

名称：

```text
圆的基本性质与计算
```

考试权重：

```text
high
```

讲解应覆盖：

- 圆心角、圆周角、弧、弦的关系。
- 圆周角定理。
- 垂直于弦的直径。
- 圆的内接四边形。
- 周长、弧长、扇形面积。

建议题目：

```text
3 道
单选题 1 道
数值题 2 道
难度：1～3
```

### 4. 直角三角形与勾股定理

建议 ID：

```text
math-geometry-right-triangle
```

名称：

```text
直角三角形与勾股定理
```

考试权重：

```text
high
```

讲解应覆盖：

- 直角三角形的边角名称。
- 勾股定理。
- 勾股定理逆定理。
- 常见勾股数。
- 面积法求斜边上的高。

建议题目：

```text
3 道
数值题 2 道
单选题 1 道
难度：1～3
```

### 5. 图形变换

建议 ID：

```text
math-geometry-transformation
```

名称：

```text
图形变换：平移、旋转与轴对称
```

考试权重：

```text
medium
```

讲解应覆盖：

- 轴对称的性质。
- 平移的性质。
- 旋转的性质。
- 坐标系中的平移与对称。
- 变换前后的图形全等。

建议题目：

```text
3 道
单选题 1 道
数值题 1 道
表达式题 1 道
难度：1～3
```

## 数量目标

当前：

```text
知识点：11
题目：25
```

几何扩展后目标：

```text
知识点：16
新增题目：约 15 道
题目总数：约 40 道
考点讲解：16 份
题目覆盖：16/16
结构健康：16/16
```

## 内容结构要求

每个新增考点必须包含：

```ts
objectives        学习目标，至少 2 条
keyIdea           核心思路
concepts          概念讲解，至少 2 块
formulas          核心公式，至少 1 个
workedExamples    例题讲解，至少 1 道
pitfalls          易错警示，至少 1 条
strategy          解题策略
```

讲解内容直接放在：

```json
{
  "knowledgePoints": [
    {
      "id": "math-geometry-circle",
      "lesson": {}
    }
  ]
}
```

题目必须放在：

```json
{
  "questions": []
}
```

每道题必须包含：

```text
id
subject
knowledgePointIds
displayType
type
difficulty
estimatedSeconds
stem
source
explanation
options / answer / acceptedAnswers
```

题目 ID 建议格式：

```text
math-lines-001
math-quadrilateral-001
math-circle-001
math-right-triangle-001
math-transformation-001
```

## JSON 插入位置

新增考点建议插入到 `math-geometry-similarity` 后，使几何考点相对集中。

```text
math-geometry-triangle
math-geometry-congruence
math-geometry-similarity
math-geometry-lines-angles
math-geometry-quadrilateral
math-geometry-circle
math-geometry-right-triangle
math-geometry-transformation
```

新增题目放在现有题目数组末尾即可，顺序不影响学习逻辑。

## 内容版本

几何扩展完成后，将：

```json
{
  "version": "math-v0.6"
}
```

升级为：

```json
{
  "version": "math-v0.7"
}
```

同时项目版本建议升级到：

```text
0.7.0
```

## 可选试卷扩展

几何扩展完成后，可以新增一卷：

```text
id: math-geometry-precision-001
title: 几何基础专项卷
durationMinutes: 20
level: topic
scorePerQuestion: 1
```

建议分区：

```text
1. 线段、角与平行线
2. 三角形、全等与相似
3. 四边形、圆、勾股与变换
```

每个分区 3～4 题，总题量 10～12 题。

## 完成标准

几何扩展完成后，以下命令必须通过：

```bash
npm run validate:content
npm run report:coverage
npm test
npm run typecheck
npm run build
```

覆盖率报告应达到：

```text
题目覆盖：16/16
结构健康：16/16
```

如果某个考点缺少题型或难度分层，应继续补题，不要降低校验标准。
