import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { buildSite } from '../scripts/build-site.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = new URL('https://example.test/AnyDeckWeb/');

// 从实际产物检查子路径部署，覆盖 GitHub Pages 项目站点的页面、脚本和 CSS 引用。
test('发布产物包含全部官网页面，且页面和 CSS 资源在项目子路径下可访问', (t) => {
  const output = mkdtempSync(join(tmpdir(), 'anydeckweb-pages-'));
  t.after(() => rmSync(output, { recursive: true, force: true }));
  buildSite(output);

  const pages = readdirSync(root).filter((entry) => entry.endsWith('.html'));
  assert.deepEqual(readdirSync(output).sort(), [...pages, 'assets', '.nojekyll'].sort());
  for (const page of pages) {
    assert.equal(readFileSync(join(output, page), 'utf8'), readFileSync(join(root, page), 'utf8'));
  }

  const files = readdirSync(output, { recursive: true }).filter((entry) => /\.(html|css)$/.test(entry));
  for (const file of files) {
    const contents = readFileSync(join(output, file), 'utf8');
    const references = file.endsWith('.html')
      ? [...contents.matchAll(/(?:href|src)="([^"#][^"]*)"/g)].map((match) => match[1])
      : [...contents.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)].map((match) => match[1]);
    for (const reference of references) {
      if (/^(https?:|mailto:|data:)/.test(reference)) continue;
      const target = new URL(reference, new URL(file, base));
      assert.equal(target.origin, base.origin, `${file}: 资源来源异常 ${reference}`);
      assert.ok(target.pathname.startsWith(base.pathname), `${file}: 资源逃离项目子路径 ${reference}`);
      const localPath = decodeURIComponent(target.pathname.slice(base.pathname.length));
      assert.ok(existsSync(join(output, localPath)), `${file}: 发布产物缺少 ${reference}`);
    }
  }

  const script = 'assets/js/site.js';
  assert.equal(readFileSync(join(output, script), 'utf8'), readFileSync(join(root, script), 'utf8'));
  for (const image of readdirSync(join(root, 'assets/images'))) {
    if (image === '.DS_Store') continue;
    assert.deepEqual(readFileSync(join(output, 'assets/images', image)), readFileSync(join(root, 'assets/images', image)));
  }
});

test('重复打包清除旧产物，开发文件不会进入网站目录', (t) => {
  const output = mkdtempSync(join(tmpdir(), 'anydeck-site-rebuild-'));
  t.after(() => rmSync(output, { recursive: true, force: true }));
  writeFileSync(join(output, 'removed-page.html'), '旧页面');
  buildSite(output);
  assert.equal(existsSync(join(output, 'removed-page.html')), false);
  for (const entry of ['.git', '.github', 'tests', 'scripts', 'agent', 'README.md', 'package.json']) {
    assert.equal(existsSync(join(output, entry)), false, `${entry} 不应进入发布产物`);
  }
});
