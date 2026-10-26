/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { after, it } from 'node:test';
import { runInThisContext } from 'node:vm';

// 回归：options 的 key 曾混用「原始值」与「下标」，值重复、或数字值与对象项下标相同时撞 key，
// 更新时 Vue 告警并错位复用选项 DOM。弹层触发器与本回归无关，替换成直接渲染内容插槽的桩。
const require = createRequire(path.join(process.cwd(), 'package.json'));
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node', 'Event', 'MouseEvent']) {
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: dom.window[key] });
}
const { compileScript, parse } = require('@vue/compiler-sfc');
const { build } = require('esbuild');
const { createApp, h, nextTick, shallowRef } = require('vue');

const result = await build({
  entryPoints: [path.resolve('app/components/reborn/ui/reborn-dropdown/RebornDropdown.vue')],
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
  alias: { '~': path.resolve('app'), '@': path.resolve('app') },
  plugins: [{ name: '下拉菜单隔离编译', setup(builder) {
    builder.onResolve({ filter: /RebornSelectTrigger\.vue$/ }, args => ({ path: args.path, namespace: 'stub' }));
    builder.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
      contents: `import { h } from 'vue'; export default { setup: (_, { slots }) => () => h('div', [slots.default?.(), slots.content?.()]) }`,
      loader: 'js', resolveDir: process.cwd(),
    }));
    builder.onLoad({ filter: /\.vue$/ }, args => {
      const { descriptor } = parse(readFileSync(args.path, 'utf8'), { filename: args.path });
      return {
        contents: compileScript(descriptor, { id: args.path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') } }).content,
        loader: 'ts', resolveDir: path.dirname(args.path),
      };
    });
  } }],
});
const compiled = { exports: {} };
runInThisContext(`(function(module, exports, require) {${result.outputFiles[0].text}\n})`)(compiled, compiled.exports, require);
const Dropdown = compiled.exports.default;

after(() => dom.window.close());

it('重复原始值、数字值与对象项下标相同、数字与同字面量字符串并存时，更新选项不撞 key、不错位', async () => {
  const shared = { id: 9 };
  const options = shallowRef([
    { label: '甲', value: 'share' },
    { label: '乙', value: 'share' },
    { label: '丙', value: 1 },
    { label: '丁', value: shared },
  ]);
  const warnings = [];
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp({ render: () => h(Dropdown, { options: options.value }, { default: () => h('button', '打开') }) });
  app.component('Icon', { render: () => h('i') });
  app.config.warnHandler = message => warnings.push(message);
  app.mount(container);
  const labels = () => [...container.querySelectorAll('[role="menu"] > *')].map(item => item.textContent.trim());
  assert.deepEqual(labels(), ['甲', '乙', '丙', '丁']);

  // 重排并插入与数字 1 同字面量的字符串 '1'：触发带 key 的子节点比对
  options.value = [
    { label: '丁', value: shared },
    { label: '丙', value: 1 },
    { label: '戊', value: '1' },
    { label: '乙', value: 'share' },
    { label: '甲', value: 'share' },
  ];
  await nextTick();
  assert.deepEqual(labels(), ['丁', '丙', '戊', '乙', '甲']);

  // 数字值与对象项的下标相同
  options.value = [{ label: '一', value: 1 }, { label: '对象', value: { id: 1 } }];
  await nextTick();
  options.value = [{ label: '对象', value: { id: 1 } }, { label: '一', value: 1 }];
  await nextTick();
  assert.deepEqual(labels(), ['对象', '一']);

  assert.deepEqual(warnings.filter(message => /duplicate keys/i.test(message)), []);
  app.unmount();
  container.remove();
});
