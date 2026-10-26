/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { it } from 'node:test';
import { runInThisContext } from 'node:vm';

const require = createRequire(import.meta.url);
const { compileScript, parse } = require('@vue/compiler-sfc');
const { build } = require('esbuild');
const { JSDOM } = require('jsdom');

async function createFixture() {
  // 同时打包真实组件和生产 Vue，避免测试宿主意外混入开发运行时。
  const result = await build({
    stdin: {
      contents: `export { createApp, h, nextTick, shallowRef } from 'vue';
        export { default as Button } from '~/components/reborn/ui/reborn-button/RebornButton.vue';`,
      resolveDir: resolve('.'), sourcefile: 'button-production-fixture.ts', loader: 'ts',
    },
    bundle: true, platform: 'node', format: 'cjs', write: false,
    define: { 'process.env.NODE_ENV': '"production"' },
    alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: '真实生产组件编译', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, ({ path }) => {
        const { descriptor, errors } = parse(readFileSync(path, 'utf8'), { filename: path });
        assert.deepEqual(errors, []);
        return { contents: compileScript(descriptor, {
          id: path, isProd: true, inlineTemplate: true,
          // 保留真实生产产物中的注释，不能通过删注释掩盖根 Fragment 回退。
          templateOptions: { compilerOptions: { comments: true } },
          fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        }).content, loader: 'ts', resolveDir: dirname(path) };
      });
    } }],
  });
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>');
  const previous = new Map();
  for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node']) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
  }
  const module = { exports: {} };
  runInThisContext(`(function(module, exports, require) { ${result.outputFiles[0].text}\n})`)(module, module.exports, require);
  const runtime = module.exports;
  let app;
  return {
    ...runtime,
    mount(attrs) {
      app = runtime.createApp({ render: () => runtime.h(runtime.Button, attrs.value) });
      app.mount(document.querySelector('#app'));
      return document.querySelector('button');
    },
    close() {
      app?.unmount();
      dom.window.close();
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
    },
  };
}

it('生产 RebornButton 将原生 click 监听器透传，单次点击只执行一次', async () => {
  const fixture = await createFixture();
  try {
    let clicks = 0;
    const button = fixture.mount(fixture.shallowRef({ label: '开始定时流程', onClick: () => clicks++ }));
    button.click();
    assert.equal(clicks, 1);
  } finally {
    fixture.close();
  }
});

it('生产 RebornButton 透传 id/title/aria/style，动态属性与监听器更新一次后立即生效', async () => {
  const fixture = await createFixture();
  try {
    let oldClicks = 0;
    let newClicks = 0;
    const attrs = fixture.shallowRef({
      label: '保存', id: 'before', title: '首次标题', 'aria-label': '首次说明',
      'data-state': 'before', style: { opacity: '0.5' }, onClick: () => oldClicks++,
    });
    const button = fixture.mount(attrs);
    assert.equal(button.id, 'before');
    assert.equal(button.title, '首次标题');
    assert.equal(button.getAttribute('aria-label'), '首次说明');
    assert.equal(button.dataset.state, 'before');
    assert.equal(button.style.opacity, '0.5');
    attrs.value = {
      ...attrs.value, id: 'after', title: '更新标题', 'aria-label': '更新说明',
      'data-state': 'after', style: { opacity: '0.8' }, onClick: () => newClicks++,
    };
    await fixture.nextTick();
    assert.equal(document.querySelector('button'), button);
    assert.equal(button.id, 'after');
    assert.equal(button.title, '更新标题');
    assert.equal(button.getAttribute('aria-label'), '更新说明');
    assert.equal(button.dataset.state, 'after');
    assert.equal(button.style.opacity, '0.8');
    button.click();
    assert.equal(oldClicks, 0);
    assert.equal(newClicks, 1);
  } finally {
    fixture.close();
  }
});
