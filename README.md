# AnyDeck Website

AnyDeck 的产品官网、软件下载页与帮助中心。项目使用原生 HTML、CSS 与 JavaScript，无构建依赖，可直接部署到 GitHub Pages。

- 公网地址：https://solomanlove.github.io/AnyDeckWeb/
- GitHub 仓库：https://github.com/solomanlove/AnyDeckWeb

## 页面

- `index.html`：产品与功能介绍
- `download.html`：软件下载与环境要求
- `help.html`：帮助中心入口与功能指南
- `usb-debugging.html`：Android 厂商、HarmonyOS 与 iOS USB 连接指南
- `versions.html`：平台版本与 API 对照

## 本地预览

```bash
npm run serve
```

打开 `http://localhost:4173`。

## 验证

```bash
npm test
```

## 部署到 GitHub Pages

仓库通过 `.github/workflows/pages.yml` 自动发布：推送 `main` → Node.js 24 执行测试 → 生成 `dist/` → 上传 Pages artifact → 公网部署。测试失败会停止发布，Actions 中也支持手动运行。

`dist/` 只包含官网页面、`assets/` 与 `.nojekyll`。打包不会改写页面和相对路径，测试、脚本、知识库等开发文件不进入网站目录。使用 Node.js 24 或更新版本可在本地验证相同产物：

```bash
npm test
npm run build
git push origin main
```

首次部署需在仓库 `Settings → Pages → Build and deployment` 中将 Source 设为 `GitHub Actions`。仓库使用现有 SSH 登录推送，workflow 使用 GitHub 提供的短期权限，无需额外配置 PAT。

部署机制与回退说明见 [知识库](agent/knowledge/github-pages-deployment.md)。

> 当前官网只提供源码下载。发布 AnyDeck 二进制安装包后，请同步更新 `download.html` 中的 Release 状态与下载入口。
