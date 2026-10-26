/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { Page } from 'playwright-core';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { after, before, it } from 'node:test';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

const executablePath = chromium.executablePath();
const browserAvailable = existsSync(executablePath);
let browser: Awaited<ReturnType<typeof chromium.launch>>;
let server: ReturnType<typeof createServer>;
let url = '';

/** 受控、非受控、带拦截及动态属性四个开关，记录 update:modelValue 与 change 的次数和载荷 */
before(async () => {
  if (!browserAvailable) return;
  const result = await build({
    stdin: {
      contents: `
        import Switch from '~/components/reborn/ui/reborn-switch/RebornSwitch.vue';
        import {createApp,h,nextTick,reactive} from 'vue';
        const state=reactive({controlled:false,updates:[],changes:[],allow:true,defaultValue:undefined,extraAttrs:{},focuses:0});
        const app=createApp({render:()=>h('main',{},[
          h(Switch,{id:'controlled',modelValue:state.controlled,defaultValue:state.defaultValue,
            'onUpdate:modelValue':v=>{state.updates.push(v);state.controlled=v;},onChange:v=>state.changes.push(v),
            style:'margin-left: 5px','data-testid':'controlled-root','aria-label':'受控开关'}),
          h(Switch,{id:'uncontrolled',defaultValue:true}),
          h(Switch,{id:'guarded',beforeChange:()=>state.allow}),
          h('section',{id:'dynamic-switch'},[h(Switch,{...state.extraAttrs})]),
        ])});
        app.component('Icon',props=>h('svg',{'data-icon':props.name}));
        app.mount('#app');
        window.switchFixture={state,flush:nextTick};
      `,
      resolveDir: resolve('.'), loader: 'ts', sourcefile: 'switch-interaction-fixture.ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false, alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'switch-interaction', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        let contents = compileScript(descriptor, {
          id: path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        }).content;
        if (contents.includes('useFormInject(') && !/import[^;]+\buseFormInject\b/.test(contents))
          contents = `import {useFormInject} from '~/composables/useFieldGroup';\n${contents}`;
        return { contents, loader: 'ts' };
      });
    } }],
  });
  const script = result.outputFiles[0]!.text;
  server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : 'text/html');
    response.end(request.url === '/app.js' ? script : '<!doctype html><html><head></head><body><div id="app"></div><script type="module" src="/app.js"></script></body></html>');
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

async function withSwitches(run: (page: Page) => Promise<void>) {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(url);
    await page.locator('#controlled').waitFor({ state: 'attached' });
    await run(page);
    assert.deepEqual(errors, [], '组件不抛出运行时异常');
  } finally { await page.close(); }
}

function fixtureState(page: Page): Promise<{ controlled: any; updates: any[]; changes: any[] }> {
  return page.evaluate(() => JSON.parse(JSON.stringify((window as any).switchFixture.state)));
}

async function configure(page: Page, value: Record<string, unknown>) {
  await page.evaluate(async (value) => {
    Object.assign((window as any).switchFixture.state, value);
    await (window as any).switchFixture.flush();
  }, value);
}

/** 原生 checkbox 的勾选态，必须与组件的开关状态一致 */
function domChecked(page: Page, id: string) {
  return page.locator(`#${id}`).evaluate(element => (element as HTMLInputElement).checked);
}

it('键盘聚焦后按空格切换，绑定值、change 与原生勾选态同步', { skip: !browserAvailable }, async () => {
  await withSwitches(async (page) => {
    await page.locator('#controlled').focus();
    await page.keyboard.press('Space');
    let state = await fixtureState(page);
    assert.deepEqual(state.updates, [true]);
    assert.deepEqual(state.changes, [true]);
    assert.equal(await domChecked(page, 'controlled'), true);

    await page.keyboard.press('Space');
    state = await fixtureState(page);
    assert.deepEqual(state.updates, [true, false]);
    assert.deepEqual(state.changes, [true, false]);
    assert.equal(await domChecked(page, 'controlled'), false);
  });
});

it('点击轨道只切换一次，原生勾选态跟随', { skip: !browserAvailable }, async () => {
  await withSwitches(async (page) => {
    await page.locator('[data-testid="controlled-root"]').click();
    let state = await fixtureState(page);
    assert.deepEqual(state.updates, [true], 'label 转发的点击与 input 自身不重复处理');
    assert.equal(await domChecked(page, 'controlled'), true);
    await page.locator('[data-testid="controlled-root"]').click();
    state = await fixtureState(page);
    assert.deepEqual(state.updates, [true, false]);
    assert.equal(await domChecked(page, 'controlled'), false);

    // 非受控：初值取 defaultValue，点击后自行切换
    assert.equal(await domChecked(page, 'uncontrolled'), true);
    await page.locator('#uncontrolled').evaluate(element => (element.closest('label') as HTMLElement).click());
    assert.equal(await domChecked(page, 'uncontrolled'), false);
  });
});

