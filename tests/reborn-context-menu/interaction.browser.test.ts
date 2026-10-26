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

/**
 * 交互夹具：点击触发的菜单（检查再点触发区能收起）、初始受控展开的菜单（检查 open 初值生效）、
 * 不传送且带子菜单的菜单（检查选中子菜单叶子项后整条菜单链关闭）
 */
async function buildFixture() {
  const result = await build({
    stdin: {
      contents: `
        import ContextMenu from '~/components/reborn/ui/reborn-context-menu/RebornContextMenu.vue';
        import {createApp,h,reactive} from 'vue';
        const state=reactive({controlledOpen:true,selected:[]});
        const items=[{label:'添加事项'},{label:'更多操作',children:[{label:'禁用操作',disabled:true},{type:'separator'},{label:'嵌套操作'}]}];
        window.menuFixture={state};
        const app=createApp({render:()=>h('main',{class:'flex flex-col gap-12 p-12'},[
          h(ContextMenu,{id:'click-menu',items,trigger:'click'},()=>h('button',{id:'click-trigger'},'点击触发器')),
          h(ContextMenu,{id:'controlled-menu',items:[{label:'受控项'}],trigger:'click',open:state.controlledOpen,
            'onUpdate:open':value=>{state.controlledOpen=value}
          },()=>h('button',{id:'controlled-trigger'},'受控触发器')),
          h(ContextMenu,{id:'inline-menu',items,trigger:'click',portal:false,
            onSelect:item=>state.selected.push(item.label)
          },()=>h('button',{id:'inline-trigger'},'不传送触发器')),
        ])});
        app.component('Icon',{render:()=>h('i')});
        app.mount('#app');
      `,
      resolveDir: resolve('.'), sourcefile: 'context-menu-interaction-fixture.ts', loader: 'ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'context-menu-interaction', setup(builder) {
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
  const scanner = new Scanner({ sources: ['reborn-context-menu', 'reborn-transition'].map(name => ({ base: resolve(`app/components/reborn/ui/${name}`), pattern: '**/*', negated: false })) });
  return { script: result.outputFiles[0]!.text, css: compiler.build([...scanner.scan(), 'flex', 'flex-col', 'gap-12', 'p-12']) };
}

async function withMenu(run: (page: Page) => Promise<void>) {
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
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.locator('#click-trigger').waitFor();
    await run(page);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
  }
}

/** 等指定文字的菜单项全部从页面上消失（含收起动画） */
async function waitMenuItemGone(page: Page, label: string) {
  await page.waitForFunction(
    text => ![...document.querySelectorAll('[role="menu"] button')].some(el => el.textContent?.includes(text) && (el as HTMLElement).offsetParent !== null),
    label,
    { timeout: 1500 },
  );
}

it('初始受控展开生效，点击触发的菜单再点触发区能收起', { skip: !existsSync(executablePath) }, async () => {
  await withMenu(async (page) => {
    // open 初值为 true：修复前 open 被布尔强转后根本不会被读到，菜单不展开
    await page.getByRole('button', { name: '受控项' }).waitFor({ state: 'visible' });
    await page.locator('#controlled-trigger').click();
    await waitMenuItemGone(page, '受控项');
    assert.equal(await page.evaluate(() => (window as any).menuFixture.state.controlledOpen), false);

    await page.locator('#click-trigger').click();
    await page.getByRole('button', { name: '添加事项' }).first().waitFor({ state: 'visible' });
    // 再点触发区：按下不能被判成外部点击先关掉、紧接着的 click 又打开
    await page.locator('#click-trigger').click();
    await waitMenuItemGone(page, '添加事项');
  });
});

it('子菜单里按下不关根菜单，不传送时选中子菜单叶子项关闭整条菜单链', { skip: !existsSync(executablePath) }, async () => {
  await withMenu(async (page) => {
    await page.locator('#inline-trigger').click();
    const more = page.locator('#inline-menu').getByRole('button', { name: '更多操作' });
    await more.waitFor({ state: 'visible' });
    // 等根菜单的高度展开动画（300ms）走完再悬停：动画中面板外层 overflow 隐藏，
    // Playwright 悬停前会滚动该容器让目标可见，菜单项随之错位，指针落到别的项上
    await page.waitForTimeout(400);
    await more.hover();
    const disabled = page.locator('#inline-menu').getByRole('button', { name: '禁用操作' });
    await disabled.waitFor({ state: 'visible' });
    // 在子菜单的禁用项上按下：属于同一条菜单链，根菜单保持展开
    await disabled.dispatchEvent('pointerdown', { bubbles: true });
    await page.waitForTimeout(100);
    assert.equal(await more.isVisible(), true, '子菜单内按下不关闭根菜单');

    // 直接派发点击：不传送时子菜单 fixed 定位在根菜单（带 transform）内，指针移动途中可能触发悬浮收起，与本用例无关
    await page.locator('#inline-menu').getByRole('button', { name: '嵌套操作' }).dispatchEvent('click');
    await waitMenuItemGone(page, '嵌套操作');
    await waitMenuItemGone(page, '更多操作');
    assert.deepEqual(await page.evaluate(() => (window as any).menuFixture.state.selected), ['嵌套操作']);
  });
});
