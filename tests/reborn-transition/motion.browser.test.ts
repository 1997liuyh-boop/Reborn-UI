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

/** 真实组件与 Motion 一起编译，验证浏览器原生动画、定位和完成清理。 */
async function buildFixture() {
  const result = await build({
    stdin: {
      contents: `
        import Transition from '~/components/reborn/ui/reborn-transition/RebornTransition.vue';
        import Drawer from '~/components/reborn/ui/reborn-drawer/RebornDrawer.vue';
        import Dialog from '~/components/reborn/ui/reborn-dialog/RebornDialog.vue';
        import {createApp,h,nextTick,reactive} from 'vue';
        const state=reactive({show:false,name:'zoom-in',collapse:false,customClass:'',customStyle:{},drawer:false,direction:'right',dialog:false,preset:'scale',mounted:true});
        const events=[];
        window.motionFixture={state,events,configure:value=>Object.assign(state,value),flush:nextTick};
        const app=createApp({render:()=>state.mounted?h('main',[
          h('button',{id:'outside'},'外部焦点'),
          h(Transition,{show:state.show,name:state.name,collapse:state.collapse,destroy:false,duration:240,
            customClass:'fixture-transition '+state.customClass,customStyle:{position:'fixed',left:'160px',top:'120px',width:'200px',...state.customStyle},
            onAfterEnter:()=>events.push('transition-enter'),onAfterLeave:()=>events.push('transition-leave')
          },{default:()=>h('div',{style:'height:120px;background:red'},'过渡内容')}),
          h(Drawer,{modelValue:state.drawer,'onUpdate:modelValue':value=>state.drawer=value,direction:state.direction,size:300,duration:240,
            ui:{root:'fixture-drawer'},onOpened:()=>events.push('drawer-enter'),onClosed:()=>events.push('drawer-leave')
          },{default:()=>h('input',{id:'drawer-input'})}),
          h(Dialog,{modelValue:state.dialog,'onUpdate:modelValue':value=>state.dialog=value,transition:state.preset,title:'动画对话框',
            ui:{backdrop:'fixture-backdrop',panelWrapper:'fixture-dialog-motion',panel:'fixture-dialog'},
            onOpened:()=>events.push('dialog-enter'),onClosed:()=>events.push('dialog-leave')
          },{default:()=>h('input',{id:'dialog-input'})}),
        ]):null});
        app.component('Icon',{render:()=>h('i')});app.mount('#app');
      `,
      sourcefile: 'motion-fixture.ts', loader: 'ts', resolveDir: resolve('.'),
    },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    alias: { '~': resolve('app'), '@': resolve('app') }, define: { 'import.meta.client': 'true' },
    plugins: [{ name: 'motion-test', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        return { contents: compileScript(descriptor, {
          id: path, inlineTemplate: true,
          fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        }).content, loader: 'ts', resolveDir: dirname(path) };
      });
    } }],
  });
  const compiler = await compile(`@import 'tailwindcss';@import './app/assets/theme/typography.css';@import './app/assets/theme/base.css';`, { base: resolve('.'), onDependency() {} });
  const scanner = new Scanner({ sources: ['reborn-transition', 'reborn-drawer', 'reborn-dialog', 'reborn-button', 'reborn-loading'].map(name => ({ base: resolve(`app/components/reborn/ui/${name}`), pattern: '**/*', negated: false })) });
  return { script: result.outputFiles[0]!.text, css: compiler.build(scanner.scan()) };
}

async function withMotion(run: (page: Page) => Promise<void>) {
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
    await page.locator('#outside').waitFor();
    await run(page);
    assert.deepEqual(errors, [], '真实动画不应抛出错误');
  } finally {
    await browser?.close();
    await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
  }
}

