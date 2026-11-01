# 项目状态与跨会话记录

这份文档用于在新会话中快速恢复上下文。启动新的开发会话时，优先阅读本文件、`README.md` 和 `docs/03-progress.md`。

## 当前快照

最后记录时间：2026-11-01  
当前版本：`v0.9.0`  
当前分支：`main`  
当前最近提交：v0.7 几何扩展完成后的本地提交（尚未创建时以 `git log` 为准）  
远程仓库：未配置，未执行 `git push`  
工作区：应当保持干净；如果新会话发现未提交改动，先确认来源再继续开发。

## 项目定位

项目名称：中考冲刺书 / SprintBook。  
当前是数学试点，目标是构建可解释、可练习、可复盘的中考冲刺学习闭环。

当前学习闭环：

```text
考点讲解
→ 薄弱考点专项
→ 一键判分
→ 错题间隔复习
→ 分区限时模考
→ 加权掌握度与趋势更新
→ 每日冲刺计划
```

## 当前内容规模

```text
数学：16 考点 / 46 题 / 4 卷（较难 8 道）
物理：5 考点 / 15 题 / 2 卷（v0.9 试点）
合计：21 考点 / 61 题 / 6 卷
考点讲解覆盖：21/21
题目覆盖：21/21
结构健康：21/21
```

## 关键文件

### 应用入口与页面

```text
src/App.tsx
src/pages/Home.tsx
src/pages/Topics.tsx
src/pages/Practice.tsx
src/pages/Exam.tsx
src/pages/Mistakes.tsx
src/pages/Settings.tsx
```

### 核心业务

```text
src/lib/grading.ts       判分引擎
src/lib/mastery.ts       掌握度、时间衰减、难度调整
src/lib/planner.ts       每日冲刺计划
src/lib/storage.ts       学习进度、错题、复习调度
src/lib/exam.ts          分区试卷评分与趋势
src/lib/exam-storage.ts  模考会话和历史
```

### 内容文件

```text
src/data/math.json         知识点、考点讲解、题目
src/data/math-exams.json   分区试卷
src/data/sample-content.ts 内容导出与类型断言
```

数学内容当前版本：

```text
math-v0.8
```

## 已完成能力

### v0.1～v0.8 主线

1. 初始化 Vite + React + TypeScript 项目。
2. 建立冲刺看板、考点地图、专题练习、模考、错题本和设置页。
3. 引入 KaTeX 数学公式渲染。
4. 题库和试卷外置为 JSON。
5. 支持单选题、数值题和表达式题。
6. 支持一键判分、答案解析、更优方法和常见错误。
7. 实现本地学习进度和错题本。
8. 实现错题间隔复习：
   - 当天 → 1 天 → 2 天 → 4 天 → 7 天 → 15 天。
9. 实现掌握度模型：
   - 时间衰减。
   - 难度调整。
   - 覆盖率。
   - 正确率。
   - 连续答对稳定性。
   - 近期练习量。
10. 实现每日冲刺计划。
11. 实现分区限时模考、答题卡、自动交卷、分区报告、分考点报告。
12. 实现模考得分率趋势图。
13. 为全部考点补充结构化讲解（v0.6 起 11 个，v0.7 扩展到 16 个）。
14. 引入 Vitest 自动化测试。
15. 几何扩展：新增相交线与平行线、四边形、圆、直角三角形与勾股定理、图形变换 5 个考点、15 道题和 1 套几何基础专项卷。
16. 几何压轴扩展：新增 6 道难度 4 的压轴题（拐点模型、菱形求高、平行弦、勾股方程、母子相似、变换链），压轴挑战卷升级为 11 题 / 25 分钟 / 总分 22。
17. 多学科架构：学科路由前缀、内容注册表、按学科分键存储、学科切换器。
18. 物理试点：5 考点（运动、密度、压强、欧姆定律、声光）+ 15 题 + 2 卷。

## 当前测试与校验

新会话开发后应依次运行：

```bash
npm run validate:content
npm run report:coverage
npm test
npm run typecheck
npm run build
```

最近一次状态：

```text
内容校验通过
覆盖率报告通过
5 个测试文件 / 16 个测试通过
类型检查通过
生产构建通过
```

## 当前明确缺口

### 几何覆盖现状

当前几何相关考点：

```text
math-geometry-triangle        三角形与证明
math-geometry-congruence      全等三角形
math-geometry-similarity      相似三角形
math-geometry-lines-angles    相交线与平行线
math-geometry-quadrilateral   四边形与特殊平行四边形
math-geometry-circle          圆的基本性质与计算
math-geometry-right-triangle  直角三角形与勾股定理
math-geometry-transformation  图形变换：平移、旋转与轴对称
```

v0.7 已补齐中考几何基础体系的主体。仍然缺少：

```text
尺规作图
```

详细扩展方案见 [`docs/13-geometry-expansion-plan.md`](13-geometry-expansion-plan.md)。

### 其他缺口

1. 多步题和过程分尚未实现。
2. 表达式判分还不是完整数学等价判断。
3. 模考还不是标准中考真实分区和官方分值。
4. 内容缺少运行时 Schema 校验。
5. 模考逐题用时按整卷平均估算。
6. PWA 离线缓存尚未实现。

## 下一阶段建议顺序

### 第一优先级：多步题与过程分

支持解方程、几何证明、应用题等分步骤作答和分步判分。

### 第二优先级：运行时 Schema 校验

为 `math.json`、`math-exams.json` 增加 Zod 或类似运行时校验，避免 TypeScript 类型断言掩盖内容错误。

### 第三优先级：PWA 离线缓存

缓存页面、题库、试卷和讲解资源，保证弱网或离线可用。

## 新会话开发约定

1. 不主动推送到远程；用户会手动推送。
2. 不引入后端，先保持纯静态和本地存储。
3. 新增考点必须同时提供结构化讲解。
4. 新增考点至少 2 道题；高频考点建议 3 道以上。
5. 题目必须指定知识点、题型、难度、解析、来源和预估用时。
6. 每道题的公式使用 `$...$` 包裹。
7. 修改内容后必须运行内容校验和覆盖率报告。
8. 修改判分、复习、掌握度逻辑后必须补测试。
9. 每个阶段结束更新：
   - `docs/03-progress.md`
   - `docs/11-changelog.md`
   - 本文件。
10. 只在本地提交，不执行 `git push`。

## 新会话接手提示

可以先运行：

```bash
cd /Users/xiaoyyu/IdeaProjects/zhongkao-sprint-book
git status
git log --oneline -10
npm run validate:content
npm run report:coverage
npm test
npm run typecheck
npm run build
```

如果全部通过，说明基线正常。

然后优先阅读：

```text
docs/12-project-state.md
docs/13-geometry-expansion-plan.md
docs/03-progress.md
docs/02-roadmap.md
```

如果用户说“继续”，默认从几何扩展开始。
