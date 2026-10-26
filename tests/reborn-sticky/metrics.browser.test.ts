/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { Page } from 'playwright-core';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { after, before, it } from 'node:test';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

const executablePath = chromium.executablePath();
const available = existsSync(executablePath);
let browser: Awaited<ReturnType<typeof chromium.launch>>;
let server: ReturnType<typeof createServer>;
let url = '';

/**
 * 一个吸顶组件，内容由登记了布局动画状态的子组件渲染；Sticky 自身的重渲染次数记在 state.renders。
 * 另放一个与 Sticky 无关的内部滚动容器，用来确认它的滚动不会让 Sticky 重渲染
 */
before(async () => {
  if (!available) return;
  const result = await build({
    stdin: { contents: `
      import {createApp,h,reactive,nextTick,shallowRef,inject,onBeforeUnmount} from 'vue';
      import {LAYOUT_ANIMATION_KEY} from '~/composables/useLayoutAnimation';
      import Sticky from '~/components/reborn/ui/reborn-sticky/RebornSticky.vue';
      const state=reactive({height:40,renders:0});
      const sticky=shallowRef();
      const animation=shallowRef(false);
      const StickyChild={setup(){const ctx=inject(LAYOUT_ANIMATION_KEY);const unregister=ctx.register(animation);onBeforeUnmount(unregister);return()=>h('div',{id:'sticky-content',style:'height:'+state.height+'px'},'吸附内容');}};
      createApp({render:()=>h('main',[
        h('div',{id:'inner',style:'height:100px;overflow:auto'},[h('div',{style:'height:1000px'},'内部长列表')]),
        // onVnodeUpdated 在 Sticky 每次重渲染（含自身状态触发的更新）后调用
        h(Sticky,{ref:sticky,id:'sticky',offsetTop:10,onVnodeUpdated:()=>state.renders++},()=>h(StickyChild)),
        h('div',{style:'height:2000px'}),
      ])}).mount('#app');
      window.fixture={state,flush:nextTick,sticky,animation};
    `, resolveDir: resolve('.'), loader: 'ts' },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'sticky-sfc', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        return { contents: compileScript(descriptor, { id: path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') } }).content, loader: 'ts', resolveDir: dirname(path) };
      });
    } }],
  });
  const script = result.outputFiles[0]!.text;
  server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : 'text/html');
    response.end(request.url === '/app.js' ? script : '<!doctype html><body style="margin:0"><div id="app"></div><script type="module" src="/app.js"></script></body>');
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  url = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({ executablePath, headless: true });
});

after(async () => {
  await browser?.close();
  if (server) await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
});

async function fixture(run: (page: Page) => Promise<void>) {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(url);
    await page.waitForFunction(() => (window as any).fixture?.sticky.value?.height === 40);
    await run(page);
    assert.deepEqual(errors, []);
  }
  finally { await page.close(); }
}

it('数值没变时不替换测量快照：强制重测与无关容器滚动都不让 Sticky 重渲染', { skip: !available }, async () => fixture(async (page) => {
  const renders = await page.evaluate(async () => {
    const f = (window as any).fixture;
    await f.flush();
    const before = f.state.renders;
    // 直接重测（不经 rAF），再滚动无关的内部容器并手动派发 scroll，最后再重测一次
    await f.sticky.value.forceUpdate();
    document.querySelector('#inner')!.scrollTop = 200;
    window.dispatchEvent(new Event('scroll'));
    await f.sticky.value.forceUpdate();
    await f.flush();
    return f.state.renders - before;
  });
  assert.equal(renders, 0, '测量结果与上次相同，下游 watch、样式计算与渲染都不应触发');
}));

it('后代动画期间测到的最终高度，在动画结束时仍会提交', { skip: !available }, async () => fixture(async (page) => {
  // 动画中改高度并直接重测：快照已经是 110，但吸顶尺寸暂停提交
  await page.evaluate(async () => {
    const f = (window as any).fixture;
    f.animation.value = true;
    f.state.height = 110;
    await f.flush();
    await f.sticky.value.forceUpdate();
  });
  assert.equal(await page.evaluate(() => (window as any).fixture.sticky.value.height), 40, '动画期间不提交新尺寸');
  // 动画结束时快照没有再变化（重测得到相同数值、不替换快照），仍要靠暂停解除补一次提交
  await page.evaluate(async () => {
    const f = (window as any).fixture;
    f.animation.value = false;
    await f.flush();
  });
  await page.waitForFunction(() => (window as any).fixture.sticky.value.height === 110);
}));
