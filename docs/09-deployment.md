# 部署文档

## 当前部署目标

GitHub Pages。

## 构建方式

```bash
npm install
npm run build
```

构建产物：

```text
dist/
```

## 本地预览

```bash
npm run preview
```

## GitHub Pages 设置

1. 打开仓库。
2. 进入 `Settings → Pages`。
3. 将 Source 设置为 `GitHub Actions`。
4. 推送到 `main` 分支。
5. GitHub Actions 会自动构建并发布 `dist`。

## 项目路径配置

如果仓库部署为项目页：

```text
https://<username>.github.io/zhongkao-sprint-book/
```

`vite.config.ts` 应设置为：

```ts
export default defineConfig({
  base: "/zhongkao-sprint-book/",
});
```

如果使用自定义域名或用户主站，可以改为：

```ts
export default defineConfig({
  base: "/",
});
```

## GitHub Actions

当前已添加：

```text
.github/workflows/deploy.yml
```

流程：

```text
checkout
→ setup node
→ npm ci
→ validate:content
→ report:coverage
→ test
→ typecheck
→ build
→ upload dist
→ deploy GitHub Pages
```

## 注意事项

1. 仓库名如果改变，需要同步修改 Vite `base`。
2. 如果部署到根路径，`base` 应改为 `/`。
3. GitHub Pages 只适合静态站点，不要依赖后端 API。
4. 后续加入 PWA 时，Service Worker 作用路径也要检查。
