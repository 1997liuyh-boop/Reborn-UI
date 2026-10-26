/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { after, it } from 'node:test';
import { runInThisContext } from 'node:vm';

// 回归：v-model 初值为 true 的对话框在服务端 setup 里同步打开，曾把实例压进模块级弹层栈且永不出栈，
// 导致服务端输出的 z-index 随请求数递增、客户端从空栈算出基础层级，水合对不上。
const require = createRequire(path.join(process.cwd(), 'package.json'));
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node', 'NodeList', 'Event', 'MouseEvent', 'KeyboardEvent', 'FocusEvent', 'MutationObserver', 'getComputedStyle']) {
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: dom.window[key] });
}
globalThis.requestAnimationFrame = callback => setTimeout(callback, 1);
globalThis.cancelAnimationFrame = clearTimeout;
const { compileScript, parse } = require('@vue/compiler-sfc');
const { build } = require('esbuild');
const { createApp, createSSRApp, h, nextTick } = require('vue');
// 根目录的 @vue/server-renderer 是小程序端的 3.4，必须取 vue 自带的同版本渲染器，否则 Teleport 锚点对不上。
const { renderToString } = require('vue/server-renderer');

const result = await build({
  entryPoints: [path.resolve('app/components/reborn/ui/reborn-dialog/RebornDialog.vue')],
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
  alias: { '~': path.resolve('app'), '@': path.resolve('app') },
  plugins: [{ name: '对话框隔离编译', setup(builder) {
    // 按钮与滚动容器与本回归无关，替换成只渲染插槽的桩，避免引入额外的浏览器依赖。
    builder.onResolve({ filter: /Reborn(Button|Scrollbar)\.vue$/ }, args => ({ path: args.path, namespace: 'stub' }));
    builder.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
      contents: `import { h } from 'vue'; export default { inheritAttrs: false, setup: (_, { slots }) => () => h('div', slots.default?.()) }`,
      loader: 'js', resolveDir: process.cwd(),
    }));
    // 动画只需在给定时长后落到终值，真实插值由浏览器测试覆盖。
    builder.onLoad({ filter: /lib[\\/]motion\.ts$/ }, () => ({ contents: `
      export function runMotion(element, frames, options = {}) {
        let resolve; const finished = new Promise(done => resolve = done);
        const timer = setTimeout(() => {
          for (const [key, value] of Object.entries(frames)) element.style[key] = Array.isArray(value) ? value[value.length - 1] : value;
          resolve();
        }, (options.duration ?? 0) * 1000);
        return { finished, stop() { clearTimeout(timer); resolve(); } };
      }
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
const Dialog = compiled.exports.default;

const cleanups = [];
after(() => { while (cleanups.length) cleanups.pop()(); dom.window.close(); });

function makeApp(factory, props = {}) {
  const app = factory({ render: () => h(Dialog, { modelValue: true, title: '标题', ...props }, { default: () => h('p', '正文') }) });
  app.component('Icon', { render: () => h('i') });
  return app;
}
/** 读出根层 style 上的 z-index，SSR 输出与客户端 DOM 共用 */
const zIndexOf = html => /z-index:\s*(\d+)/.exec(html)?.[1];

it('服务端渲染初始打开的对话框不进入弹层栈：多次请求层级不递增，客户端随后打开仍从基础层级开始', async () => {
  const levels = [];
  for (let request = 0; request < 3; request++) {
    const context = {};
    delete globalThis.document;
    try {
      await renderToString(makeApp(createSSRApp), context);
    }
    finally {
      globalThis.document = dom.window.document;
    }
    levels.push(zIndexOf(context.teleports?.body ?? ''));
  }
  assert.deepEqual(levels, ['2400', '2400', '2400']);

  // 同一个 Node 进程里的模块级栈若残留服务端实例，客户端首个弹层会被抬高到 2406。
  const container = document.createElement('div');
  document.body.append(container);
  const app = makeApp(createApp);
  app.mount(container);
  cleanups.push(() => { app.unmount(); container.remove(); });
  await nextTick();
  const root = [...document.body.children].find(element => element.style.zIndex);
  assert.equal(root?.style.zIndex, '2400');
  app.unmount();
  container.remove();
  cleanups.pop();
});

it('服务端输出的层级与客户端水合一致，不产生水合不匹配告警', async () => {
  const context = {};
  delete globalThis.document;
  let html;
  try {
    html = await renderToString(makeApp(createSSRApp, { zIndex: 3000 }), context);
  }
  finally {
    globalThis.document = dom.window.document;
  }
  assert.equal(zIndexOf(context.teleports?.body ?? ''), '3000');

  // Teleport 水合从目标的首个子节点找起始锚点，传送内容要放在 body 开头。
  document.body.innerHTML = `${context.teleports.body}<div id="app">${html}</div>`;
  const warnings = [];
  const originalWarn = console.warn;
  const originalError = console.error;
  console.warn = (...args) => warnings.push(args.join(' '));
  console.error = (...args) => warnings.push(args.join(' '));
  const app = makeApp(createSSRApp, { zIndex: 3000 });
  app.config.warnHandler = message => warnings.push(message);
  try {
    app.mount('#app');
    await nextTick();
    await nextTick();
    assert.deepEqual(warnings.filter(message => /hydrat|mismatch/i.test(message)), []);
    const root = [...document.body.children].find(element => element.style.zIndex);
    assert.equal(root?.style.zIndex, '3000');
  }
  finally {
    console.warn = originalWarn;
    console.error = originalError;
    app.unmount();
    document.body.innerHTML = '';
  }
});
