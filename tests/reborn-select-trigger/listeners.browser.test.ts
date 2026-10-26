/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { Page } from 'playwright-core';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { it } from 'node:test';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

const executablePath = chromium.executablePath();
let fixture: Promise<string>;

/**
 * 20 个收起的触发器 + 统计 window / document 上的活动监听。
 * 监听统计在应用挂载前接管 addEventListener，只记本组件关心的几类事件。
 */
async function buildFixture() {
  const result = await build({
    stdin: {
      contents: `
        const tracked=new Set(['scroll','resize','pointerdown','mousedown','click','wheel','touchstart']);
        const active=new Map();
        const keyOf=(target,type)=>(target===window?'window':'document')+':'+type;
        for (const target of [window,document]) {
          const add=target.addEventListener.bind(target), remove=target.removeEventListener.bind(target);
          target.addEventListener=(type,fn,opts)=>{ if(tracked.has(type)){const k=keyOf(target,type);active.set(k,(active.get(k)||0)+1);} return add(type,fn,opts); };
          target.removeEventListener=(type,fn,opts)=>{ if(tracked.has(type)){const k=keyOf(target,type);active.set(k,(active.get(k)||0)-1);} return remove(type,fn,opts); };
        }
        const { default: SelectTrigger } = await import('~/components/reborn/ui/reborn-select-trigger/RebornSelectTrigger.vue');
        const {createApp,h,nextTick,reactive} = await import('vue');
        const state=reactive({open:-1,closeOn:'mousedown',closes:0,focusins:0});
        window.listenerFixture={state,flush:nextTick,active:()=>Object.fromEntries(active)};
        createApp({render:()=>h('main',[
          h('button',{id:'outside'},'外部按钮'),
          ...Array.from({length:20},(_,i)=>h(SelectTrigger,{
            key:i,isOpen:state.open===i,closeOn:state.closeOn,portal:true,
            id:'trigger-'+i,'data-testid':'fixture-'+i,'aria-label':'第'+i+'个',style:'margin-left: 3px',
            onFocusin:()=>state.focusins++,
            onClose:()=>{state.closes++;state.open=-1;},
          },{trigger:()=>h('button',{class:'trigger-button',onMousedown:()=>{state.open=i;}},'选择'+i),
            content:()=>h('div',{class:'fixture-content'},'展开内容'+i)}))
        ])}).mount('#app');
      `,
      resolveDir: resolve('.'), sourcefile: 'select-trigger-listener-fixture.ts', loader: 'ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'select-trigger-listener', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        return { contents: compileScript(descriptor, {
          id: path, inlineTemplate: true,
          fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        }).content, loader: 'ts', resolveDir: dirname(path) };
      });
    } }],
  });
  return result.outputFiles[0]!.text;
}

async function withFixture(run: (page: Page) => Promise<void>) {
  fixture ??= buildFixture();
  const script = await fixture;
  const server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : 'text/html');
    response.end(request.url === '/app.js' ? script : '<!doctype html><html><head></head><body><div id="app"></div><script type="module" src="/app.js"></script></body></html>');
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
    await page.locator('#trigger-0').waitFor();
    await run(page);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
  }
}

/** 当前活动监听数，key 形如 document:pointerdown */
function activeListeners(page: Page): Promise<Record<string, number>> {
  return page.evaluate(() => (window as any).listenerFixture.active());
}

function fixtureState(page: Page): Promise<{ open: number; closes: number; focusins: number }> {
  return page.evaluate(() => ({ ...(window as any).listenerFixture.state }));
}

/** 等收起动画结束：浮层的 after-leave 触发后才摘监听 */
async function waitUnbound(page: Page) {
  await page.waitForFunction(() => {
    const active = (window as any).listenerFixture.active();
    return !active['document:pointerdown'] && !active['window:scroll'];
  }, undefined, { timeout: 3000 });
}

it('未声明的属性与监听透传到根节点 wrapper', { skip: !existsSync(executablePath) }, async () => {
  await withFixture(async (page) => {
    const root = page.locator('#trigger-0');
    assert.equal(await root.getAttribute('data-testid'), 'fixture-0');
    assert.equal(await root.getAttribute('aria-label'), '第0个');
    assert.equal(await root.getAttribute('tabindex'), '0', '透传的属性落在带 tabindex 的根节点上');
    assert.match((await root.getAttribute('style')) ?? '', /margin-left:\s*3px/);
    await page.locator('#trigger-0 .trigger-button').focus();
    assert.equal((await fixtureState(page)).focusins, 1, '@focusin 监听落在根节点上，子元素聚焦冒泡可达');
  });
});

it('收起状态不挂全局监听，展开期间才挂，收起动画结束后摘除', { skip: !existsSync(executablePath) }, async () => {
  await withFixture(async (page) => {
    const idle = await activeListeners(page);
    for (const key of ['document:pointerdown', 'document:wheel', 'document:touchstart', 'window:scroll', 'window:resize'])
      assert.ok(!idle[key], `20 个收起实例不应在 ${key} 上常驻监听：${JSON.stringify(idle)}`);

    // 在触发器上按下展开：展开那次按下不能被判成外部按下
    await page.locator('#trigger-3 .trigger-button').dispatchEvent('mousedown');
    await page.evaluate(() => (window as any).listenerFixture.flush());
    let state = await fixtureState(page);
    assert.equal(state.open, 3);
    assert.equal(state.closes, 0, '展开那次按下不应触发外部关闭');
    const opened = await activeListeners(page);
    for (const key of ['document:pointerdown', 'document:wheel', 'document:touchstart', 'window:scroll', 'window:resize'])
      assert.equal(opened[key], 1, `只有展开的那一个实例挂监听：${key}`);

    // 浮层内按下不算外部
    await page.locator('.fixture-content', { hasText: '展开内容3' }).dispatchEvent('pointerdown');
    assert.equal((await fixtureState(page)).closes, 0, '浮层内按下不应收起');

    // 外部按下收起，收起动画结束后摘监听
    await page.locator('#outside').dispatchEvent('pointerdown');
    state = await fixtureState(page);
    assert.equal(state.closes, 1);
    assert.equal(state.open, -1);
    await waitUnbound(page);
  });
});

it('closeOn 为 click 时外部点击才收起，切换 closeOn 不会在收起状态下挂监听', { skip: !existsSync(executablePath) }, async () => {
  await withFixture(async (page) => {
    await page.evaluate(async () => {
      (window as any).listenerFixture.state.closeOn = 'click';
      await (window as any).listenerFixture.flush();
    });
    const idle = await activeListeners(page);
    assert.ok(!idle['document:click'] && !idle['document:pointerdown'], `收起时改 closeOn 不应挂监听：${JSON.stringify(idle)}`);

    await page.locator('#trigger-5 .trigger-button').dispatchEvent('mousedown');
    await page.evaluate(() => (window as any).listenerFixture.flush());
    const opened = await activeListeners(page);
    assert.equal(opened['document:click'], 1);
    assert.ok(!opened['document:pointerdown'], 'click 时机不挂 mousedown');

    await page.locator('#outside').dispatchEvent('mousedown');
    assert.equal((await fixtureState(page)).closes, 0, 'click 时机下外部按下不收起');
    await page.locator('#outside').click();
    assert.equal((await fixtureState(page)).closes, 1, '外部完成点击后收起');
    await page.waitForFunction(() => !(window as any).listenerFixture.active()['document:click'], undefined, { timeout: 3000 });
  });
});