async function configure(page: Page, value: Record<string, unknown>) {
  await page.evaluate(async (value) => {
    (window as any).motionFixture.configure(value);
    await (window as any).motionFixture.flush();
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

it('共享过渡保留缩放与平移，反向切换连续，完成后恢复定位和动画样式', { skip: !browserAvailable }, async () => {
  await withMotion(async (page) => {
    await configure(page, { show: true, name: 'zoom-out' });
    await pauseAt(page, '.fixture-transition', 60);
    const mid = await page.locator('.fixture-transition').evaluate(element => ({ opacity: Number(getComputedStyle(element).opacity), width: element.getBoundingClientRect().width }));
    assert.ok(mid.opacity > 0 && mid.opacity < 1, `入场存在真实透明度插值 ${JSON.stringify(mid)}`);
    assert.ok(mid.width > 200 && mid.width < 220, 'Tailwind 独立 scale 已进入 Motion 插值');
    await configure(page, { show: false });
    await pauseAt(page, '.fixture-transition', 60);
    const reversal = await page.locator('.fixture-transition').evaluate(async (element) => {
      const leaving = Number(getComputedStyle(element).opacity);
      (window as any).motionFixture.configure({ show: true });
      await (window as any).motionFixture.flush();
      return { leaving, reversed: Number(getComputedStyle(element).opacity) };
    });
    assert.ok(Math.abs(reversal.reversed - reversal.leaving) < 0.05, `反向切换不跳回入场起点 ${JSON.stringify(reversal)}`);
    await page.waitForTimeout(300);
    assert.deepEqual(await page.locator('.fixture-transition').evaluate((element: HTMLElement) => ({ left: element.style.left, top: element.style.top, opacity: element.style.opacity, transform: element.style.transform, height: element.style.height })), { left: '160px', top: '120px', opacity: '', transform: '', height: '' });
    await configure(page, { show: false }); await page.waitForTimeout(300);
    await configure(page, { name: 'fade-up', show: true }); await page.waitForTimeout(50);
    assert.ok((await page.locator('.fixture-transition').boundingBox())!.y < 120, '平移预设也有真实位移');
  });
});

it('折叠高度实际插值，快速开关后恢复自动高度，减少动态立即完成', { skip: !browserAvailable }, async () => {
  await withMotion(async (page) => {
    await configure(page, { name: 'select-collapse', collapse: true, show: true });
    await pauseAt(page, '.fixture-transition', 60);
    const midHeight = (await page.locator('.fixture-transition').boundingBox())!.height;
    assert.ok(midHeight > 0 && midHeight < 120, `折叠高度有中间帧 ${midHeight} ${JSON.stringify(await page.locator('.fixture-transition').evaluate((element: HTMLElement) => ({style:element.style.cssText,scroll:element.scrollHeight,animations:element.getAnimations().map(animation => ({time:animation.currentTime,frames:(animation.effect as KeyframeEffect).getKeyframes()}))})))}`);
    await configure(page, { show: false }); await page.waitForTimeout(40); await configure(page, { show: true });
    await page.waitForTimeout(300);
    assert.equal(await page.locator('.fixture-transition').evaluate((element: HTMLElement) => element.style.height), '');
    assert.equal((await page.locator('.fixture-transition').boundingBox())!.height, 120);
    await configure(page, { show: false }); await page.waitForTimeout(300);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await configure(page, { show: true }); await page.waitForTimeout(30);
    assert.equal(await page.locator('.fixture-transition').evaluate((element: HTMLElement) => element.style.height), '');
    assert.equal((await page.locator('.fixture-transition').boundingBox())!.height, 120);
  });
});

it('动画期间新增的外部类和行内运动样式保留，原有过渡与动画长属性完整恢复', { skip: !browserAvailable }, async () => {
  await withMotion(async (page) => {
    const style = {
      transitionDuration: '900ms', transitionTimingFunction: 'ease-in', transitionProperty: 'transform',
      animationDuration: '1.2s', animationTimingFunction: 'linear', animationName: 'none',
      transform: 'translateX(12px)', scale: '0.9',
    };
    await configure(page, { show: true, collapse: true, name: 'select-collapse', customStyle: style });
    await pauseAt(page, '.fixture-transition', 60);
    await configure(page, { customClass: 'overflow-hidden', customStyle: { ...style, left: '200px', transform: 'translateX(24px)', scale: '0.8' } });
    await page.locator('.fixture-transition').evaluate(element => element.getAnimations().forEach(animation => animation.play()));
    await page.waitForTimeout(300);
    const restored = await page.locator('.fixture-transition').evaluate((element: HTMLElement) => ({
      overflow: element.classList.contains('overflow-hidden'), left: element.style.left,
      transform: element.style.transform, scale: element.style.scale,
      transitionDuration: element.style.transitionDuration, transitionTimingFunction: element.style.transitionTimingFunction, transitionProperty: element.style.transitionProperty,
      animationDuration: element.style.animationDuration, animationTimingFunction: element.style.animationTimingFunction, animationName: element.style.animationName,
    }));
    assert.deepEqual(restored, { ...style, transform: 'translateX(24px)', scale: '0.8', overflow: true, left: '200px' });
  });
});

it('抽屉四方向滑动、退场期间保持锁定，快速重开与卸载不遗留动画', { skip: !browserAvailable }, async () => {
  await withMotion(async (page) => {
    for (const direction of ['left', 'right', 'top', 'bottom']) {
      await configure(page, { direction, drawer: true });
      await pauseAt(page, '.fixture-drawer', 60);
      const moving = await page.locator('.fixture-drawer').evaluate((element: HTMLElement) => ({ transform: getComputedStyle(element).transform, inline: element.style.transform, animations: element.getAnimations().map(animation => ({time:animation.currentTime,state:animation.playState,frames:(animation.effect as KeyframeEffect).getKeyframes()})) }));
      assert.notEqual(moving.transform, 'matrix(1, 0, 0, 1, 0, 0)', `${direction} 存在滑动中间帧 ${JSON.stringify(moving)}`);
      await page.locator('.fixture-drawer').evaluate(element => element.getAnimations().forEach(animation => animation.play()));
      await page.waitForTimeout(260);
      assert.equal(await page.locator('#drawer-input').evaluate(element => element === document.activeElement), true);
      await configure(page, { drawer: false });
      assert.equal(await page.evaluate(() => document.documentElement.style.overflow), 'hidden');
      await page.waitForTimeout(40); await configure(page, { drawer: true }); await page.waitForTimeout(300);
      assert.equal(await page.locator('.fixture-drawer').isVisible(), true);
      await configure(page, { drawer: false }); await page.waitForTimeout(300);
      assert.notEqual(await page.evaluate(() => document.documentElement.style.overflow), 'hidden');
    }
    await configure(page, { drawer: true }); await page.waitForTimeout(50); await configure(page, { mounted: false });
    await page.waitForTimeout(300);
    assert.equal(await page.locator('.fixture-drawer').count(), 0);
    assert.notEqual(await page.evaluate(() => document.documentElement.style.overflow), 'hidden');
  });
});

it('对话框预设和遮罩同时插值，重复开关与卸载完整释放锁定', { skip: !browserAvailable }, async () => {
  await withMotion(async (page) => {
    await page.evaluate(async () => {
      const fixture = (window as any).motionFixture;
      fixture.configure({ dialog: true }); await fixture.flush();
      fixture.configure({ dialog: false }); await fixture.flush();
    });
    await page.waitForTimeout(300);
    assert.equal(await page.locator('.fixture-dialog').isVisible(), false, '入场帧之前关闭不会延后重新打开');
    assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden');
    for (const preset of ['scale', 'slide', 'fade', 'bounce']) {
      await configure(page, { preset, dialog: true });
      await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.fixture-backdrop')!).opacity) > 0);
      const opacity = await page.locator('.fixture-backdrop').evaluate(element => Number(getComputedStyle(element).opacity));
      assert.ok(opacity > 0 && opacity <= 1, `${preset} 遮罩开始淡入`);
      await page.waitForTimeout(550);
      assert.equal(await page.locator('.fixture-dialog-motion').evaluate(element => Number(getComputedStyle(element).opacity)), 1);
      await configure(page, { dialog: false }); await page.waitForTimeout(40); await configure(page, { dialog: true });
      await page.waitForTimeout(550);
      assert.equal(await page.locator('.fixture-dialog').isVisible(), true);
      await configure(page, { dialog: false }); await page.waitForTimeout(500);
      assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden', JSON.stringify(await page.evaluate(() => ({ events:(window as any).motionFixture.events,visible:document.querySelector('.fixture-dialog-motion')?.getAttribute('style'),body:document.body.style.cssText }))));
    }
    await configure(page, { dialog: true }); await page.waitForTimeout(40); await configure(page, { mounted: false });
    await page.waitForTimeout(300);
    assert.equal(await page.locator('.fixture-dialog').count(), 0);
    assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden');
  });
});
