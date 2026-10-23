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

/** 运行真实气泡、路由、缓存页面和动画，复现传送浮层跨页面残留。 */
async function buildFixture() {
  const result = await build({
    stdin: {
      contents: `
        import Popover from '~/components/reborn/ui/reborn-popover/RebornPopover.vue';
        import Popconfirm from '~/components/reborn/ui/reborn-popconfirm/RebornPopconfirm.vue';
        import {createApp,h,KeepAlive,nextTick,reactive} from 'vue';
        import {createMemoryHistory,createRouter,RouterView} from 'vue-router';
        const params=new URLSearchParams(location.search);
        const Component=params.get('kind')==='popconfirm'?Popconfirm:Popover;
        const state=reactive({mode:'click',open:false,showCached:true,mounted:true,modal:false});
        const updates=[];
        const slots=scope=>({
          default:()=>h('button',{id:scope+'-trigger'},scope+'触发器'),
          content:()=>h('p',{'data-popup':scope},'气泡内容'),
          title:()=>h('span',{'data-popup':scope},'确认操作')
        });
        const Cached={name:'CachedPopoverPage',render:()=>h(Component,{id:'cached'},slots('cached'))};
        const Empty={name:'EmptyPage',render:()=>h('p','其他页面')};
        const router=createRouter({history:createMemoryHistory(),routes:[
          {path:'/one',component:Cached},{path:'/two',component:Empty},{path:'/blocked',component:Empty}
        ]});
        router.beforeEach(to=>to.path==='/blocked'?false:undefined);
        window.popoverFixture={state,updates,flush:nextTick,navigate:async path=>{await router.push(path);await nextTick()}};
        const app=createApp({render:()=>state.mounted?h('main',{class:'flex flex-col gap-12 p-12'},[
          h(Component,{id:'persistent',mode:state.mode,open:state.open,openDelay:300,closeDelay:120,
            modal:state.modal,dismissible:false,closeOnScroll:false,
            'onUpdate:open':value=>{state.open=value;updates.push(value)}
          },slots('persistent')),
          params.has('noRouter')?null:h(RouterView,null,{default:({Component:Page})=>h(KeepAlive,null,{
            default:()=>state.showCached?h(Page):h(Empty)
          })})
        ]):null});
        if(!params.has('noRouter')){app.use(router);await router.push('/one');await router.isReady()}
        app.mount('#app');
      `,
      resolveDir: resolve('.'), sourcefile: 'popover-navigation-fixture.ts', loader: 'ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'popover-navigation', setup(builder) {
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
  const scanner = new Scanner({ sources: ['reborn-popover', 'reborn-popconfirm', 'reborn-button', 'reborn-transition'].map(name => ({ base: resolve(`app/components/reborn/ui/${name}`), pattern: '**/*', negated: false })) });
  return { script: result.outputFiles[0]!.text, css: compiler.build([...scanner.scan(), 'flex', 'flex-col', 'gap-12', 'p-12']) };
}

async function withPopover(kind: string, run: (page: Page) => Promise<void>, noRouter = false) {
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
    await page.goto(`http://127.0.0.1:${address.port}/?kind=${kind}${noRouter ? '&noRouter' : ''}`);
    await page.locator('#persistent-trigger').waitFor();
    await run(page);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
  }
}

async function navigate(page: Page, path: string) {
  await page.evaluate(path => (window as any).popoverFixture.navigate(path), path);
}

async function configure(page: Page, value: Record<string, unknown>) {
  await page.evaluate(async (value) => {
    Object.assign((window as any).popoverFixture.state, value);
    await (window as any).popoverFixture.flush();
  }, value);
}

async function popupsClosed(page: Page) {
  await page.waitForFunction(() => document.querySelectorAll('[data-popup]').length === 0, undefined, { timeout: 1500 });
}

for (const kind of ['popover', 'popconfirm']) {
  it(`${kind} 常驻浮层在路径、查询或锚点改变后关闭，重复或取消导航保持展开`, { skip: !existsSync(executablePath) }, async () => {
    await withPopover(kind, async (page) => {
      for (const path of ['/two', '/two?source=popup', '/two?source=popup#details']) {
        await page.locator('#persistent-trigger').click();
        await page.locator('[data-popup="persistent"]').waitFor();
        const current = await page.evaluate(() => (window as any).popoverFixture.state.open);
        assert.equal(current, true);
        // 重复导航及守卫取消都没有离开当前页面，不应误关。
        if (path === '/two') {
          await navigate(page, '/one');
          await navigate(page, '/blocked');
          assert.equal(await page.locator('[data-popup="persistent"]').count(), 1);
        }
        await navigate(page, path);
        await popupsClosed(page);
        assert.equal(await page.evaluate(() => (window as any).popoverFixture.state.open), false);
      }
      assert.deepEqual(await page.evaluate(() => (window as any).popoverFixture.updates), [true, false, true, false, true, false]);
    });
  });

  it(`${kind} 缓存停用关闭传送浮层，重新激活和路由返回不恢复旧状态`, { skip: !existsSync(executablePath) }, async () => {
    await withPopover(kind, async (page) => {
      await page.locator('#cached-trigger').click();
      await page.locator('[data-popup="cached"]').waitFor();
      await configure(page, { showCached: false });
      await popupsClosed(page);
      await configure(page, { showCached: true });
      assert.equal(await page.locator('[data-popup]').count(), 0);
      await page.locator('#cached-trigger').click();
      await page.locator('[data-popup="cached"]').waitFor();
      await navigate(page, '/two');
      await popupsClosed(page);
      await navigate(page, '/one');
      assert.equal(await page.locator('[data-popup]').count(), 0);
      await page.locator('#cached-trigger').click();
      await page.locator('[data-popup="cached"]').waitFor();
      await configure(page, { mounted: false });
      await popupsClosed(page);
    });
  });

  it(`${kind} 在没有安装路由的 Vue 应用中仍能打开关闭`, { skip: !existsSync(executablePath) }, async () => {
    await withPopover(kind, async (page) => {
      await page.locator('#persistent-trigger').click();
      await page.locator('[data-popup="persistent"]').waitFor();
      await page.locator('#persistent-trigger').click();
      await popupsClosed(page);
    }, true);
  });
}

it('popover 导航取消待打开的悬停计时器，重新悬停后正常打开', { skip: !existsSync(executablePath) }, async () => {
  await withPopover('popover', async (page) => {
    await configure(page, { mode: 'hover' });
    await page.locator('#persistent').dispatchEvent('mouseenter');
    await navigate(page, '/two');
    await page.waitForTimeout(400);
    assert.equal(await page.locator('[data-popup]').count(), 0, '旧页面的悬停任务不能在新页面打开浮层');
    await page.locator('#persistent').dispatchEvent('mouseenter');
    await page.locator('[data-popup="persistent"]').waitFor();
    await page.locator('#persistent').dispatchEvent('mouseleave');
    await popupsClosed(page);
  });
});

it('popover 导航关闭遮罩并取消已打开气泡的待关闭悬停任务', { skip: !existsSync(executablePath) }, async () => {
  await withPopover('popover', async (page) => {
    await configure(page, { modal: true });
    await page.locator('#persistent-trigger').click();
    await page.locator('[data-popup="persistent"]').waitFor();
    await page.mouse.move(900, 600);
    await configure(page, { mode: 'hover' });
    await page.locator('#persistent').dispatchEvent('mouseleave');
    await navigate(page, '/two');
    assert.equal(await page.evaluate(() => (window as any).popoverFixture.state.open), false, '导航立即关闭，不等待悬停关闭延迟');
    await popupsClosed(page);
    assert.equal(await page.locator('.bg-black\\/30').count(), 0);
    await page.waitForTimeout(200);
    assert.deepEqual(await page.evaluate(() => (window as any).popoverFixture.updates), [true, false]);
  });
});