it('beforeChange 拦截后不改值，原生勾选态不被浏览器翻转', { skip: !browserAvailable }, async () => {
  await withSwitches(async (page) => {
    await configure(page, { allow: false });
    await page.locator('#guarded').focus();
    await page.keyboard.press('Space');
    await page.evaluate(() => new Promise(done => setTimeout(done, 20)));
    assert.equal(await domChecked(page, 'guarded'), false);
    await configure(page, { allow: true });
    await page.keyboard.press('Space');
    await page.waitForFunction(() => (document.querySelector('#guarded') as HTMLInputElement).checked);
  });
});

it('受控绑定被置回 undefined 时回到 defaultValue / inactiveValue', { skip: !browserAvailable }, async () => {
  await withSwitches(async (page) => {
    await configure(page, { controlled: true });
    assert.equal(await domChecked(page, 'controlled'), true);
    await configure(page, { controlled: undefined });
    assert.equal(await domChecked(page, 'controlled'), false, '未设 defaultValue 时回到 inactiveValue');
    await configure(page, { defaultValue: true, controlled: false });
    await configure(page, { controlled: undefined });
    assert.equal(await domChecked(page, 'controlled'), true, '设了 defaultValue 时回到它');
  });
});

it('style 与 data-* 落到根节点，其余属性留在原生 checkbox', { skip: !browserAvailable }, async () => {
  await withSwitches(async (page) => {
    const root = page.locator('[data-testid="controlled-root"]');
    assert.equal(await root.evaluate(element => element.tagName), 'LABEL');
    assert.match((await root.getAttribute('style')) ?? '', /margin-left:\s*5px/);
    const input = page.locator('#controlled');
    assert.equal(await input.evaluate(element => element.tagName), 'INPUT');
    assert.equal(await input.getAttribute('aria-label'), '受控开关');
    assert.equal(await input.getAttribute('style'), null);
  });
});


it('初始空 attrs 后新增、更新和删除属性时，两路透传都读取最新值', { skip: !browserAvailable }, async () => {
  await withSwitches(async (page) => {
    const root = page.locator('#dynamic-switch label');
    const input = page.locator('#dynamic-switch input');
    await configure(page, { extraAttrs: { style: 'margin-left:17px', 'data-dynamic': '新增', 'data-disabled': '外部值', id: 'dynamic-input', name: 'first', 'aria-label': '新增名称' } });
    assert.equal(await root.getAttribute('data-dynamic'), '新增');
    assert.match((await root.getAttribute('style')) ?? '', /margin-left:\s*17px/);
    assert.equal(await root.getAttribute('data-disabled'), 'false', '内部禁用状态优先');
    assert.equal(await input.getAttribute('id'), 'dynamic-input');
    assert.equal(await input.getAttribute('name'), 'first');
    assert.equal(await input.getAttribute('aria-label'), '新增名称');
    assert.equal(await root.getAttribute('name'), null);
    assert.equal(await input.getAttribute('data-dynamic'), null);
    await page.evaluate(async () => { const f = (window as any).switchFixture; f.state.extraAttrs.onFocus = () => f.state.focuses++; await f.flush(); });
    await input.focus();
    assert.equal(await page.evaluate(() => (window as any).switchFixture.state.focuses), 1);
    await input.blur();
    await page.evaluate(async () => { const f = (window as any).switchFixture; f.state.extraAttrs.onFocus = () => f.state.focuses += 2; await f.flush(); });
    await input.focus();
    assert.equal(await page.evaluate(() => (window as any).switchFixture.state.focuses), 3, '监听更新后使用新回调');
    await input.blur();
    await configure(page, { extraAttrs: { style: 'margin-left:23px', 'data-dynamic': '更新', id: 'updated-input', name: 'second', 'aria-label': '更新名称', disabled: true } });
    assert.equal(await root.getAttribute('data-dynamic'), '更新');
    assert.match((await root.getAttribute('style')) ?? '', /margin-left:\s*23px/);
    assert.equal(await root.getAttribute('data-disabled'), 'true');
    assert.equal(await input.getAttribute('id'), 'updated-input');
    assert.equal(await input.getAttribute('name'), 'second');
    assert.equal(await input.getAttribute('aria-label'), '更新名称');
    await configure(page, { extraAttrs: {} });
    assert.equal(await root.getAttribute('data-dynamic'), null);
    assert.doesNotMatch((await root.getAttribute('style')) ?? '', /margin-left/);
    assert.equal(await input.getAttribute('id'), null);
    assert.equal(await input.getAttribute('name'), null);
    assert.equal(await input.getAttribute('aria-label'), null);
    await input.focus();
    assert.equal(await page.evaluate(() => (window as any).switchFixture.state.focuses), 3, '已删除的监听不再执行');
  });
});
