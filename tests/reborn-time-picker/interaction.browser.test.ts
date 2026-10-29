/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { Locator, Page } from 'playwright-core';
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

// 编译真实时间面板、选择器与滚动条，在浏览器中验证点击及滚动的值和几何关系。
before(async () => {
  const result = await build({
    stdin: {
      contents: `
        import Panel from '~/components/reborn/ui/reborn-time-picker/RebornTimePanel.vue';
        import Picker from '~/components/reborn/ui/reborn-time-picker/RebornTimePicker.vue';
        import {createApp,h,nextTick,reactive,ref} from 'vue';
        const props=reactive({format:'HH:mm:ss'}),value=ref('09:30:15'),kind=ref('panel'),changes=[];
        window.timeFixture={
          configure:next=>{const {modelValue,kind:nextKind,...rest}=next;if(modelValue!==undefined)value.value=modelValue;if(nextKind)kind.value=nextKind;Object.assign(props,rest)},
          read:()=>({value:value.value,changes:[...changes]}),flush:nextTick
        };
        const app=createApp({render:()=>h(kind.value==='picker'?Picker:Panel,{...props,modelValue:value.value,
          'onUpdate:modelValue':next=>value.value=next,onChange:next=>changes.push(next)})});
        app.component('Icon',{render:()=>h('svg')});
        app.mount('#app');
      `,
      resolveDir: resolve('.'), sourcefile: 'time-interaction-fixture.ts', loader: 'ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false, alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: '时间交互验证', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        return { contents: compileScript(descriptor, {
          id: path, inlineTemplate: true,
          fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        }).content, loader: 'ts', resolveDir: dirname(path) };
      });
    } }],
  });
  const compiler = await compile("@import 'tailwindcss';@import './app/assets/theme/typography.css';@import './app/assets/theme/base.css';@import './app/components/reborn/ui/scrollbar/scrollbar.css';", { base: resolve('.'), onDependency() {} });
  const scanner = new Scanner({ sources: ['reborn-time-picker', 'scrollbar', 'reborn-button', 'reborn-select-trigger', 'reborn-field-trigger']
    .map(name => ({ base: resolve('app/components/reborn/ui', name), pattern: '**/*', negated: false })) });
  const css = compiler.build(scanner.scan());
  const script = result.outputFiles[0]!.text;
  server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : request.url === '/style.css' ? 'text/css' : 'text/html');
    response.end(request.url === '/app.js' ? script : request.url === '/style.css' ? css : '<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body style="padding:24px"><div id="app" style="width:360px"></div><script type="module" src="/app.js"></script></body></html>');
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

async function withPanel(run: (page: Page) => Promise<void>) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(url);
    await page.getByRole('listbox').first().waitFor();
    await run(page);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
}

async function configure(page: Page, props: Record<string, unknown>) {
  await page.evaluate(async value => {
    (window as any).timeFixture.configure(value);
    await (window as any).timeFixture.flush();
  }, props);
}

async function state(page: Page) {
  return page.evaluate(() => (window as any).timeFixture.read());
}

async function position(column: Locator) {
  return column.evaluate(el => {
    const wrap = el.querySelector('.reborn-scrollbar__wrap')!;
    const selected = el.querySelector('[aria-selected="true"]')!;
    return { top: selected.getBoundingClientRect().top - wrap.getBoundingClientRect().top,
      center: (selected.getBoundingClientRect().top + selected.getBoundingClientRect().bottom) / 2 - (wrap.getBoundingClientRect().top + wrap.getBoundingClientRect().bottom) / 2 };
  });
}

it('默认滚动居中，仅渲染一组选项，首尾滚动、方向键和箭头均不循环', async () => {
  await withPanel(async page => {
    await configure(page, { modelValue: '00:00:00', arrowControl: true });
    const hour = page.getByRole('listbox', { name: '时', exact: true });
    assert.equal(await hour.getByRole('option').count(), 24);
    assert.equal(await page.getByRole('listbox', { name: '分', exact: true }).getByRole('option').count(), 60);
    assert.equal(await hour.locator('[aria-selected="true"]').count(), 1);
    assert.ok(Math.abs((await position(hour)).center) <= 1);
    assert.equal(await hour.getByRole('button', { name: '上一时' }).isDisabled(), true);
    await hour.press('ArrowUp');
    assert.equal((await state(page)).value, '00:00:00');
    await configure(page, { modelValue: '23:59:59' });
    assert.equal(await hour.getByRole('button', { name: '下一时' }).isDisabled(), true);
    await hour.press('ArrowDown');
    await hour.locator('.reborn-scrollbar__wrap').hover();
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(200);
    assert.equal((await state(page)).value, '23:59:59');
    assert.ok(Math.abs((await position(hour)).center) <= 1);
    await hour.locator('.reborn-scrollbar__wrap').evaluate(el => el.scrollTop = 10 * 29);
    await page.waitForTimeout(200);
    assert.equal((await state(page)).value, '10:59:59');
  });
});

