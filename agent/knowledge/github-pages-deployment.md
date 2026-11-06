# GitHub Pages 自动发布

## 需求与入口

将 AnyDeck 官网源码提交至 `solomanlove/AnyDeckWeb`，通过公网地址 `https://solomanlove.github.io/AnyDeckWeb/` 访问。保留官网现有内容，每次推送 `main` 后自动验证并更新网站。

## 发布机制

1. `.github/workflows/pages.yml` 监听 `main` 的 push，也支持 `workflow_dispatch` 手动触发。
2. Node.js 24 运行 `npm test`，验证官网内容、帮助搜索和静态资源打包；失败时不执行部署。
3. `npm run build` 通过 `scripts/site-files.mjs` 的公开文件清单重新生成 `dist/`，清除旧产物，保留页面相对路径以兼容 `/AnyDeckWeb/` 子路径。
4. `actions/upload-pages-artifact` 只上传 `dist/`；测试、脚本、知识库和仓库配置不进入网站目录。
5. `actions/deploy-pages` 发布到 `github-pages` environment。同组新任务会取消旧任务，单次 job 最多运行 10 分钟。

## 仓库与权限

- 仓库：`https://github.com/solomanlove/AnyDeckWeb`，默认分支 `main`。
- origin：`git@github.com:solomanlove/AnyDeckWeb.git`，本地推送复用既有 SSH 认证。
- Pages Source：`GitHub Actions`，公网 HTTPS 由 GitHub Pages 提供。
- workflow 权限：`contents: read`、`pages: write`、`id-token: write`，使用 GitHub 的短期凭证，不在代码中保存 PAT。
- 网站是静态官网；软件下载入口继续使用现有 AnyDeck 源码和 Release 状态。

## 验证与回退

```bash
npm test
npm run build
git push origin main
```

发布后在仓库 Actions 查看部署结果，并检查公网首页、帮助页、下载页和 CSS/JS/图片是否成功返回。产物测试使用临时目录，验证完整资源引用、项目子路径兼容、旧文件清理和开发文件排除。

需要回退时，对相应变更执行 `git revert <commit>` 并推送 `main`；workflow 将重新验证并发布回退后的内容。只恢复线上版本时，可在 Actions 对选定的历史成功任务执行 Re-run，恢复后仍应同步处理源码，避免后续推送覆盖。
