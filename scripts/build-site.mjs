import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicEntries } from './site-files.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

// 使用独立发布目录；每次重新生成，清理已从官网删除的旧页面和资源。
export function buildSite(outputDir = join(root, 'dist')) {
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });
  for (const entry of publicEntries) {
    cpSync(join(root, entry), join(outputDir, entry), {
      recursive: true,
      filter: (source) => basename(source) !== '.DS_Store',
    });
  }
  return outputDir;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildSite();
  console.log('AnyDeck 官网已打包到 dist/。');
}
