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
 * 页面是「侧栏 + 弹性主区」两栏，吸顶条放在主区里一个宽度可调的容器中，容器可在两种排版上下文间切换：
 * - shrink：flex 列 + align-items: flex-start（文档站 DemoBlock stack 的写法），占位容器宽度由内容撑开
 * - block：普通块级容器，占位容器宽度跟随容器
 * 吸顶条内容不写死宽度，宽度只来自文字，与文档站示例一致。
 * 侧栏宽度可调：改它只让主区伸缩，容器与占位容器自身尺寸不变、只发生平移
 */
before(async () => {
  if (!available) return;
  const result = await build({
    stdin: { contents: `
      import {createApp,h,reactive,nextTick,shallowRef} from 'vue';
      import Sticky from '~/components/reborn/ui/reborn-sticky/RebornSticky.vue';
      const state=reactive({layout:'shrink',width:600,aside:240});
      const sticky=shallowRef();
      createApp({render:()=>h('main',{style:'display:flex;padding-top:200px'},[
        h('aside',{style:{flex:'none',width:state.aside+'px'}}),
        h('section',{style:'flex:1;min-width:0'},[
          h('div',{id:'column',style:state.layout==='shrink'?{display:'flex',flexDirection:'column',alignItems:'flex-start',width:state.width+'px'}:{display:'block',width:state.width+'px'}},[
            h(Sticky,{ref:sticky,id:'sticky',offsetTop:10},()=>h('div',{id:'bar',style:'height:40px;padding:0 12px;white-space:nowrap;background:red'},'吸顶条 · offset 10')),
            h('div',{style:'height:3000px'}),
          ]),
        ]),
      ])}).mount('#app');
      window.fixture={state,flush:nextTick,sticky};
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
  const page = await browser.newPage({ viewport: { width: 1200, height: 600 } });
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

/** 占位容器、定位内容与吸顶条三者的水平位置与宽度 */
async function boxes(page: Page) {
  // evaluate 里不声明具名函数：tsx 转译会注入页面里不存在的 __name 辅助函数
  const [wrapper, content, bar] = await page.evaluate(() => {
    const bar = document.querySelector('#bar')!;
    return [document.querySelector('#sticky')!, bar.parentElement!, bar].map((element) => {
      const box = element.getBoundingClientRect();
      return { left: box.left, width: box.width };
    });
  });
  return { wrapper: wrapper!, content: content!, bar: bar! };
}

/** 等两帧：滚动 / 尺寸观察排的测量在 rAF 里执行，提交后还要一次渲染 */
function settle(page: Page) {
  return page.evaluate(() => new Promise<void>(done => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
}

async function stick(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#bar')!.parentElement!).position === 'fixed');
  await settle(page);
}

async function resizeColumn(page: Page, width: number) {
  await page.evaluate(async (value) => { const f = (window as any).fixture; f.state.width = value; await f.flush(); }, width);
  await settle(page);
  await settle(page);
}

/** 定位内容左右边缘向外取整，允许 1px 误差 */
function near(actual: number, expected: number, message: string) {
  assert.ok(Math.abs(actual - expected) <= 1, `${message}：实际 ${actual}，期望 ${expected}`);
}

it('收缩包裹的父容器里吸顶后，占位与定位内容保持吸顶前的宽度和左边缘', { skip: !available }, async () => fixture(async (page) => {
  const flow = await boxes(page);
  assert.ok(flow.wrapper.width > 0 && flow.wrapper.width < 600, '前提：占位容器宽度由内容撑开，而不是铺满父容器');
  await stick(page);
  const stuck = await boxes(page);
  near(stuck.wrapper.width, flow.wrapper.width, '占位容器不能因内容脱离文档流而塌成 0 宽');
  near(stuck.content.width, flow.content.width, '吸顶内容宽度应与吸顶前一致');
  near(stuck.content.left, flow.content.left, '吸顶内容左边缘应与原位置对齐');
  near(stuck.bar.width, flow.bar.width, '插槽内容宽度应与吸顶前一致');
}));

it('收缩包裹的父容器在吸顶期间变窄再恢复，吸顶内容随之收窄并回到原宽度', { skip: !available }, async () => fixture(async (page) => {
  const flow = await boxes(page);
  await stick(page);
  const narrow = Math.floor(flow.wrapper.width / 2);
  await resizeColumn(page, narrow);
  near((await boxes(page)).content.width, narrow, '父容器比原宽度窄时，吸顶内容不超出父容器');
  await resizeColumn(page, 600);
  near((await boxes(page)).content.width, flow.content.width, '父容器恢复后，吸顶内容回到吸顶前的宽度');
}));

it('块级父容器在吸顶期间变宽、变窄，吸顶内容始终跟随父容器宽度', { skip: !available }, async () => fixture(async (page) => {
  await page.evaluate(async () => { const f = (window as any).fixture; f.state.layout = 'block'; await f.flush(); });
  await settle(page);
  await stick(page);
  near((await boxes(page)).content.width, 600, '块级上下文吸顶后铺满父容器');
  await resizeColumn(page, 800);
  near((await boxes(page)).content.width, 800, '父容器变宽后吸顶内容同步变宽');
  await resizeColumn(page, 300);
  near((await boxes(page)).content.width, 300, '父容器变窄后吸顶内容同步变窄');
}));

it('吸顶期间侧栏折叠让占位容器只平移不变尺寸，吸顶内容仍与原位置对齐', { skip: !available }, async () => fixture(async (page) => {
  await stick(page);
  const before = await boxes(page);
  near(before.content.left, before.wrapper.left, '前提：吸顶内容与占位容器左边缘对齐');
  // 侧栏收窄：主区变宽、左移，主区里的容器与占位容器宽度都不变
  await page.evaluate(async () => { const f = (window as any).fixture; f.state.aside = 60; await f.flush(); });
  await settle(page);
  await settle(page);
  const shifted = await boxes(page);
  near(shifted.wrapper.width, before.wrapper.width, '前提：占位容器尺寸不变');
  near(shifted.wrapper.left, before.wrapper.left - 180, '前提：占位容器随主区左移');
  near(shifted.content.left, shifted.wrapper.left, '吸顶内容应跟随占位容器平移');
  near(shifted.content.width, shifted.wrapper.width, '吸顶内容宽度应与占位容器一致');
}));