it('点击模式滚动只浏览，点击时分秒后写回且置顶，末项也能置顶', async () => {
  await withPanel(async page => {
    await configure(page, { interaction: 'click', modelValue: '00:00:00' });
    const hour = page.getByRole('listbox', { name: '时', exact: true });
    await hour.locator('.reborn-scrollbar__wrap').evaluate(el => el.scrollTop = 10 * 29);
    await page.waitForTimeout(200);
    assert.deepEqual(await state(page), { value: '00:00:00', changes: [] });
    await hour.locator('[data-value="12"]').click();
    assert.equal((await state(page)).value, '12:00:00');
    for (const name of ['时', '分', '秒']) {
      const column = page.getByRole('listbox', { name, exact: true });
      await column.getByRole('option').last().click();
      assert.ok(Math.abs((await position(column)).top) <= 1);
    }
    assert.equal((await state(page)).value, '23:59:59');
    await hour.getByRole('option').first().click();
    assert.equal((await state(page)).value, '00:59:59');
    assert.ok(Math.abs((await position(hour)).top) <= 1);
  });
});

it('点击模式在明暗主题下按七种颜色高亮，未选项 hover 为 gray-2', async () => {
  await withPanel(async page => {
    const palettes = { primary: 'brand', secondary: 'secondary', success: 'green', info: 'blue', warning: 'orange', error: 'red', neutral: 'gray' };
    for (const dark of [false, true]) {
      await page.evaluate(value => document.documentElement.classList.toggle('dark', value), dark);
      for (const [color, palette] of Object.entries(palettes)) {
        await configure(page, { interaction: 'click', color });
        const column = page.getByRole('listbox', { name: '时', exact: true });
        const active = column.locator('[aria-selected="true"]');
        await active.hover();
        await page.waitForTimeout(200);
        const background = await active.evaluate((el, palette) => {
          const probe = document.createElement('div');
          probe.style.backgroundColor = `var(--color-${palette}-1)`;
          el.append(probe);
          const result = [getComputedStyle(el).backgroundColor, getComputedStyle(probe).backgroundColor];
          probe.remove();
          return result;
        }, palette);
        assert.equal(background[0], background[1], `${color}，dark=${dark}`);
        const idle = column.locator('[data-value="10"]');
        await idle.hover();
        await page.waitForTimeout(200);
        const hoverBackground = await idle.evaluate(el => {
          const probe = document.createElement('div');
          probe.style.backgroundColor = 'var(--color-gray-2)';
          el.append(probe);
          const result = [getComputedStyle(el).backgroundColor, getComputedStyle(probe).backgroundColor];
          probe.remove();
          return result;
        });
        assert.equal(hoverBackground[0], hoverBackground[1]);
      }
    }
  });
});

it('切换模式取消待提交滚动，外部值、范围和毫秒选择按新模式定位', async () => {
  await withPanel(async page => {
    const hour = page.getByRole('listbox', { name: '时', exact: true });
    await hour.locator('.reborn-scrollbar__wrap').evaluate(el => el.scrollTop = 12 * 29);
    await configure(page, { interaction: 'click' });
    await page.waitForTimeout(200);
    assert.equal((await state(page)).value, '09:30:15');
    assert.ok(Math.abs((await position(hour)).top) <= 1);
    await configure(page, { isRange: true, format: 'HH:mm:ss.SSS', modelValue: ['09:30:15.000', '18:30:15.000'] });
    const millisecond = page.getByRole('listbox', { name: '结束毫秒', exact: true });
    assert.equal(await millisecond.getByRole('option').count(), 1000);
    await millisecond.getByRole('option').last().click();
    assert.deepEqual((await state(page)).value, ['09:30:15.000', '18:30:15.999']);
    assert.ok(Math.abs((await position(millisecond)).top) <= 1);
  });
});

it('选择器透传点击模式，禁用后不接受点选', async () => {
  await withPanel(async page => {
    await configure(page, { kind: 'picker', interaction: 'click' });
    await page.getByRole('combobox').click();
    const hour = page.getByRole('listbox', { name: '时', exact: true });
    await hour.waitFor();
    await hour.locator('[data-value="10"]').click();
    assert.equal((await state(page)).value, '10:30:15');
    assert.ok(Math.abs((await position(hour)).top) <= 1);
    await configure(page, { kind: 'panel', disabled: true });
    await page.getByRole('listbox', { name: '时', exact: true }).locator('[data-value="11"]').dispatchEvent('click');
    assert.equal((await state(page)).value, '10:30:15');
  });
});
