import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const pages = ['index.html', 'download.html', 'help.html', 'versions.html', 'usb-debugging.html'];
const failures = [];

for (const page of pages) {
  const file = join(root, page);
  const html = readFileSync(file, 'utf8');

  if (!html.includes('<html lang="zh-CN">')) failures.push(`${page}: 缺少中文语言声明`);
  if (!html.includes('name="viewport"')) failures.push(`${page}: 缺少移动端 viewport`);
  if (!html.includes('<title>')) failures.push(`${page}: 缺少 title`);
  const header = html.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0] ?? '';
  if (!/<a href="index\.html#features"(?: aria-current="page")?>产品功能<\/a>/.test(header)) {
    failures.push(`${page}: 顶部导航缺少产品功能入口`);
  }
  if (header.includes('class="nav-dropdown"') || header.includes('功能概览') || header.includes('版本参考')) {
    failures.push(`${page}: 顶部导航不应保留功能下拉菜单或版本参考`);
  }

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
for (const id of ['quick-start', 'connect-usb', 'connect-wifi', 'network-tools', 'mirroring', 'screenshot-editing', 'airplay', 'video-cast', 'emulator-management', 'app-analysis', 'console', 'ai-mcp', 'app-files', 'diagnostics', 'troubleshooting']) {
  if (!help.includes(`id="${id}"`)) failures.push(`help.html: 缺少帮助章节 ${id}`);
}

for (const usbEntry of ['usb-debugging.html', 'USB 调试与设备信任', 'Android、HarmonyOS 与 iOS']) {
  if (!help.includes(usbEntry)) failures.push(`help.html: 缺少 USB 调试指南入口 ${usbEntry}`);
}

const usbDebugging = readFileSync(join(root, 'usb-debugging.html'), 'utf8');
for (const usbCopy of ['id="android"', '小米 / Redmi', 'OPPO / 一加 / realme', 'vivo / iQOO', '三星 Galaxy', '荣耀 MagicOS', '华为 EMUI', 'id="harmonyos"', 'HarmonyOS 5', 'HDC', 'id="ios"', '信任此电脑', '开发者模式', 'adb devices', 'hdc list targets', 'xcrun devicectl list devices']) {
  if (!usbDebugging.includes(usbCopy)) failures.push(`usb-debugging.html: 缺少 USB 调试信息 ${usbCopy}`);
}

const styleImports = readFileSync(join(root, 'assets/css/styles.css'), 'utf8');
if (!styleImports.includes('@import url("usb-debugging.css")')) {
  failures.push('styles.css: 缺少 USB 调试页面样式入口');
}

const home = readFileSync(join(root, 'index.html'), 'utf8');

// 编辑帮助需要可从首页、目录和搜索找到，且说明实际操作和结果保留边界。
const editingArticle = help.match(/<article\b(?=[^>]*\bid="screenshot-editing")[^>]*>[\s\S]*?<\/article>/)?.[0] ?? '';
const helpSidebar = help.match(/<aside class="help-sidebar"[^>]*>[\s\S]*?<\/aside>/)?.[0] ?? '';
const helpCards = [...help.matchAll(/<article class="help-card"[^>]*>[\s\S]*?<\/article>/g)].map((match) => match[0]);
const editingCard = helpCards.find((card) => card.includes('href="#screenshot-editing"')) ?? '';
if (!home.includes('href="help.html#screenshot-editing"')) failures.push('index.html: 缺少图片编辑帮助入口');
if (!helpSidebar.includes('href="#screenshot-editing"')) failures.push('help.html: 帮助目录缺少图片编辑入口');
if (!editingCard.includes('data-search-item') || !editingArticle.includes('data-search-item')) {
  failures.push('help.html: 图片编辑卡片与正文必须可被帮助搜索发现');
}
if (!/<ol>[\s\S]*?<li>/.test(editingArticle)) failures.push('help.html: 图片编辑指南缺少有序操作步骤');
for (const editingCopy of ['编辑图片', '矩形', '圆形', '画笔', '马赛克', '不透明遮盖', '撤销', '重做', '完成', '保存', '复制', '原图', '200']) {
  if (!editingArticle.includes(editingCopy)) failures.push(`help.html: 图片编辑正文缺少操作说明 ${editingCopy}`);
}
for (const [label, pattern] of [
  ['连续截图暂停', /连续截图[\s\S]*?暂停/],
  ['刷新后编辑结果清理', /(?:刷新|重新截图)[\s\S]*?(?:清除|清空|覆盖|替换)/],
  ['会话撤销历史', /(?:重新进入|再次进入)[\s\S]*?撤销[\s\S]*?(?:不保留|不再保留|不会保留|无法)/],
  ['预览旋转和导出方向', /旋转[\s\S]*?预览[\s\S]*?导出[\s\S]*?方向/],
]) {
  if (!pattern.test(editingArticle)) failures.push(`help.html: 图片编辑正文缺少${label}说明`);
}

