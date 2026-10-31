# Changelog

## v0.2.0 - 2026-10-31

### Added

- 引入 KaTeX 数学公式渲染。
- 新增 `MathText` 组件。
- 将数学知识点和题目外置到 `src/data/math.json`。
- 添加内容校验脚本 `validate:content`。
- 添加 URL Hash 路由，刷新后可保留页面。
- 表达式题增加解集判分基础版。
- 练习页增加“再练一组”。

### Improved

- 数学题干、选项、答案、解析和常见错误支持公式显示。
- 错题本支持公式显示。
- 内容校验可发现重复 ID、缺失字段、无效引用和公式定界符错误。

### Technical

- 更新版本号为 `0.2.0`。
- 本地通过 `validate:content`、`typecheck` 和 `build`。

## v0.1.0 - 2026-10-31

### Added

- 创建 SprintBook 项目骨架。
- 实现冲刺看板、考点地图、专题练习、错题本和设置页。
- 实现单选题、数值题和简单表达式题判分。
- 实现答案解析与更优方法展示。
- 实现本地错题本和进度存储。
- 添加 GitHub Pages Actions。
