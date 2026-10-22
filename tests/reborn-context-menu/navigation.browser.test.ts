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

/** 使用真实路由、缓存页面和传送浮层，避免普通组件卸载掩盖残留问题。 */
async function buildFixture() {
  const result = await build({
    stdin: {
      contents: `
        import ContextMenu from '~/components/reborn/ui/reborn-context-menu/RebornContextMenu.vue';
        import {createApp,h,KeepAlive,nextTick,reactive} from 'vue';
        import {createMemoryHistory,createRouter,RouterView} from 'vue-router';
        const state=reactive({trigger:'contextmenu',open:false,showCached:true,mounted:true});
        const updates=[];
        const items=[{label:'添加事项'},{label:'更多操作',children:[{label:'嵌套操作'}]}];
        const Cached={name:'CachedMenuPage',render:()=>h(ContextMenu,{id:'cached',items},()=>h('button',{id:'cached-trigger'},'缓存页面触发器'))};
        const Empty={name:'EmptyPage',render:()=>h('p','其他页面')};
        const router=createRouter({history:createMemoryHistory(),routes:[
          {path:'/one',component:Cached},{path:'/two',component:Empty},{path:'/blocked',component:Empty}
        ]});
        router.beforeEach(to=>to.path==='/blocked'?false:undefined);
        window.menuFixture={state,updates,flush:nextTick,navigate:async path=>{await router.push(path);await nextTick()}};
        const app=createApp({render:()=>state.mounted?h('main',{class:'flex flex-col gap-12 p-12'},[
          h(ContextMenu,{id:'persistent',items,trigger:state.trigger,open:state.open,openDelay:300,
            'onUpdate:open':value=>{state.open=value;updates.push(value)}
          },()=>h('button',{id:'persistent-trigger'},'布局常驻触发器')),
          h(RouterView,null,{default:({Component})=>h(KeepAlive,null,{default:()=>state.showCached?h(Component):h(Empty)})})
        ]):null});
        app.component('Icon',{render:()=>h('i')});app.use(router);
        await router.push('/one');await router.isReady();app.mount('#app');
      `,
      resolveDir: resolve('.'), sourcefile: 'context-menu-navigation-fixture.ts', loader: 'ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'context-menu-navigation', setup(builder) {
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
    await page.locator('#cached-trigger').waitFor();
    await run(page);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
  }
}

async function navigate(page: Page, path: string) {
  await page.evaluate(path => (window as any).menuFixture.navigate(path), path);
}

async function configure(page: Page, value: Record<string, unknown>) {
  await page.evaluate(async (value) => {
    Object.assign((window as any).menuFixture.state, value);
    await (window as any).menuFixture.flush();
  }, value);
}

async function scrollBlocked(page: Page) {
  return page.evaluate(() => !window.dispatchEvent(new WheelEvent('wheel', { cancelable: true })));
}

async function menusClosed(page: Page) {
  await page.waitForFunction(() => document.querySelectorAll('[role="menu"]').length === 0, undefined, { timeout: 1500 });
  assert.equal(await scrollBlocked(page), false, '关闭后释放页面滚动拦截');
}

it('常驻菜单在成功导航后关闭嵌套浮层，重复和取消导航不误关', { skip: !existsSync(executablePath) }, async () => {
  await withMenu(async (page) => {
    await page.locator('#persistent-trigger').click({ button: 'right', position: { x: 20, y: 10 } });
    await page.getByRole('menu').waitFor();
    assert.equal(await scrollBlocked(page), true);
    await navigate(page, '/one');
    await navigate(page, '/blocked');
    assert.equal(await page.getByRole('menu').count(), 1, '地址没有改变时保持展开');
    await page.getByRole('button', { name: '更多操作' }).hover();
    await page.getByRole('button', { name: '嵌套操作', exact: true }).waitFor();
    await navigate(page, '/two?source=menu');
    await menusClosed(page);
    assert.equal(await page.evaluate(() => (window as any).menuFixture.state.open), false);
    assert.deepEqual(await page.evaluate(() => (window as any).menuFixture.updates), [true, false]);
  });
});

it('导航取消换位重开和悬停延迟，旧页面任务不会重新弹出菜单', { skip: !existsSync(executablePath) }, async () => {
  await withMenu(async (page) => {
    await page.locator('#persistent-trigger').click({ button: 'right', position: { x: 20, y: 10 } });
    await page.getByRole('menu').waitFor();
    await page.locator('#persistent-trigger').dispatchEvent('contextmenu', { clientX: 500, clientY: 300 });
    await navigate(page, '/two');
    await page.waitForTimeout(400);
    await menusClosed(page);
    await configure(page, { trigger: 'hover' });
    await page.locator('#persistent').dispatchEvent('mouseenter');
    await navigate(page, '/one');
    await page.waitForTimeout(400);
    assert.equal(await page.getByRole('menu').count(), 0, '未打开的悬停计时器也必须取消');
    assert.equal(await scrollBlocked(page), false);
  });
});

it('缓存组件停用立即关闭传送菜单，再激活和路由返回均不恢复旧浮层', { skip: !existsSync(executablePath) }, async () => {
  await withMenu(async (page) => {
    await page.locator('#cached-trigger').click({ button: 'right' });
    await page.getByRole('menu').waitFor();
    await configure(page, { showCached: false });
    await menusClosed(page);
    await configure(page, { showCached: true });
    assert.equal(await page.getByRole('menu').count(), 0);
    await page.locator('#cached-trigger').click({ button: 'right' });
    await page.getByRole('menu').waitFor();
    await navigate(page, '/two');
    await menusClosed(page);
    await navigate(page, '/one');
    assert.equal(await page.getByRole('menu').count(), 0);
    await page.locator('#cached-trigger').click({ button: 'right' });
    await page.getByRole('menu').waitFor();
    await configure(page, { mounted: false });
    await menusClosed(page);
  });
});
