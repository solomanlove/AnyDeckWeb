import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const pages = ['index.html', 'download.html', 'help.html', 'versions.html'];
const failures = [];

for (const page of pages) {
  const file = join(root, page);
  const html = readFileSync(file, 'utf8');

  if (!html.includes('<html lang="zh-CN">')) failures.push(`${page}: 缺少中文语言声明`);
  if (!html.includes('name="viewport"')) failures.push(`${page}: 缺少移动端 viewport`);
  if (!html.includes('<title>')) failures.push(`${page}: 缺少 title`);

  for (const match of html.matchAll(/(?:href|src)="([^"#][^"]*)"/g)) {
    const target = match[1];
    if (/^(https?:|mailto:|data:)/.test(target)) continue;
    const localTarget = target.split('#')[0].split('?')[0];
    if (!localTarget) continue;
    const absoluteTarget = join(dirname(file), localTarget);
    if (!existsSync(absoluteTarget)) failures.push(`${page}: 本地资源不存在 ${target}`);
  }
}

const help = readFileSync(join(root, 'help.html'), 'utf8');
for (const id of ['quick-start', 'connect-usb', 'connect-wifi', 'network-tools', 'mirroring', 'airplay', 'video-cast', 'emulator-management', 'app-analysis', 'console', 'ai-mcp', 'app-files', 'diagnostics', 'troubleshooting']) {
  if (!help.includes(`id="${id}"`)) failures.push(`help.html: 缺少帮助章节 ${id}`);
}

const home = readFileSync(join(root, 'index.html'), 'utf8');
for (const positioning of ['任何设备，<br>一个控制台。', 'Any + Deck', 'Android、iOS 与 HarmonyOS', 'The universal desktop control deck for any mobile OS.']) {
  if (!home.includes(positioning)) failures.push(`index.html: 缺少品牌定位 ${positioning}`);
}

const versions = readFileSync(join(root, 'versions.html'), 'utf8');
for (const versionCopy of ['Android 17', 'API 37', 'Android 12', 'API 31', 'HarmonyOS 7.0.0', 'API 26.0.0', 'HarmonyOS 6.0.0', 'API 20', 'iOS 27', 'Xcode 27', 'Deployment Target', '没有 Android 式 API Level']) {
  if (!versions.includes(versionCopy)) failures.push(`versions.html: 缺少版本对照 ${versionCopy}`);
}

for (const versionEntry of ['Platform version reference', 'versions.html', 'Version ↔ API Level', 'Version ↔ API Version', 'Version ↔ Xcode / SDK']) {
  if (!home.includes(versionEntry)) failures.push(`index.html: 缺少版本参考入口 ${versionEntry}`);
}

for (const videoCastCopy of ['Android 与 HarmonyOS', '抖音', '哔哩哔哩', '小红书', '爱奇艺', 'help.html#video-cast']) {
  if (!home.includes(videoCastCopy)) failures.push(`index.html: 缺少视频投屏信息 ${videoCastCopy}`);
}

for (const airplayCopy of ['iOS wireless mirroring', 'iPhone / iPad', 'AnyDeck-AirPlay', 'AirPlay Receiver', '仅支持 macOS', '实验性能力', 'help.html#airplay']) {
  if (!home.includes(airplayCopy)) failures.push(`index.html: 缺少 AirPlay 投屏信息 ${airplayCopy}`);
}

for (const airplayHelpCopy of ['控制中心', '屏幕镜像', '停止镜像', '不提供从 Mac 反向控制']) {
  if (!help.includes(airplayHelpCopy)) failures.push(`help.html: 缺少 AirPlay 帮助信息 ${airplayHelpCopy}`);
}

for (const developerToolCopy of ['模拟器管理', 'Android AVD', 'DevEco Emulator', 'Xcode Simulator', '应用分析', 'Target SDK', '原生库', 'help.html#emulator-management', 'help.html#app-analysis']) {
  if (!home.includes(developerToolCopy)) failures.push(`index.html: 缺少开发工具信息 ${developerToolCopy}`);
}

for (const consoleCopy of ['Runtime console', 'AnyDeck Console', '关键词搜索', '关键日志', '隐藏心跳', '导出 .log', '不等同于手机 Logcat', 'help.html#console']) {
  if (!home.includes(consoleCopy) && !help.includes(consoleCopy)) failures.push(`网站缺少控制台信息 ${consoleCopy}`);
}

for (const networkCopy of ['Network debugging', '设备 HTTP 正向代理', 'Forward Port Mapping', 'Reverse Port Mapping', 'Android / HarmonyOS', '电脑 localhost:9222', '设备 localhost:8081', 'help.html#network-tools']) {
  if (!home.includes(networkCopy)) failures.push(`index.html: 缺少代理与端口转发信息 ${networkCopy}`);
}

for (const networkHelpCopy of ['电脑 localhost → 设备 localhost', '设备 localhost → 电脑 localhost', '端口范围为 1–65535', 'SOCKS', 'PAC', 'adb reverse']) {
  if (!help.includes(networkHelpCopy)) failures.push(`help.html: 缺少代理与端口转发帮助信息 ${networkHelpCopy}`);
}

for (const mcpCopy of ['AI MCP Server', '22 项 MCP Tools', 'take_screenshot', 'query_app_crashes', 'execute_shell', 'http://127.0.0.1:8765/sse', 'help.html#ai-mcp']) {
  if (!home.includes(mcpCopy)) failures.push(`index.html: 缺少 AI MCP 信息 ${mcpCopy}`);
}

const baseStyles = readFileSync(join(root, 'assets/css/base.css'), 'utf8');
const secondaryButtonStyles = baseStyles.match(/\.button\.secondary\s*\{([^}]*)\}/)?.[1] ?? '';
if (!secondaryButtonStyles.includes('color: var(--ink)')) {
  failures.push('base.css: secondary 按钮必须显式设置深色文字，避免在深色容器中继承白色');
}

const pageStyles = readFileSync(join(root, 'assets/css/pages.css'), 'utf8');
const searchIconStyles = pageStyles.match(/\.search-wrap::after\s*\{([^}]*)\}/)?.[1] ?? '';
if (!searchIconStyles.includes('width: 26px') || !searchIconStyles.includes('svg+xml')) {
  failures.push('pages.css: 帮助搜索框必须使用固定尺寸 SVG 搜索图标');
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`已验证 ${pages.length} 个页面：元数据、本地链接和帮助章节均有效。`);
