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

const executablePath = process.env.GUIDE_BROWSER_PATH || chromium.executablePath();
const browserAvailable = existsSync(executablePath);
let fixture: Promise<{ script: string; css: string }>;

/** 使用真实消费者与共享过渡，覆盖定位、交互边界和原生动画生命周期。 */
async function buildFixture() {
  const result = await build({
    stdin: {
      contents: `
        import Popover from '~/components/reborn/ui/reborn-popover/RebornPopover.vue';
        import Tooltip from '~/components/reborn/ui/reborn-tooltip/RebornTooltip.vue';
        import ContextMenu from '~/components/reborn/ui/reborn-context-menu/RebornContextMenu.vue';
        import Overlay from '~/components/reborn/ui/reborn-overlay/RebornOverlay.vue';
        import Badge from '~/components/reborn/ui/reborn-badge/RebornBadge.vue';
        import SelectTrigger from '~/components/reborn/ui/reborn-select-trigger/RebornSelectTrigger.vue';
        import {createApp,h,nextTick,reactive} from 'vue';
        const state=reactive({popover:false,tooltip:false,context:false,overlay:false,badge:true,allowClose:false,select:false,mounted:true});
        const events=[];
        window.consumerFixture={state,events,configure:value=>Object.assign(state,value),flush:nextTick};
        const items=[{id:'add',label:'添加事项',onSelect:()=>events.push('context-callback')},{id:'delete',label:'删除事项'}];
        const app=createApp({render:()=>state.mounted?h('main',{class:'flex flex-col gap-12 p-12'},[
          h('button',{id:'outside'},'外部按钮'),
          h(Popover,{open:state.popover,'onUpdate:open':value=>state.popover=value,placement:'bottom-start',arrow:true,
            ui:{contentWrapper:'fixture-popover'}
          },{default:()=>h('button',{id:'popover-trigger'},'展开气泡'),content:()=>h('div',{class:'h-24 w-48'},'气泡内容')}),
          h(Tooltip,{open:state.tooltip,'onUpdate:open':value=>state.tooltip=value,trigger:'focus',openDelay:0,closeDelay:0,
            content:'键盘提示',ui:{contentWrapper:'fixture-tooltip',trigger:'fixture-tooltip-trigger'},
            onOpen:()=>events.push('tooltip-open'),onClose:()=>events.push('tooltip-close')
          },{default:()=>h('button',{id:'tooltip-trigger'},'聚焦提示')}),
          h(ContextMenu,{open:state.context,'onUpdate:open':value=>state.context=value,items,
            ui:{contentWrapper:'fixture-context'},onSelect:()=>events.push('context-select')
          },{default:()=>h('button',{id:'context-trigger'},'右键菜单')}),
          h(Badge,{show:state.badge,'onUpdate:show':value=>state.badge=value,label:'可关闭标签',closable:true,
            beforeClose:()=>Promise.resolve(state.allowClose),ui:{root:'fixture-badge-motion',base:'fixture-badge',closeButton:'fixture-badge-close'},
            onClose:()=>events.push('badge-close')
          }),
          h(SelectTrigger,{isOpen:state.select,onClose:()=>state.select=false,side:'bottom',autoAdjustOverflow:false,
            ui:{wrapper:'w-60',dropdown:'fixture-select'},onAfterEnter:()=>events.push('select-enter')
          },{trigger:()=>h('button',{id:'select-trigger',onClick:()=>state.select=!state.select},'展开选择'),
            content:()=>h('div',{class:'h-32 w-60'},'下拉选项')}),
          h(Overlay,{modelValue:state.overlay,'onUpdate:modelValue':value=>state.overlay=value,duration:200,
            customClass:'fixture-overlay',onClose:()=>events.push('overlay-close'),onAfterLeave:()=>events.push('overlay-leave')
          }),
        ]):null});
        app.component('Icon',{render:()=>h('i')});app.mount('#app');
      `,
      sourcefile: 'transition-consumers-fixture.ts', loader: 'ts', resolveDir: resolve('.'),
    },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    alias: { '~': resolve('app'), '@': resolve('app') }, define: { 'import.meta.client': 'true' },
    plugins: [{ name: 'transition-consumers', setup(builder) {
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
  const scanner = new Scanner({ sources: ['reborn-transition', 'reborn-popover', 'reborn-tooltip', 'reborn-context-menu', 'reborn-overlay', 'reborn-badge', 'reborn-select-trigger'].map(name => ({ base: resolve(`app/components/reborn/ui/${name}`), pattern: '**/*', negated: false })) });
  return { script: result.outputFiles[0]!.text, css: compiler.build([...scanner.scan(), 'flex', 'flex-col', 'gap-12', 'p-12', 'h-24', 'h-32', 'w-48', 'w-60']) };
}

async function withConsumers(run: (page: Page) => Promise<void>) {
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
    const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.locator('#outside').waitFor();
    await run(page);
    assert.deepEqual(errors, [], '真实过渡消费者不应抛出浏览器错误');
  } finally {
    await browser?.close();
    await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
  }
}

async function configure(page: Page, value: Record<string, unknown>) {
  await page.evaluate(async (value) => {
    (window as any).consumerFixture.configure(value);
    await (window as any).consumerFixture.flush();
  }, value);
}

async function pauseAt(page: Page, selector: string, time: number) {
  await page.locator(selector).evaluate((element, time) => {
    for (const animation of element.getAnimations()) {
      animation.pause();
      animation.currentTime = time;
    }
  }, time);
}

async function resume(page: Page, selector: string) {
  await page.locator(selector).evaluate(element => element.getAnimations().forEach(animation => animation.play()));
}

async function opacity(page: Page, selector: string) {
  return page.locator(selector).evaluate(element => Number(getComputedStyle(element).opacity));
}

async function animationState(page: Page, selector: string) {
  return page.locator(selector).evaluate((element: HTMLElement) => ({ style: element.style.cssText, class: element.className, opacity: getComputedStyle(element).opacity, animations: element.getAnimations().map(animation => ({ time: animation.currentTime, frames: (animation.effect as KeyframeEffect).getKeyframes() })) }));
}

it('Popover 真实淡入缩放、锚点定位和快速反向保持连续，外部点击完成退出', { skip: !browserAvailable }, async () => {
  await withConsumers(async (page) => {
    await page.locator('#popover-trigger').click();
    await pauseAt(page, '.fixture-popover', 50);
    const mid = await opacity(page, '.fixture-popover');
    assert.ok(mid > 0 && mid < 1, `气泡入场具有中间帧 ${mid} ${JSON.stringify(await animationState(page, '.fixture-popover'))}`);
    await configure(page, { popover: false });
    await pauseAt(page, '.fixture-popover', 40);
    const leaving = await opacity(page, '.fixture-popover');
    await configure(page, { popover: true });
    const reopened = await opacity(page, '.fixture-popover');
    assert.ok(Math.abs(reopened - leaving) < 0.2, `重开沿用退出时的画面 ${JSON.stringify({ leaving, reopened, state: await animationState(page, '.fixture-popover') })}`);
    await resume(page, '.fixture-popover');
    await page.waitForTimeout(280);
    const trigger = (await page.locator('#popover-trigger').boundingBox())!;
    const panel = (await page.locator('.fixture-popover').boundingBox())!;
    assert.ok(Math.abs(panel.x - trigger.x) <= 1, '动画完成后仍与触发器起点对齐');
    assert.ok(panel.y >= trigger.y + trigger.height, '气泡保持在触发器下方');
    assert.equal(await page.locator('.fixture-popover').evaluate((element: HTMLElement) => element.style.opacity), '');
    await page.locator('#outside').click();
    await page.waitForTimeout(220);
    assert.equal(await page.locator('.fixture-popover').count(), 0);
  });
});

it('Tooltip 键盘聚焦关联 ARIA，退出保留 DOM，退出中重开恢复可见内容', { skip: !browserAvailable }, async () => {
  await withConsumers(async (page) => {
    await page.locator('#tooltip-trigger').focus();
    await page.getByRole('tooltip').waitFor();
    await pauseAt(page, '.fixture-tooltip', 60);
    assert.ok(await opacity(page, '.fixture-tooltip') > 0 && await opacity(page, '.fixture-tooltip') < 1, JSON.stringify(await animationState(page, '.fixture-tooltip')));
    assert.equal(await page.locator('.fixture-tooltip-trigger').getAttribute('aria-describedby'), await page.getByRole('tooltip').getAttribute('id'));
    await resume(page, '.fixture-tooltip');
    await page.waitForTimeout(350);
    await page.locator('#outside').focus();
    await page.waitForTimeout(40);
    await configure(page, { tooltip: true });
    await page.waitForTimeout(350);
    assert.equal(await page.getByRole('tooltip').isVisible(), true);
    assert.equal(await opacity(page, '.fixture-tooltip'), 1);
    await configure(page, { tooltip: false });
    await page.waitForTimeout(350);
    assert.equal(await page.locator('.fixture-tooltip').count(), 1, '默认隐藏缓存模式保留节点');
    assert.equal(await page.locator('.fixture-tooltip').isVisible(), false);
  });
});

it('ContextMenu 实际右键展开，换位重开和选择只触发一次并释放滚动拦截', { skip: !browserAvailable }, async () => {
  await withConsumers(async (page) => {
    await page.locator('#context-trigger').click({ button: 'right', position: { x: 25, y: 12 } });
    await pauseAt(page, '.fixture-context', 60);
    assert.ok(await opacity(page, '.fixture-context') > 0 && await opacity(page, '.fixture-context') < 1, JSON.stringify(await animationState(page, '.fixture-context')));
    await resume(page, '.fixture-context');
    await page.waitForTimeout(350);
    const first = (await page.locator('.fixture-context').boundingBox())!;
    assert.equal(await page.evaluate(() => !window.dispatchEvent(new WheelEvent('wheel', { cancelable: true }))), true, '菜单展开时拦截页面滚动');
    await page.locator('#context-trigger').click({ button: 'right', position: { x: 5, y: 2 } });
    await page.waitForTimeout(620);
    const second = (await page.locator('.fixture-context').boundingBox())!;
    assert.ok(second.x < first.x - 15, '重开后采用新的右键坐标');
    await configure(page, { context: false });
    await page.waitForTimeout(40);
    await configure(page, { context: true });
    await page.waitForTimeout(350);
    await page.getByRole('button', { name: '添加事项', exact: true }).click();
    await page.waitForTimeout(260);
    assert.equal(await page.locator('.fixture-context').count(), 0);
    assert.deepEqual(await page.evaluate(() => (window as any).consumerFixture.events.filter((event: string) => event.startsWith('context-'))), ['context-callback', 'context-select']);
    assert.equal(await page.evaluate(() => !window.dispatchEvent(new WheelEvent('wheel', { cancelable: true }))), false, '退出后解除滚动拦截');
  });
});

it('Overlay 退出中重开保持锁定，真实点击关闭并在结束后释放滚动锁', { skip: !browserAvailable }, async () => {
  await withConsumers(async (page) => {
    await configure(page, { overlay: true });
    await pauseAt(page, '.fixture-overlay', 50);
    assert.ok(await opacity(page, '.fixture-overlay') > 0 && await opacity(page, '.fixture-overlay') < 1, JSON.stringify(await animationState(page, '.fixture-overlay')));
    assert.equal(await page.evaluate(() => document.documentElement.style.overflow), 'hidden');
    await configure(page, { overlay: false });
    await page.waitForTimeout(40);
    await configure(page, { overlay: true });
    await page.waitForTimeout(260);
    assert.equal(await page.evaluate(() => document.documentElement.style.overflow), 'hidden');
    await page.locator('.fixture-overlay').click({ position: { x: 1000, y: 800 } });
    assert.equal(await page.evaluate(() => document.documentElement.style.overflow), 'hidden', '退场期间维持滚动锁');
    await page.waitForTimeout(270);
    assert.equal(await page.locator('.fixture-overlay').count(), 0);
    assert.notEqual(await page.evaluate(() => document.documentElement.style.overflow), 'hidden');
    assert.deepEqual(await page.evaluate(() => (window as any).consumerFixture.events.filter((event: string) => event.startsWith('overlay-'))), ['overlay-close', 'overlay-leave']);
  });
});

it('Badge 异步关闭拦截生效，放行后执行真实退出且关闭事件只触发一次', { skip: !browserAvailable }, async () => {
  await withConsumers(async (page) => {
    await page.locator('.fixture-badge-close').click();
    await page.waitForTimeout(230);
    assert.equal(await page.locator('.fixture-badge').isVisible(), true);
    assert.deepEqual(await page.evaluate(() => (window as any).consumerFixture.events), []);
    await configure(page, { allowClose: true });
    await page.locator('.fixture-badge-close').click();
    await pauseAt(page, '.fixture-badge-motion', 60);
    assert.ok(await page.locator('.fixture-badge').isVisible(), '退出结束前仍保留标签内容');
    const mid = await opacity(page, '.fixture-badge-motion');
    assert.ok(mid > 0 && mid < 1, `标签退场具有中间帧 ${mid}`);
    await resume(page, '.fixture-badge-motion');
    await page.waitForTimeout(260);
    assert.equal(await page.locator('.fixture-badge').count(), 0);
    assert.deepEqual(await page.evaluate(() => (window as any).consumerFixture.events), ['badge-close']);
  });
});

it('SelectTrigger 实际折叠、退场关闭命中区域，快速重开后恢复自然高度和锚点', { skip: !browserAvailable }, async () => {
  await withConsumers(async (page) => {
    await page.locator('#select-trigger').click();
    await pauseAt(page, '.fixture-select', 60);
    const mid = (await page.locator('.fixture-select').boundingBox())!;
    assert.ok(mid.height > 0 && mid.height < 128, `下拉高度真实插值 ${mid.height}`);
    await resume(page, '.fixture-select');
    await page.waitForTimeout(350);
    const natural = (await page.locator('.fixture-select').boundingBox())!;
    assert.ok(natural.height >= 128);
    await configure(page, { select: false });
    assert.equal(await page.locator('.fixture-select').evaluate(element => getComputedStyle(element).pointerEvents), 'none', JSON.stringify(await animationState(page, '.fixture-select')));
    await page.waitForTimeout(40);
    await configure(page, { select: true });
    await page.waitForTimeout(350);
    assert.equal(await page.locator('.fixture-select').evaluate((element: HTMLElement) => element.style.height), '');
    const final = (await page.locator('.fixture-select').boundingBox())!;
    const trigger = (await page.locator('#select-trigger').boundingBox())!;
    assert.equal(final.height, natural.height);
    assert.ok(Math.abs(final.y - trigger.y - trigger.height - 4) <= 1);
    await page.locator('#outside').click();
    await page.waitForTimeout(260);
    assert.equal(await page.locator('.fixture-select').count(), 0);
  });
});
