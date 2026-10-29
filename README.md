# AnyDeck Website

AnyDeck 的产品官网、软件下载页与帮助中心。项目使用原生 HTML、CSS 与 JavaScript，无构建依赖，可直接部署到 GitHub Pages。

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

1. 在 GitHub 创建空仓库，并添加为当前目录的 `origin`。
2. 推送 `main` 分支。
3. 在仓库 `Settings → Pages → Build and deployment` 中选择 `GitHub Actions`。
4. `.github/workflows/pages.yml` 会部署仓库根目录。

```bash
git remote add origin git@github.com:<owner>/<repository>.git
git push -u origin main
```

> 当前官网只提供源码下载。发布 AnyDeck 二进制安装包后，请同步更新 `download.html` 中的 Release 状态与下载入口。
