# macOS v1.0.0 下载入口与安装说明

## 需求与范围

将下载页由“安装包尚未发布”更新为已发布的 macOS v1.0.0。启用固定版本 DMG 主按钮，提供 ZIP、SHA-256 与 Release 入口；说明 Apple Silicon（M1 或更新）、macOS 12 或更新系统及 Intel 不适用。Windows、Linux 维持未开放下载状态。

下载入口更新限于下载页；后续 scrcpy 依赖纠错同步覆盖首页、帮助页与下载页。不改截图或图片资源。

## 安装路径

新增 `download.html#macos-installation`：打开 DMG 并拖入 Applications，或解压 ZIP 后将 App 放入“应用程序”；尝试打开后，如遇未验证开发者提示，确认来源后通过“系统设置 → 隐私与安全性 → 仍要打开”允许首次启动。说明本版本使用 ad-hoc 签名、未经 Apple 公证，以及系统虚拟摄像头无法激活的边界。

安装包已包含 Rust 引擎，无需用户安装 Flutter/Rust；设备连接仍需 ADB/HDC/go-ios 及手机授权。布局复用现有公共样式，不新增脚本或修改 CSS。

内嵌投屏无需安装外部 scrcpy。首页、快速开始与下载页统一移除其必装表述；仅“电脑本地录制”等仍调用外部 scrcpy 的录制模式保留按需安装说明。该修正仅调整文字，不更换截图。

## 验证与发布

`tests/download.test.mjs` 覆盖固定版本链接、架构与系统要求、未发布平台禁用状态、过期文案移除、安装说明锚点与关键操作步骤。测试接入 `npm test`，现有 deployment tests 继续检查打包资源和截图文件完整性。

```bash
npm test
npm run build
git push origin main
```

推送后由既有 GitHub Pages Workflow 发布；检查公网下载页文案与链接，并在桌面和手机宽度预览安装步骤。

2026-11-09 本地验证：5 个页面内容检查、5 项 Node tests 与静态打包均通过，本地 HTTP 预览可返回页面。内置浏览器初始化连续超时，桌面与手机宽度的视觉验收尚未完成；本次复用公共样式，没有修改 CSS 或图片。
