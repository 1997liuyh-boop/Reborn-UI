/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { afterEach, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { runInThisContext } from 'node:vm';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const { compileScript, parse } = require('@vue/compiler-sfc');
const { build } = require('esbuild');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><head><style>.reborn-descriptions { padding: 0; border: 0 solid transparent; }</style></head><body><div id="teleports"></div></body></html>', { url: 'http://localhost' });
for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node', 'MutationObserver']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
globalThis.requestAnimationFrame = callback => setTimeout(callback, 0);
globalThis.cancelAnimationFrame = clearTimeout;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
HTMLElement.prototype.getBoundingClientRect = () => ({ width: 900, height: 48, top: 0, left: 0, right: 900, bottom: 48 });
const observers = new Set();
class TestResizeObserver {
  constructor(callback) { this.callback = callback; }
  observe(target) { this.target = target; observers.add(this); }
  disconnect() { observers.delete(this); }
}
globalThis.ResizeObserver = dom.window.ResizeObserver = TestResizeObserver;
const { createApp, h, shallowRef, nextTick } = await import(pathToFileURL(require.resolve('vue')).href);

async function compileComponent(filename) {
  const result = await build({
    entryPoints: [path.resolve('app/components/reborn/ui/multi-step-loader', filename)], bundle: true, write: false,
    platform: 'node', format: 'cjs', packages: 'external',
    plugins: [{ name: '测试编译Vue', setup(builder) {
      builder.onResolve({ filter: /^~\// }, args => ({ path: path.resolve('app', `${args.path.slice(2)}.ts`) }));
      builder.onLoad({ filter: /\.vue$/ }, args => {
        const { descriptor, errors } = parse(readFileSync(args.path, 'utf8'), { filename: args.path });
        assert.deepEqual(errors, []);
        return { contents: compileScript(descriptor, { id: args.path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') } }).content, loader: 'ts', resolveDir: path.dirname(args.path) };
      });
    } }],
  });
  const module = { exports: {} };
  runInThisContext(`(function(module, exports, require) { ${result.outputFiles[0].text}\n})`)(module, module.exports, require);
  return module.exports.default;
}
const Loader = await compileComponent('MultiStepLoader.vue');
const mounted = [];
afterEach(() => { mounted.splice(0).forEach(cleanup => cleanup()); });
const pause = () => new Promise(resolve => setTimeout(resolve, 20));
function mount(initial) {
  const props = shallowRef(initial);
  const events = [];
  const container = document.createElement('div'); document.body.append(container);
  const app = createApp({ setup: () => () => h(Loader, { ...props.value, onComplete: () => events.push('complete'), 'onState-change': value => events.push(value) }) });
  app.mount(container);
  const unmount = () => { app.unmount(); container.remove(); };
  mounted.push(unmount);
  return { props, events, unmount };
}
it('首次 loading=true 自动开始并完成', async () => {
  const p = mount({ loading: true, defaultDuration: 1, steps: [{ text: '完成' }] });
  await pause(); assert.deepEqual(p.events, ['complete']);
});
it('关闭期间已开始的 action 完成后不派发事件', async () => {
  let finish;
  const pending = new Promise(resolve => { finish = resolve; });
  const p = mount({ loading: false, defaultDuration: 1, steps: [{ text: '等待', action: () => pending }, { text: '完成' }] });
  p.props.value = { ...p.props.value, loading: true }; await nextTick(); await pause();
  p.props.value = { ...p.props.value, loading: false }; await nextTick();
  finish(); await pause(); assert.deepEqual(p.events, []);
});

it('全屏层挂载到专用 teleports 目标，原生按钮没有 size 属性', async () => {
  mount({loading:true,steps:[{text:'传送目标',async:true}]});await nextTick();
  const target=document.querySelector('#teleports');
  assert.ok(target.querySelector('.fixed'));assert.equal(target.querySelector('button').hasAttribute('size'),false);
});

it('SSR 将全屏层写入 #teleports 上下文', async () => {
  const {renderToString}=require('@vue/server-renderer');const {createSSRApp}=require('vue');const context={};
  const html=await renderToString(createSSRApp({render:()=>h(Loader,{loading:true,steps:[{text:'服务端传送',async:true}]})}),context);
  assert.ok(context.teleports?.['#teleports']?.includes('服务端传送'));assert.equal(html.includes('服务端传送'),false);
});

it('SSR 渲染不启动步骤定时器，也不执行步骤 action 或派发事件', async () => {
  const { renderToString } = require('@vue/server-renderer');
  const { createSSRApp } = require('vue');
  const calls = [];
  const events = [];
  const steps = [{ text: '读取', action: () => { calls.push('a'); } }, { text: '完成', action: () => { calls.push('b'); } }];
  const app = createSSRApp({ render: () => h(Loader, { loading: true, defaultDuration: 1, steps, onComplete: () => events.push('complete'), 'onState-change': value => events.push(value) }) });
  const context = {};
  await renderToString(app, context);
  // 首屏仍输出第一步，客户端水合后从同一位置开始
  assert.ok(context.teleports?.['#teleports']?.includes('读取'));
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.deepEqual(calls, []);
  assert.deepEqual(events, []);
});