// 执行真实搜索脚本，用页面中的卡片和正文作为输入，验证新增指南不只出现在目录。
const searchableArticles = [...help.matchAll(/<article\b[^>]*\bdata-search-item\b[^>]*>[\s\S]*?<\/article>/g)].map((match) => ({
  html: match[0],
  textContent: match[0].replace(/<[^>]*>/g, ' '),
  hidden: false,
}));
const searchHandlers = new Map();
const searchInput = { addEventListener: (event, handler) => searchHandlers.set(event, handler) };
const searchEmptyState = { style: { display: 'none' } };
runInNewContext(readFileSync(join(root, 'assets/js/site.js'), 'utf8'), {
  document: {
    querySelector: (selector) => selector === '[data-help-search]' ? searchInput : selector === '[data-empty-state]' ? searchEmptyState : null,
    querySelectorAll: (selector) => selector === '[data-search-item]' ? searchableArticles : [],
  },
});
const search = searchHandlers.get('input');
if (typeof search !== 'function') {
  failures.push('site.js: 帮助搜索未注册 input 事件');
} else {
  search({ target: { value: ' 马赛克 ' } });
  const editingMatches = searchableArticles.filter((item) => item.html.includes('id="screenshot-editing"') || item.html.includes('href="#screenshot-editing"'));
  if (editingMatches.length !== 2 || editingMatches.some((item) => item.hidden)) failures.push('帮助搜索: 马赛克应同时显示图片编辑卡片和正文');
  if (!searchableArticles.some((item) => item.hidden) || searchEmptyState.style.display !== 'none') failures.push('帮助搜索: 有匹配时应过滤其他指南并隐藏空状态');
  search({ target: { value: '不存在的图片功能-987654321' } });
  if (searchableArticles.some((item) => !item.hidden) || searchEmptyState.style.display !== 'block') failures.push('帮助搜索: 无匹配时应显示空状态');
  search({ target: { value: '' } });
  if (searchableArticles.some((item) => item.hidden) || searchEmptyState.style.display !== 'none') failures.push('帮助搜索: 清空关键词后应恢复全部指南');
}

for (const positioning of ['任何设备，<br>一个控制台。', 'Any + Deck', 'Android、iOS 与 HarmonyOS', '面向所有移动操作系统的万能桌面控制台。']) {
  if (!home.includes(positioning)) failures.push(`index.html: 缺少品牌定位 ${positioning}`);
}

const versions = readFileSync(join(root, 'versions.html'), 'utf8');
for (const versionCopy of ['Android 17', 'API 37', 'Android 12', 'API 31', 'HarmonyOS 7.0.0', 'API 26.0.0', 'HarmonyOS 6.0.0', 'API 20', 'iOS 27', 'Xcode 27', '最低部署版本', '没有 Android 式 API 级别']) {
  if (!versions.includes(versionCopy)) failures.push(`versions.html: 缺少版本对照 ${versionCopy}`);
}

