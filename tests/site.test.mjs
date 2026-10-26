import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const pages = ['index.html', 'download.html', 'help.html'];
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
for (const id of ['quick-start', 'connect-usb', 'connect-wifi', 'mirroring', 'video-cast', 'app-files', 'diagnostics', 'troubleshooting']) {
  if (!help.includes(`id="${id}"`)) failures.push(`help.html: 缺少帮助章节 ${id}`);
}

const home = readFileSync(join(root, 'index.html'), 'utf8');
for (const positioning of ['任何设备，<br>一个控制台。', 'Any + Deck', 'Android、iOS 与 HarmonyOS', 'The universal desktop control deck for any mobile OS.']) {
  if (!home.includes(positioning)) failures.push(`index.html: 缺少品牌定位 ${positioning}`);
}

for (const videoCastCopy of ['Android 与 HarmonyOS', '抖音', '哔哩哔哩', '小红书', '爱奇艺', 'help.html#video-cast']) {
  if (!home.includes(videoCastCopy)) failures.push(`index.html: 缺少视频投屏信息 ${videoCastCopy}`);
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
