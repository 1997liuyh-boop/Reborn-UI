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
const available = existsSync(executablePath);
let browser: Awaited<ReturnType<typeof chromium.launch>>;
let server: ReturnType<typeof createServer>;
let url = '';

before(async () => {
  if (!available) return;
  const result = await build({
    stdin: { resolveDir: resolve('.'), sourcefile: 'motion-content.ts', loader: 'ts', contents: `
      import {createApp,h,nextTick,reactive,ref} from 'vue';
      import Collapse from '@/components/reborn/ui/reborn-collapse/RebornCollapse.vue';
      import Menu from '@/components/reborn/ui/reborn-menu/RebornMenu.vue';
      import SubMenu from '@/components/reborn/ui/reborn-menu/RebornSubMenu.vue';
      import Carousel from '@/components/reborn/ui/reborn-carousel/RebornCarousel.vue';
      import {runMotion,stopMotion} from '@/lib/motion';
      globalThis.useRouter=()=>undefined;
      const state=reactive({open:false,absolute:false,position:'bottom',expandType:'normal',transition:true,persistent:true,height:'auto',mounted:true});
      const carousel=ref();const menu=ref();const menuEvents=[];let settled=0;
      const app=createApp({render:()=>state.mounted?h('div',[
        h(Collapse,{modelValue:state.open,absolute:state.absolute,position:state.position,ui:{trigger:'fixture-collapse',content:'fixture-content'}},{default:()=>h('button','折叠'),content:()=>h('div',{style:'height:120px'},'内容')}),
        h(Menu,{ref:menu,onOpen:()=>menuEvents.push('open'),onClose:()=>menuEvents.push('close'),expandType:state.expandType,menuTrigger:'click',collapseTransition:state.transition,persistent:state.persistent,showTimeout:0,hideTimeout:0},{default:()=>h(SubMenu,{index:'parent',teleported:true,ui:{subMenuPopup:'fixture-submenu'}},{title:()=>h('span','子菜单'),default:()=>h('li',{style:'height:112px'},'子条目')})}),
        h(Carousel,{ref:carousel,height:state.height,loop:false,duration:80,trigger:'click',ui:{root:'fixture-carousel'}},{default:()=>[120,240,160].map((height,index)=>h('article',{key:index,style:{height:height+'px'}},'轮播'+index))}),
        h('div',{id:'probe',style:'width:20px;height:20px;opacity:0'})
      ]):null});
      app.component('Icon',()=>h('svg'));
      app.mount('#app');
      window.fixture={state,menuEvents,flush:nextTick,next:()=>carousel.value.next(),prev:()=>carousel.value.prev(),
        openMenu:()=>menu.value.open('parent'),closeMenu:()=>menu.value.close('parent'),
        animate:(value,duration=.3)=>runMotion(document.querySelector('#probe'),{opacity:value},{duration}).finished.then(()=>settled++),
        stop:()=>stopMotion(document.querySelector('#probe')),settled:()=>settled,unmount:()=>app.unmount()};
    ` },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    alias: { '@': resolve('app'), '~': resolve('app') }, define: { 'import.meta.client': 'true' },
    plugins: [{ name: 'motion-content', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        return { contents: compileScript(descriptor, { id: path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') } }).content, loader: 'ts' };
      });
    } }],
  });
  const compiler = await compile(`@import 'tailwindcss';@import './app/assets/theme/typography.css';@import './app/assets/theme/base.css';`, { base: resolve('.'), onDependency() {} });
  const scanner = new Scanner({ sources: ['collapse', 'menu', 'carousel', 'progress'].map(name => ({ base: resolve(`app/components/reborn/ui/reborn-${name}`), pattern: '**/*', negated: false })) });
  const css = compiler.build(scanner.scan());
  server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : request.url === '/style.css' ? 'text/css' : 'text/html');
    response.end(request.url === '/app.js' ? result.outputFiles[0]!.text : request.url === '/style.css' ? css : '<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body><div id="app" style="width:600px;margin:160px auto"></div><script type="module" src="/app.js"></script></body></html>');
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  url = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({ executablePath, headless: true });
});

after(async () => {
  await browser?.close();
  if (server) await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
});

async function withPage(run: (page: Page) => Promise<void>) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(url);
    await page.locator('#probe').waitFor({ state: 'attached' });
    await page.waitForTimeout(400);
    await run(page);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
}

async function configure(page: Page, value: Record<string, unknown>) {
  await page.evaluate(async value => { Object.assign((window as any).fixture.state, value); await (window as any).fixture.flush(); }, value);
}

it('公共执行器中断会结束等待，替换从当前画面继续，减少动态效果即时落定', { skip: !available }, async () => {
  await withPage(async (page) => {
    await page.evaluate(() => { void (window as any).fixture.animate(1); });
    await page.waitForTimeout(70);
    const first = await page.locator('#probe').evaluate(element => Number(getComputedStyle(element).opacity));
    assert.ok(first > 0 && first < 1);
    await page.evaluate(() => { void (window as any).fixture.animate(0); });
    const next = await page.locator('#probe').evaluate(element => Number(getComputedStyle(element).opacity));
    assert.ok(Math.abs(next - first) < 0.12);
    await page.waitForTimeout(50);
    await page.evaluate(() => (window as any).fixture.stop());
    assert.equal(await page.evaluate(() => (window as any).fixture.settled()), 2);
    await page.evaluate(() => { void (window as any).fixture.animate(1); });
    await page.waitForTimeout(40);
    const hidden = await page.locator('#probe').evaluate(element => {
      const probe = element as HTMLElement;
      probe.style.display = 'none';
      const before = Number(getComputedStyle(probe).opacity);
      (window as any).fixture.stop();
      const after = Number(getComputedStyle(probe).opacity);
      probe.style.display = 'block';
      return { before, after };
    });
    assert.ok(Math.abs(hidden.before - hidden.after) < 0.02, 'v-show 已隐藏时也保留中断帧');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => (window as any).fixture.animate(1));
    assert.equal(await page.locator('#probe').evaluate(element => Number(getComputedStyle(element).opacity)), 1);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('#probe').evaluate(element => { (element as HTMLElement).style.opacity = '0.4'; });
    await page.evaluate(() => { void (window as any).fixture.animate(0); });
    const restarted = await page.locator('#probe').evaluate(element => Number(getComputedStyle(element).opacity));
    assert.ok(restarted > 0.3 && restarted <= 0.4, `复用节点应读取新的样式起点：${restarted}`);
  });
});

