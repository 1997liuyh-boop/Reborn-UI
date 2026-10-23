/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { Page } from 'playwright-core';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { it } from 'node:test';
import { compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

const executablePath = chromium.executablePath();
let fixture: Promise<{ script: string; css: string }>;

/** 真实定位与高度动画一起运行，逐帧检查面板朝向触发器的边始终固定。 */
async function buildFixture() {
  const result = await build({
    stdin: {
      contents: `
        import SelectTrigger from '~/components/reborn/ui/reborn-select-trigger/RebornSelectTrigger.vue';
        import {createApp,h,nextTick,reactive} from 'vue';
        const state=reactive({open:false,side:'top',align:'start',portal:true,autoAdjustOverflow:false});
        window.directionFixture={state,flush:nextTick};
        createApp({render:()=>h('main',{class:'h-[2000px]'},[
          h(SelectTrigger,{isOpen:state.open,side:state.side,align:state.align,portal:state.portal,
            autoAdjustOverflow:state.autoAdjustOverflow,closeOn:'click',
            class:'absolute left-80 top-[600px] w-60',ui:{dropdown:'fixture-dropdown'},
            onClose:()=>state.open=false
          },{trigger:()=>h('button',{id:'trigger',class:'h-10 w-full'},'选择内容'),
            content:()=>h('div',{class:'h-32 w-60'},'展开内容')})
        ])}).mount('#app');
      `,
      resolveDir: resolve('.'), sourcefile: 'select-trigger-direction-fixture.ts', loader: 'ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'select-trigger-direction', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        return { contents: compileScript(descriptor, {
          id: path, inlineTemplate: true,
          fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        }).content, loader: 'ts', resolveDir: dirname(path) };
      });
    } }],
  });
  const compiler = await compile("@import 'tailwindcss';@import './app/assets/theme/typography.css';@import './app/assets/theme/base.css';", { base: resolve('.'), onDependency() {} });
  const scanner = new Scanner({ sources: ['reborn-select-trigger', 'reborn-transition'].map(name => ({ base: resolve(`app/components/reborn/ui/${name}`), pattern: '**/*', negated: false })) });
  return { script: result.outputFiles[0]!.text, css: compiler.build([...scanner.scan(), 'h-[2000px]', 'absolute', 'left-80', 'top-[600px]', 'w-60', 'h-10', 'w-full', 'h-32']) };
}

async function withTrigger(run: (page: Page) => Promise<void>) {
  fixture ??= buildFixture();
  const { script, css } = await fixture;
  const server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : request.url === '/style.css' ? 'text/css' : 'text/html');
    response.end(request.url === '/app.js' ? script : request.url === '/style.css' ? css : '<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body><div id="app"></div><script type="module" src="/app.js"></script></body></html>');
  });
  let browser;
  try {
    await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
    const address = server.address(); assert.ok(address && typeof address !== 'string');
    browser = await chromium.launch({ executablePath, headless: true });
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.locator('#trigger').waitFor();
    await run(page);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
  }
}

async function configure(page: Page, value: Record<string, unknown>) {
  await page.evaluate(async (value) => {
    Object.assign((window as any).directionFixture.state, value);
    await (window as any).directionFixture.flush();
  }, value);
}

async function sampleAt(page: Page, time: number) {
  return page.locator('.fixture-dropdown').evaluate((element, time) => {
    for (const animation of element.getAnimations()) {
      animation.pause();
      animation.currentTime = time;
    }
    const box = element.getBoundingClientRect();
    return { top: box.top, bottom: box.bottom, height: box.height };
  }, time);
}

async function finishEnter(page: Page) {
  await page.locator('.fixture-dropdown').evaluate(element => element.getAnimations().forEach(animation => animation.finish()));
  await page.waitForFunction(() => (document.querySelector('.fixture-dropdown') as HTMLElement)?.style.height === '');
}

for (const [label, options] of [
  ['传送起点对齐', { align: 'start' }],
  ['传送居中对齐', { align: 'center' }],
  ['传送终点对齐', { align: 'end' }],
  ['行内定位', { portal: false }],
  ['下方不足自动翻转', { side: 'auto', autoAdjustOverflow: true }],
] as const) {
  it(`向上展开从底部向上增长，${label}的底边始终贴住触发器`, { skip: !existsSync(executablePath) }, async () => {
    await withTrigger(async (page) => {
      await configure(page, { ...options, open: true });
      const trigger = (await page.locator('#trigger').boundingBox())!;
      const early = await sampleAt(page, 50);
      const later = await sampleAt(page, 160);
      assert.ok(early.height > 0 && early.height < later.height);
      assert.ok(later.top < early.top, '高度增加时，上边缘应向上移动');
      for (const sample of [early, later]) {
        assert.ok(Math.abs(sample.bottom - (trigger.y - 4)) <= 1, `底边在动画中固定于触发器上方：${JSON.stringify(sample)}`);
      }
      await finishEnter(page);
      await configure(page, { open: false });
      const leaving = await sampleAt(page, 80);
      assert.ok(Math.abs(leaving.bottom - (trigger.y - 4)) <= 1, '收起时同样以底边为锚点');
      await configure(page, { open: true });
      const reopened = await sampleAt(page, 60);
      assert.ok(Math.abs(reopened.bottom - (trigger.y - 4)) <= 1, '退出中重新展开也保持锚点');
      await finishEnter(page);
      const final = (await page.locator('.fixture-dropdown').boundingBox())!;
      assert.ok(final.height >= 128);
      assert.ok(Math.abs(final.y + final.height - (trigger.y - 4)) <= 1);
    });
  });
}

it('向下展开保持顶部固定，向上展开期间滚动后仍贴住触发器', { skip: !existsSync(executablePath) }, async () => {
  await withTrigger(async (page) => {
    await configure(page, { side: 'bottom', open: true });
    const trigger = (await page.locator('#trigger').boundingBox())!;
    const downward = await sampleAt(page, 60);
    assert.ok(Math.abs(downward.top - trigger.y - trigger.height - 4) <= 1);
    await finishEnter(page);
    await configure(page, { open: false });
    await page.locator('.fixture-dropdown').evaluate(element => element.getAnimations().forEach(animation => animation.finish()));
    await page.locator('.fixture-dropdown').waitFor({ state: 'detached' });
    await configure(page, { side: 'top', open: true });
    await sampleAt(page, 60);
    await page.evaluate(() => window.scrollTo(0, 100));
    await page.waitForFunction(() => window.scrollY === 100);
    const scrolledTrigger = (await page.locator('#trigger').boundingBox())!;
    const scrolled = await sampleAt(page, 120);
    assert.ok(Math.abs(scrolled.bottom - scrolledTrigger.y + 4) <= 1, `滚动后的底边仍紧贴触发器：${JSON.stringify(scrolled)}`);
  });
});
