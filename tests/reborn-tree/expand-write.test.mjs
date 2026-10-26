/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { after, it } from 'node:test';
import { runInThisContext } from 'node:vm';

// 回归：RebornTree 用「最后一次内部写入的展开集合」识别回流，但识别后从不清空，
// 父组件之后用新数组写回相同内容（如从快照恢复）时被当成回流跳过，autoExpandParent 不补全父链。
const require = createRequire(path.join(process.cwd(), 'package.json'));
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent', 'getComputedStyle']) {
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: dom.window[key] });
}
globalThis.requestAnimationFrame = callback => setTimeout(callback, 0);
globalThis.cancelAnimationFrame = clearTimeout;
const { compileScript, parse } = require('@vue/compiler-sfc');
const { build } = require('esbuild');
const { createApp, h, nextTick, shallowRef } = require('vue');

const result = await build({
  entryPoints: [path.resolve('app/components/reborn/ui/reborn-tree/RebornTree.vue')],
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
  alias: { '~': path.resolve('app'), '@': path.resolve('app') },
  plugins: [{ name: '树隔离编译', setup(builder) {
    // 展开收起动画与本回归无关：视为偏好减少动画，直接落到终态
    builder.onLoad({ filter: /lib[\\/]motion\.ts$/ }, () => ({ contents: `
      export const prefersReducedMotion = () => true;
      export function runMotion() { return { finished: Promise.resolve(), stop() {} }; }
      export function stopMotion() {}
    `, loader: 'js' }));
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
const Tree = compiled.exports.default;

after(() => dom.window.close());

const treeData = [{ key: 'P', title: '父', children: [{ key: 'C', title: '子', children: [{ key: 'G', title: '孙' }] }] }];

it('识别出内部写入的回流后清空标记：之后用新数组写回相同内容的外部变更仍会补全父链', async () => {
  const expandedKeys = shallowRef(['P', 'C']);
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp({
    render: () => h(Tree, {
      'treeData': treeData,
      'autoExpandParent': true,
      'expandedKeys': expandedKeys.value,
      'onUpdate:expandedKeys': (value) => { expandedKeys.value = value; },
    }),
  });
  // Nuxt 下全局自动注册的组件，测试里用空壳顶替
  app.component('Icon', { render: () => h('i') });
  app.component('RebornCheckbox', { render: () => h('input', { type: 'checkbox' }) });
  app.mount(container);
  await nextTick();

  // 用户收起父节点：组件内部写入 ['C']，父组件经 v-model 原样回写
  const switcher = container.querySelector('li[data-key="P"]').querySelector('span');
  switcher.click();
  await nextTick();
  await nextTick();
  assert.deepEqual(expandedKeys.value, ['C']);

  // 父组件从快照恢复：新数组、内容与上次内部写入相同，属于外部变更，autoExpandParent 应补全父链
  expandedKeys.value = ['C'];
  await nextTick();
  await nextTick();
  assert.deepEqual([...expandedKeys.value].sort(), ['C', 'P']);
  assert.equal(container.querySelector('li[data-key="P"]').getAttribute('aria-expanded'), 'true');

  app.unmount();
  container.remove();
});
