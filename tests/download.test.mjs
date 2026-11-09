// 下载入口与安装指引回归：已发布的 macOS 可下载，其它平台不误导用户。
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../download.html', import.meta.url), 'utf8');
const release = 'https://github.com/solomanlove/AnyDeck/releases';

test('macOS v1.0.0 提供可操作的固定版本 DMG、ZIP 和校验入口', () => {
  const card = html.match(/<article\b[^>]*id="macos-download"[^>]*>[\s\S]*?<\/article>/)?.[0] ?? '';
  assert.match(card, /Apple Silicon（M1 或更新）/);
  assert.match(card, /macOS 12/);
  assert.match(card, /不适用于 Intel Mac/);
  assert.ok(card.includes(`href="${release}/download/v1.0.0/AnyDeck-macOS-arm64.dmg"`));
  assert.doesNotMatch(card, /aria-disabled|class="button disabled"/);
  for (const asset of ['AnyDeck-macOS-arm64.zip', 'SHA256SUMS']) {
    assert.ok(html.includes(`href="${release}/download/v1.0.0/${asset}"`));
  }
  assert.ok(html.includes(`href="${release}/tag/v1.0.0"`));
  assert.doesNotMatch(html, /公开安装包尚未发布|当前公开仓库尚未发布|截至 2026-10-26/);
});

test('Windows 与 Linux 仍明确显示暂未开放下载', () => {
  const cards = [...html.matchAll(/<article class="download-card"[^>]*>[\s\S]*?<\/article>/g)].map((item) => item[0]);
  assert.equal(cards.length, 3);
  for (const platform of ['Windows', 'Linux']) {
    const card = cards.find((item) => item.includes(platform)) ?? '';
    assert.match(card, /aria-disabled="true"/);
    assert.doesNotMatch(card, /href=/);
  }
});

test('首次打开说明覆盖 DMG、ZIP、开发者提示和系统安全设置路径', () => {
  const instructions = html.match(/<section class="section" id="macos-installation">[\s\S]*?<\/section>/)?.[0] ?? '';
  for (const copy of ['DMG', 'ZIP', 'Applications', '应用程序', '无法验证开发者',
    '系统设置 → 隐私与安全性', '仍要打开', '确认安装包来自上方官方 Release', '虚拟摄像头']) {
    assert.ok(instructions.includes(copy), `缺少安装指引：${copy}`);
  }
  assert.match(instructions, /<ol>[\s\S]*<li>/);
  assert.match(html, /ad-hoc 签名，未经 Apple 公证/);
  assert.ok(html.includes('href="#macos-installation"'));
  assert.doesNotMatch(instructions, /spctl|xattr|关闭.*安全保护/);
});
