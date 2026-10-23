/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { it } from 'node:test';
import { buildRunnableDemoSections, buildSectionSfc } from '../../app/utils/demoSectionSfc';

it('图标名、字符串、注释与对象属性不会带入同名的演练场声明', () => {
  const source = buildSectionSfc('<Tree :data="data" />', `
const code = '不应出现';
const resetState = () => {};
const data = [{ icon: "lucide:code", code: 'resetState', label: '带\\'引号 code' }];
// resetState 只出现在注释中
`);
  assert.ok(source.includes('const data'));
  assert.ok(!source.includes('const code'));
  assert.ok(!source.includes('const resetState'));
});

it('模板字符串保留插值中的真实依赖，忽略纯文字与属性名', () => {
  const source = buildSectionSfc('<span>{{ label }}</span>', [
    "const code = '无关声明';",
    "const count = 2;",
    "const format = value => value.code;",
    // eslint-disable-next-line no-template-curly-in-string -- 保留待抽取源码中的模板插值
    'const label = `code ${format({ code: count })} ${`共 ${count} 项`}`;',
  ].join('\n'));
  assert.ok(source.includes('const count'));
  assert.ok(source.includes('const format'));
  assert.ok(!source.includes('const code'));
});

it('树选择器各分节仅携带所需状态，不带演练场 code 与 controls', () => {
  const raw = readFileSync(new URL('../../app/components/reborn/examples/reborn-tree-select/RebornTreeSelectDemo.vue', import.meta.url), 'utf8');
  const sections = buildRunnableDemoSections(raw);
  assert.ok(Object.keys(sections).length >= 8);
  for (const [title, source] of Object.entries(sections)) {
    assert.ok(!source.includes('const code ='), title);
    assert.ok(!source.includes('const controls ='), title);
  }
  assert.ok(sections['基础用法']?.includes('const single ='));
});

it('正则中的引号与花括号不会截断后续真实依赖', () => {
  const source = buildSectionSfc('<span>{{ format() }}</span>', `
const value = 3;
const code = '无关声明';
const format = () => {
  const pattern = /["}code]/;
  return value;
};
`);
  assert.ok(source.includes('const value'));
  assert.ok(!source.includes('const code'));
});