for (const versionEntry of ['平台版本参考', 'versions.html', '系统版本 ↔ API 级别', '系统版本 ↔ API 版本', '系统版本 ↔ Xcode / SDK']) {
  if (!home.includes(versionEntry)) failures.push(`index.html: 缺少版本参考入口 ${versionEntry}`);
}

for (const videoCastCopy of ['Android 与 HarmonyOS', '抖音', '哔哩哔哩', '小红书', '爱奇艺', 'help.html#video-cast']) {
  if (!home.includes(videoCastCopy)) failures.push(`index.html: 缺少视频投屏信息 ${videoCastCopy}`);
}

for (const airplayCopy of ['iOS 无线投屏', 'iPhone / iPad', 'AnyDeck-AirPlay', 'AirPlay 接收服务', '仅支持 macOS', '实验性能力', 'help.html#airplay']) {
  if (!home.includes(airplayCopy)) failures.push(`index.html: 缺少 AirPlay 投屏信息 ${airplayCopy}`);
}

for (const airplayHelpCopy of ['控制中心', '屏幕镜像', '停止镜像', '不提供从 Mac 反向控制']) {
  if (!help.includes(airplayHelpCopy)) failures.push(`help.html: 缺少 AirPlay 帮助信息 ${airplayHelpCopy}`);
}

for (const developerToolCopy of ['模拟器管理', 'Android AVD', 'DevEco Emulator', 'Xcode Simulator', '应用分析', '目标 SDK', '原生库', 'help.html#emulator-management', 'help.html#app-analysis']) {
  if (!home.includes(developerToolCopy)) failures.push(`index.html: 缺少开发工具信息 ${developerToolCopy}`);
}

for (const consoleCopy of ['运行控制台', 'AnyDeck 控制台', '关键词搜索', '关键日志', '隐藏心跳', '导出 .log', '不等同于手机系统日志', 'help.html#console']) {
  if (!home.includes(consoleCopy) && !help.includes(consoleCopy)) failures.push(`网站缺少控制台信息 ${consoleCopy}`);
}

for (const networkCopy of ['网络调试', '设备 HTTP 正向代理', '正向端口映射', '反向端口映射', 'Android / HarmonyOS', '电脑 localhost:9222', '设备 localhost:8081', 'help.html#network-tools']) {
  if (!home.includes(networkCopy)) failures.push(`index.html: 缺少代理与端口转发信息 ${networkCopy}`);
}

for (const networkHelpCopy of ['电脑 localhost → 设备 localhost', '设备 localhost → 电脑 localhost', '端口范围为 1–65535', 'SOCKS', 'PAC', 'adb reverse']) {
  if (!help.includes(networkHelpCopy)) failures.push(`help.html: 缺少代理与端口转发帮助信息 ${networkHelpCopy}`);
}

for (const mcpCopy of ['AI MCP 服务', '22 项 MCP 工具', 'take_screenshot', 'query_app_crashes', 'execute_shell', 'http://127.0.0.1:8765/sse', 'help.html#ai-mcp']) {
  if (!home.includes(mcpCopy)) failures.push(`index.html: 缺少 AI MCP 信息 ${mcpCopy}`);
}

const allVisibleCopy = pages.map((page) => readFileSync(join(root, page), 'utf8')).join('\n');
for (const untranslatedCopy of ['Any device · One control deck', 'What AnyDeck means', 'Everything in reach', 'Developer workspace', 'Platform version reference', 'Network debugging', 'Runtime console', 'iOS wireless mirroring', 'Video casting', 'A shorter loop', 'Real product, real screens', 'Build from source', 'Prerequisites', 'Help center', 'USB connection guide', 'Connection check', 'Troubleshooting', 'Official references', 'Developer options', 'USB debugging', 'Developer Mode', 'Android Developers：', 'Apple Developer：', 'Apple Support：']) {
  if (allVisibleCopy.includes(untranslatedCopy)) failures.push(`网站仍包含未中文化文案 ${untranslatedCopy}`);
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