it('折叠上下方与浮层模式保持几何，快速反向切换无残留高度', { skip: !available }, async () => {
  await withPage(async (page) => {
    const panel = page.locator('.fixture-collapse');
    for (const absolute of [false, true]) for (const position of ['top', 'bottom']) {
      await configure(page, { absolute, position, open: false });
      await page.waitForTimeout(350);
      await configure(page, { open: true });
      await page.waitForTimeout(75);
      const style = await panel.evaluate(element => ({ height: element.getBoundingClientRect().height, transform: getComputedStyle(element.firstElementChild!).transform }));
      if (absolute) assert.notEqual(style.transform, 'none');
      else assert.ok(style.height > 0 && style.height < 120, `中间高度 ${style.height}`);
      await configure(page, { open: false });
      await page.waitForTimeout(40);
      await configure(page, { open: true });
      await page.waitForTimeout(350);
      assert.ok(Math.abs((await panel.boundingBox())!.height - 120) < 1);
      assert.equal(await panel.evaluate(element => element.style.height), '');
      assert.equal(await panel.locator('>div').evaluate(element => element.style.transform), '');
    }
    await configure(page, { absolute: true, open: false });
    await page.waitForTimeout(350);
    await configure(page, { open: true });
    await page.waitForTimeout(50);
    await configure(page, { absolute: false });
    await page.waitForTimeout(350);
    assert.equal(await panel.locator('>div').evaluate(element => getComputedStyle(element).transform), 'none', '浮层动画中切回文档流不残留位移');
    await configure(page, { open: false });
    await page.evaluate(() => (window as any).fixture.unmount());
    await page.waitForTimeout(350);
    assert.equal(await page.locator('.fixture-collapse').count(), 0);
  });
});

it('平铺菜单切换可中断，浮层持久化与销毁模式均能恢复，关闭动画开关生效', { skip: !available }, async () => {
  await withPage(async (page) => {
    const title = page.getByText('子菜单', { exact: true });
    await title.click(); await page.waitForTimeout(60);
    const height = (await page.locator('.fixture-submenu').boundingBox())!.height;
    assert.ok(height > 0 && height < 150);
    await title.click(); await page.waitForTimeout(30); await title.click(); await page.waitForTimeout(350);
    assert.equal(await page.locator('.fixture-submenu').evaluate(element => element.style.height), '');
    await title.click(); await page.waitForTimeout(350);
    for (const persistent of [false, true]) {
      await configure(page, { expandType: 'popup', persistent });
      await page.evaluate(() => (window as any).fixture.openMenu()); await page.waitForTimeout(70);
      const popup = page.locator('.fixture-submenu');
      const opacity = await popup.evaluate(element => Number(getComputedStyle(element).opacity));
      assert.ok(opacity > 0 && opacity < 1);
      await page.waitForTimeout(160);
      await page.evaluate(() => (window as any).fixture.closeMenu()); await page.waitForTimeout(30);
      const interrupted = await popup.evaluate(element => Number(getComputedStyle(element).opacity));
      await page.evaluate(async () => { (window as any).fixture.openMenu(); await (window as any).fixture.flush(); });
      const resumed = await popup.evaluate(element => Number(getComputedStyle(element).opacity));
      if (persistent) assert.ok(Math.abs(resumed - interrupted) < 0.12, `反向应从当前帧续接：${interrupted} → ${resumed}`);
      await page.waitForTimeout(250);
      assert.equal(await popup.evaluate(element => Number(getComputedStyle(element).opacity)), 1, `persistent=${persistent}`);
      await page.evaluate(() => (window as any).fixture.closeMenu()); await page.waitForTimeout(200);
      assert.equal(await popup.isVisible(), false);
    }
    await configure(page, { expandType: 'normal', transition: false });
    await title.click(); await page.waitForTimeout(60);
    assert.equal(await page.locator('.fixture-submenu').evaluate(element => element.style.height), '');
  });
});

it('轮播自动高度平滑变化，原生滚动仍切换，固定高度立即接管旧动画', { skip: !available }, async () => {
  await withPage(async (page) => {
    const carousel = page.locator('.fixture-carousel');
    assert.ok(Math.abs((await carousel.boundingBox())!.height - 120) < 1);
    await page.evaluate(() => (window as any).fixture.next());
    await page.waitForTimeout(70);
    const height = (await carousel.boundingBox())!.height;
    assert.ok(height > 120 && height < 240, `切换中高度 ${height}`);
    await page.waitForTimeout(350);
    assert.ok(Math.abs((await carousel.boundingBox())!.height - 240) < 1);
    const scroll = await page.locator('[data-direction]').evaluate(element => element.scrollLeft);
    assert.ok(scroll > 500);
    await page.evaluate(() => (window as any).fixture.prev());
    await page.waitForTimeout(60);
    await configure(page, { height: 180 });
    await page.waitForTimeout(350);
    assert.ok(Math.abs((await carousel.boundingBox())!.height - 180) < 1);
  });
});
