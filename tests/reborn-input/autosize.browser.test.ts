/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { Page } from 'playwright-core';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { after, before, it } from 'node:test';
import { compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

let browser: Awaited<ReturnType<typeof chromium.launch>>;
let server: ReturnType<typeof createServer>;
let url = '';

// 编译真实组件与 Tailwind，在浏览器中验证自动高度和原生拖拽的配合。
before(async () => {
  const result = await build({
    stdin: {
      contents: `
        import Input from '~/components/reborn/ui/reborn-input/RebornInput.vue';
        import {createApp,h,nextTick,reactive,ref} from 'vue';
        const props=reactive({type:'textarea',autosize:true,resize:'vertical',maxlength:120,showWordLimit:true});
        const value=ref('');
        window.inputFixture={configure:next=>Object.assign(props,next),flush:nextTick};
        const app=createApp({render:()=>h(Input,{...props,modelValue:value.value,'onUpdate:modelValue':next=>value.value=next,
          ui:{wrapper:'fixture-wrapper',input:'fixture-input',count:'fixture-count'}})});
        app.component('Icon',{render:()=>h('svg')});
        app.mount('#app');
      `,
      resolveDir: resolve('.'), sourcefile: 'input-autosize-fixture.ts', loader: 'ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false, alias: { '~': resolve('app') },
    plugins: [{ name: 'input-autosize', setup(builder) {
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
  const scanner = new Scanner({ sources: [{ base: resolve('app/components/reborn/ui/reborn-input'), pattern: '**/*', negated: false }] });
  const css = compiler.build(scanner.scan());
  const script = result.outputFiles[0]!.text;
  server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : request.url === '/style.css' ? 'text/css' : 'text/html');
    response.end(request.url === '/app.js' ? script : request.url === '/style.css' ? css : '<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body style="padding:24px"><div id="app" style="width:400px"></div><script type="module" src="/app.js"></script></body></html>');
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  url = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({ executablePath: chromium.executablePath(), headless: true });
});

after(async () => {
  await browser?.close();
  if (server) await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
});

async function withInput(run: (page: Page) => Promise<void>) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(url);
    await page.locator('textarea').waitFor();
    await run(page);
    assert.deepEqual(errors, [], '输入与拖拽过程不应抛出运行时错误');
  } finally { await page.close(); }
}

async function configure(page: Page, props: Record<string, unknown>) {
  await page.evaluate(async value => {
    (window as any).inputFixture.configure(value);
    await (window as any).inputFixture.flush();
  }, props);
}

async function geometry(page: Page) {
  return page.locator('textarea').evaluate(el => {
    const wrapper = el.closest('.fixture-wrapper')!;
    const count = document.querySelector('.fixture-count');
    return { height: wrapper.getBoundingClientRect().height, inputHeight: el.getBoundingClientRect().height,
      overflowing: el.scrollHeight > el.clientHeight,
      countGap: count ? count.getBoundingClientRect().top - wrapper.getBoundingClientRect().bottom : null };
  });
}

async function dragHeight(page: Page, height: number) {
  const rect = await page.locator('textarea').boundingBox();
  assert.ok(rect);
  await page.mouse.move(rect.x + rect.width - 3, rect.y + rect.height - 3);
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width - 3, rect.y + height - 3, { steps: 8 });
  await page.mouse.up();
}

const longText = '文\n'.repeat(45);

it('自动增高到 248px 后滚动，清空后仍能回缩', async () => {
  await withInput(async page => {
    await page.locator('textarea').fill(longText);
    const full = await geometry(page);
    assert.equal(full.height, 248);
    assert.ok(full.overflowing);
    await page.locator('textarea').fill('');
    assert.ok((await geometry(page)).height < 248);
  });
});

it('支持自定义像素上限，行数上限仍可进一步缩小范围', async () => {
  await withInput(async page => {
    await configure(page, { maxHeight: 320 });
    await page.locator('textarea').fill(longText);
    assert.equal((await geometry(page)).height, 320);
    await configure(page, { autosize: { minRows: 2, maxRows: 3 } });
    assert.ok((await geometry(page)).height < 150);
  });
});

it('原生拖拽可超过 248px，后续输入采用手动高度作为上限', async () => {
  await withInput(async page => {
    await page.locator('textarea').fill(longText);
    await dragHeight(page, 390);
    const manual = await geometry(page);
    assert.ok(manual.height > 350);
    await configure(page, { color: 'success' });
    assert.equal((await geometry(page)).height, manual.height, '切换配色不能覆盖手动高度');
    await page.locator('textarea').fill(`${longText}新增内容`);
    assert.equal((await geometry(page)).height, manual.height);
    await page.locator('textarea').fill('短文本');
    assert.ok((await geometry(page)).height < manual.height);
    await page.locator('textarea').fill(longText);
    assert.equal((await geometry(page)).height, manual.height);
    await dragHeight(page, 180);
    const smaller = await geometry(page);
    assert.ok(smaller.height < 248);
    await page.locator('textarea').fill(`${longText}缩小后继续输入`);
    assert.equal((await geometry(page)).height, smaller.height);
  });
});

it('手动高度优先于 maxRows', async () => {
  await withInput(async page => {
    await configure(page, { autosize: { minRows: 2, maxRows: 3 } });
    await page.locator('textarea').fill(longText);
    await dragHeight(page, 180);
    const manual = await geometry(page);
    await page.locator('textarea').fill(`${longText}新增内容`);
    assert.equal((await geometry(page)).height, manual.height);
  });
});

it('外置字数统计距输入框 2px，且自动上限不包含外置统计', async () => {
  await withInput(async page => {
    await configure(page, { wordLimitPosition: 'outside' });
    await page.locator('textarea').fill(longText);
    const full = await geometry(page);
    assert.equal(full.height, 248);
    assert.equal(full.countGap, 2);
  });
});

it('关闭自动高度时保持 rows 与手动缩放行为', async () => {
  await withInput(async page => {
    await configure(page, { autosize: false, rows: 3 });
    const before = await geometry(page);
    await page.locator('textarea').fill(longText);
    assert.equal((await geometry(page)).height, before.height);
    await dragHeight(page, 390);
    assert.ok((await geometry(page)).height > 350);
  });
});
