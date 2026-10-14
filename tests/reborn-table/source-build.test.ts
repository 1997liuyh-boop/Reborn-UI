/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('懒加载源码作为展示文本经过 Nitro 替换后仍可解析且保持原文', () => {
  const source = readFileSync(new URL('../../app/components/reborn/ui/reborn-table/table.lazy.ts', import.meta.url), 'utf8');
  // Vite 的 raw 导入先序列化为字符串，Nitro 随后执行不区分字符串的环境替换。
  const bundled = JSON.stringify(source).replace(/\btypeof window\b(?![.$])/g, '"undefined"');
  assert.equal(JSON.parse(bundled), source);
});
