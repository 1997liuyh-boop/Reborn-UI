/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { Page } from 'playwright-core';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { after, before, it } from 'node:test';
import { compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

const executablePath = chromium.executablePath();
const browserAvailable = existsSync(executablePath);
let browser: Awaited<ReturnType<typeof chromium.launch>>;
let server: ReturnType<typeof createServer>;
let url = '';

/** 受控范围滑块、拒收更新的单值滑块、带 thumb 插槽的单值滑块 */
before(async () => {
  if (!browserAvailable) return;
  const result = await build({
    stdin: {
      contents: `
        import Slider from '~/components/reborn/ui/reborn-slider/RebornSlider.vue';
        import {createApp,h,nextTick,reactive} from 'vue';
        const state=reactive({nodes:[20,22],completes:[],locked:40,lockedChanges:[],custom:10});
        const app=createApp({render:()=>h('main',{style:'width:600px;padding:40px'},[
          h('section',{id:'range'},[h(Slider,{range:true,values:state.nodes,'onUpdate:values':v=>state.nodes=v,
            onChangeComplete:v=>state.completes.push(v)})]),
          h('section',{id:'locked'},[h(Slider,{modelValue:state.locked,'onUpdate:modelValue':()=>{},onChange:v=>state.lockedChanges.push(v)})]),
          h('section',{id:'custom'},[h(Slider,{modelValue:state.custom,'onUpdate:modelValue':v=>state.custom=v},
            {thumb:({value,index,active,disabled})=>h('span',{class:'fixture-thumb','data-meta':[value,index,active,disabled].join('|')},String(value))})]),
        ])});
        app.component('Icon',props=>h('svg',{'data-icon':props.name}));
        app.mount('#app');
        window.sliderFixture={state,flush:nextTick};
      `,
      resolveDir: resolve('.'), loader: 'ts', sourcefile: 'slider-interaction-fixture.ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false, alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'slider-interaction', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        const contents = compileScript(descriptor, {
          id: path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        }).content;
        return { contents, loader: 'ts' };
      });
    } }],
  });
  const compiler = await compile(`@import 'tailwindcss';@import './app/assets/theme/typography.css';@import './app/assets/theme/base.css';`, { base: resolve('.'), onDependency() {} });
  const scanner = new Scanner({ sources: [{ base: resolve('app/components/reborn/ui/reborn-slider'), pattern: '**/*', negated: false }] });
  const css = compiler.build(scanner.scan());
  const script = result.outputFiles[0]!.text;
  server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : request.url === '/style.css' ? 'text/css' : 'text/html');
    response.end(request.url === '/app.js' ? script : request.url === '/style.css' ? css : '<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body><div id="app"></div><script type="module" src="/app.js"></script></body></html>');
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

async function withSliders(run: (page: Page) => Promise<void>) {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(url);
    await page.locator('#range [tabindex="0"]').first().waitFor();
    await run(page);
    assert.deepEqual(errors, [], '组件不抛出运行时异常');
  } finally { await page.close(); }
}

function fixtureState(page: Page): Promise<{ nodes: number[]; completes: number[][]; locked: number; lockedChanges: number[]; custom: number }> {
  return page.evaluate(() => JSON.parse(JSON.stringify((window as any).sliderFixture.state)));
}

it('范围模式用方向键推过相邻节点后，焦点跟到新下标，继续按键移动的仍是同一个滑块', { skip: !browserAvailable }, async () => {
  await withSliders(async (page) => {
    const thumbs = page.locator('#range [tabindex="0"]');
    await thumbs.nth(0).focus();
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
    // 20 → 23 越过 22，换位后为 [22, 23]
    assert.deepEqual((await fixtureState(page)).nodes, [22, 23]);
    const focusedIndex = await page.evaluate(() => {
      const list = [...document.querySelectorAll('#range [tabindex="0"]')];
      return list.indexOf(document.activeElement as Element);
    });
    assert.equal(focusedIndex, 1, '焦点跟到被移动滑块的新下标');
    await page.keyboard.press('ArrowRight');
    assert.deepEqual((await fixtureState(page)).nodes, [22, 24], '继续移动的是同一个滑块，而不是被越过的邻居');
  });
});

it('松手时先冲刷合帧移动，changeComplete 的载荷是最终值', { skip: !browserAvailable }, async () => {
  await withSliders(async (page) => {
    const track = (await page.locator('#range [class*="rounded-full"][class*="bg-gray-4"]').first().boundingBox())!;
    const thumb = (await page.locator('#range [tabindex="0"]').nth(1).boundingBox())!;
    await page.mouse.move(thumb.x + thumb.width / 2, thumb.y + thumb.height / 2);
    await page.mouse.down();
    // 同一帧内移动后立刻松手：最后一次移动还在合帧队列里，由 pointerup 冲刷
    await page.evaluate(({ x, y }) => {
      const inner = document.querySelector('#range [tabindex="0"]')!.parentElement!;
      inner.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: x, clientY: y, pointerId: 1 }));
      inner.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x, clientY: y, pointerId: 1 }));
    }, { x: track.x + track.width * 0.8, y: track.y + track.height / 2 });
    await page.mouse.up();
    const state = await fixtureState(page);
    assert.ok(state.nodes[1]! >= 75 && state.nodes[1]! <= 85, `拖到 80% 附近：${JSON.stringify(state.nodes)}`);
    assert.deepEqual(state.completes.at(-1), state.nodes, 'changeComplete 与最终绑定值一致，不是提交前的旧值');
  });
});

it('受控绑定被父级拒收时，显示停在父级的值，不与绑定值分叉', { skip: !browserAvailable }, async () => {
  await withSliders(async (page) => {
    const thumb = page.locator('#locked [tabindex="0"]');
    const before = await thumb.evaluate(element => (element as HTMLElement).style.left);
    await thumb.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    const state = await fixtureState(page);
    assert.deepEqual(state.lockedChanges, [41, 41], '每次都基于父级的 40 计算，change 照常发出');
    assert.equal(await thumb.evaluate(element => (element as HTMLElement).style.left), before, '滑块位置不动');
  });
});

it('thumb 插槽只替换中心圆，外层滑块仍可聚焦并响应方向键', { skip: !browserAvailable }, async () => {
  await withSliders(async (page) => {
    const custom = page.locator('#custom .fixture-thumb');
    assert.equal(await custom.getAttribute('data-meta'), '10|0|true|false');
    const host = page.locator('#custom [tabindex="0"]');
    assert.equal(await host.locator('.fixture-thumb').count(), 1, '插槽内容渲染在可聚焦的滑块节点内');
    await host.focus();
    await page.keyboard.press('ArrowRight');
    assert.equal((await fixtureState(page)).custom, 11);
    assert.equal(await custom.getAttribute('data-meta'), '11|0|true|false');
  });
});
