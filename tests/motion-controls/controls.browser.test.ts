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

const executablePath = process.env.CONTROLS_BROWSER_PATH || chromium.executablePath();
const browserAvailable = existsSync(executablePath);
let browser: Awaited<ReturnType<typeof chromium.launch>>;
let server: ReturnType<typeof createServer>;
let url = '';

/** 在真实浏览器运行组件及 Motion，不用动画桩替代运动实现。 */
before(async () => {
  if (!browserAvailable) return;
  const result = await build({
    stdin: {
      contents: `
        import Tabs from '~/components/reborn/ui/reborn-tabs/RebornTabs.vue';
        import Pane from '~/components/reborn/ui/reborn-tabs/RebornTabPane.vue';
        import Segmented from '~/components/reborn/ui/reborn-segmented/RebornSegmented.vue';
        import RadioGroup from '~/components/reborn/ui/reborn-radio/RebornRadioGroup.vue';
        import Switch from '~/components/reborn/ui/reborn-switch/RebornSwitch.vue';
        import Statistic from '~/components/reborn/ui/reborn-statistic/RebornStatistic.vue';
        import {createApp,h,nextTick,reactive} from 'vue';
        const state=reactive({visible:true,key:'a',type:'line',position:'top',animation:true,direction:'horizontal',
          checked:false,switchType:'circle',size:'md',disabled:false,value:1000,duration:300});
        const options=[{label:'第一项',value:'a'},{label:'第二个较长选项',value:'b'},{label:'第三项',value:'c'}];
        const app=createApp({render:()=>state.visible?h('main',{},[
          h('section',{id:'tabs'},[h(Tabs,{activeKey:state.key,'onUpdate:activeKey':v=>state.key=v,type:state.type,position:state.position,animation:state.animation,
            ui:{indicator:'fixture-indicator',tabSlider:'fixture-slider',stage:'fixture-stage'}},
            {default:()=>options.map((item,i)=>h(Pane,{key:item.value,title:item.label},{default:()=>h('div',{style:'height:'+(80+i*80)+'px'},item.label)}))})]),
          h('section',{id:'segmented'},[h(Segmented,{modelValue:state.key,'onUpdate:modelValue':v=>state.key=v,options,direction:state.direction,ui:{slider:'fixture-slider'}})]),
          h('section',{id:'radio'},[h(RadioGroup,{modelValue:state.key,'onUpdate:modelValue':v=>state.key=v,options,type:'button',direction:state.direction})]),
          h('section',{id:'switch'},[h(Switch,{modelValue:state.checked,'onUpdate:modelValue':v=>state.checked=v,type:state.switchType,size:state.size,disabled:state.disabled,ui:{thumb:'fixture-thumb',track:'fixture-track'}})]),
          h('section',{id:'statistic'},[h(Statistic,{value:state.value,duration:state.duration,precision:1,groupSeparator:''})]),
        ]):null});
        app.component('Icon',props=>h('svg',{'data-icon':props.name}));
        app.mount('#app');
        window.controlsFixture={configure:props=>Object.assign(state,props),flush:nextTick,stop:()=>app.unmount()};
      `,
      resolveDir: resolve('.'), loader: 'ts', sourcefile: 'controls-fixture.ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false, alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'controls-browser', setup(builder) {
      builder.onResolve({ filter: /^#components$/ }, () => ({ path: 'icons', namespace: 'controls-browser' }));
      builder.onLoad({ filter: /.*/, namespace: 'controls-browser' }, () => ({ contents: `import {h} from 'vue';export const Icon=(props)=>h('svg',{'data-icon':props.name});`, loader: 'js', resolveDir: resolve('.') }));
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        let contents = compileScript(descriptor, {
          id: path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        }).content;
        if (contents.includes('useFormInject(') && !/import[^;]+\buseFormInject\b/.test(contents)) {
          contents = `import {useFormInject} from '~/composables/useFieldGroup';\n${contents}`;
        }
        return { contents, loader: 'ts' };
      });
    } }],
  });
  const compiler = await compile(`@import 'tailwindcss';@import './app/assets/theme/typography.css';@import './app/assets/theme/base.css';@import './app/assets/theme/motion.css';`, { base: resolve('.'), onDependency() {} });
  const scanner = new Scanner({ sources: ['tabs', 'radio', 'segmented', 'switch', 'statistic', 'button'].map(id => ({ base: resolve(`app/components/reborn/ui/reborn-${id}`), pattern: '**/*', negated: false })) });
  const css = compiler.build(scanner.scan());
  const script = result.outputFiles[0]!.text;
  server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : request.url === '/style.css' ? 'text/css' : 'text/html');
    response.end(request.url === '/app.js' ? script : request.url === '/style.css' ? css : '<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body style="margin:24px"><div id="app"></div><script type="module" src="/app.js"></script></body></html>');
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

async function withControls(run: (page: Page) => Promise<void>, reducedMotion: 'reduce' | 'no-preference' = 'no-preference') {
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 }, reducedMotion });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const request = window.requestAnimationFrame.bind(window);
    const cancel = window.cancelAnimationFrame.bind(window);
    const pending = new Set<number>();
    (window as any).pendingMotionFrames = pending;
    window.requestAnimationFrame = callback => {
      const id = request(time => { pending.delete(id); callback(time); });
      pending.add(id);
      return id;
    };
    window.cancelAnimationFrame = id => { pending.delete(id); cancel(id); };
  });
  try {
    await page.goto(url);
    await page.locator('#segmented [data-checked="true"]').waitFor();
    await run(page);
    assert.deepEqual(errors, [], '组件不抛出运行时异常');
  } finally { await page.close(); }
}

async function configure(page: Page, props: Record<string, unknown>) {
  await page.evaluate(value => (window as any).controlsFixture.configure(value), props);
  await page.evaluate(() => (window as any).controlsFixture.flush());
}

async function aligned(page: Page, root: string, slider: string, selected: string, vertical = false) {
  await page.waitForFunction(({ root, slider, selected, vertical }) => {
    const container = document.querySelector(root)!;
    const a = container.querySelector(slider)!.getBoundingClientRect();
    const b = container.querySelector(selected)!.getBoundingClientRect();
    return Math.abs((vertical ? a.top : a.left) - (vertical ? b.top : b.left)) < 0.2
      && Math.abs((vertical ? a.height : a.width) - (vertical ? b.height : b.width)) < 0.2;
  }, { root, slider, selected, vertical });
}

it('Tabs 指示器与三种共享底板会运动，快速反向从当前画面衔接并停在最后选择', { skip: !browserAvailable }, async () => {
  await withControls(async (page) => {
    await aligned(page, '#tabs', '.fixture-indicator', '[data-tab-active="true"] [data-tab-title]');
    const initial = await page.locator('#tabs .fixture-indicator').evaluate(element => element.getBoundingClientRect().left);
    await configure(page, { key: 'c' });
    await page.waitForFunction(initial => document.querySelector('#tabs .fixture-indicator')!.getBoundingClientRect().left > initial + 2, initial);
    const redirect = await page.evaluate(async () => {
      const node = document.querySelector('#tabs .fixture-indicator')!;
      const from = node.getBoundingClientRect().left;
      (window as any).controlsFixture.configure({ key: 'a' });
      await (window as any).controlsFixture.flush();
      return { from, to: node.getBoundingClientRect().left };
    });
    assert.ok(Math.abs(redirect.from - redirect.to) < 1, '反向不跳回旧终点');
    await configure(page, { key: 'b' });
    await aligned(page, '#tabs', '.fixture-indicator', '[data-tab-active="true"] [data-tab-title]');
    for (const type of ['card', 'capsule']) {
      await configure(page, { type, key: 'a' });
      await aligned(page, '#tabs', '.fixture-slider', '[data-tab-active="true"]');
      const start = await page.locator('#tabs .fixture-slider').evaluate(element => element.getBoundingClientRect().left);
      await configure(page, { key: 'c' });
      await page.waitForFunction(start => {
        const current = document.querySelector('#tabs .fixture-slider')!.getBoundingClientRect();
        const target = document.querySelector('#tabs [data-tab-active="true"]')!.getBoundingClientRect();
        return current.left > start + 1 && Math.abs(current.left - target.left) > 1;
      }, start);
      await configure(page, { key: 'b' });
      await aligned(page, '#tabs', '.fixture-slider', '[data-tab-active="true"]');
    }
    await aligned(page, '#segmented', '.fixture-slider', '[data-checked="true"]');
    await aligned(page, '#radio', '[role="radiogroup"] > span[aria-hidden="true"]', '[data-checked="true"]');
    await configure(page, { direction: 'vertical', position: 'left', type: 'line', key: 'c' });
    await aligned(page, '#tabs', '.fixture-indicator', '[data-tab-active="true"] [data-tab-title]', true);
    await aligned(page, '#segmented', '.fixture-slider', '[data-checked="true"]', true);
    await aligned(page, '#radio', '[role="radiogroup"] > span[aria-hidden="true"]', '[data-checked="true"]', true);
  });
});

it('Tabs 高度动画结束释放裁剪，连续切换与隐藏销毁没有残余高度', { skip: !browserAvailable }, async () => {
  await withControls(async (page) => {
    await configure(page, { key: 'c' });
    await page.waitForFunction(() => document.querySelector<HTMLElement>('.fixture-stage')!.style.height !== '');
    await configure(page, { key: 'b' });
    await page.waitForFunction(() => document.querySelector<HTMLElement>('.fixture-stage')!.style.height === '');
    const height = await page.locator('.fixture-stage').evaluate(element => element.getBoundingClientRect().height);
    assert.ok(Math.abs(height - 160) < 1, '最终内容高度正确');
    assert.equal(await page.locator('.fixture-stage').evaluate(element => getComputedStyle(element).overflow), 'visible');
    await configure(page, { key: 'c' });
    await configure(page, { visible: false });
    assert.equal(await page.locator('main').count(), 0);
  });
});

it('Tabs 面板快速反向保持当前透明度与位置，取消过渡不会闪回不透明首帧', { skip: !browserAvailable }, async () => {
  await withControls(async (page) => {
    await configure(page, { key: 'b' });
    await page.waitForFunction(() => {
      const opacity = Number(getComputedStyle(document.querySelector('#tabs [role="tabpanel"]')!).opacity);
      return opacity > 0.1 && opacity < 0.9;
    });
    const frames = await page.evaluate(async () => {
      const panes = Array.from(document.querySelectorAll('#tabs [role="tabpanel"]')).slice(0, 2);
      const paint = { read() { return panes.map(element => ({ opacity: Number(getComputedStyle(element).opacity), matrix: new DOMMatrixReadOnly(getComputedStyle(element).transform) })).map(({ opacity, matrix }) => ({ opacity, y: matrix.m42, scale: matrix.m11 })); } };
      const before = paint.read();
      (window as any).controlsFixture.configure({ key: 'a' });
      await (window as any).controlsFixture.flush();
      const redirect = paint.read();
      await new Promise(requestAnimationFrame);
      return { before, redirect, next: paint.read() };
    });
    for (let index = 0; index < 2; index++) {
      assert.ok(Math.abs(frames.before[index]!.opacity - frames.redirect[index]!.opacity) < 0.02, '反向瞬间透明度连续');
      assert.ok(Math.abs(frames.before[index]!.y - frames.redirect[index]!.y) < 0.05, '反向瞬间位置连续');
      assert.ok(Math.abs(frames.before[index]!.scale - frames.redirect[index]!.scale) < 0.001, '反向瞬间缩放连续');
    }
    assert.ok(frames.next[0]!.opacity >= frames.redirect[0]!.opacity, '重返面板继续淡入');
    assert.ok(frames.next[1]!.opacity <= frames.redirect[1]!.opacity, '离开面板继续淡出');
  });
});

it('Switch 在三种形态与尺寸保持边界，快速切换连续，禁用不改变取值', { skip: !browserAvailable }, async () => {
  await withControls(async (page) => {
    for (const size of ['sm', 'md', 'lg']) {
      for (const switchType of ['circle', 'round', 'line']) {
        await configure(page, { size, switchType, checked: false });
        await configure(page, { checked: true });
        await page.waitForFunction(() => {
          const thumb = document.querySelector<HTMLElement>('.fixture-thumb')!;
          return thumb.style.left === '' && Math.abs(Number.parseFloat(getComputedStyle(thumb).right) - 2) < 0.1;
        });
        if (switchType === 'line') {
          const gap = await page.locator('.fixture-thumb').evaluate(element => {
            const thumb = element.getBoundingClientRect();
            const track = element.parentElement!.getBoundingClientRect();
            return Math.abs(thumb.top + thumb.height / 2 - track.top - track.height / 2);
          });
          assert.ok(gap < 0.1, '细线型滑块始终垂直居中');
        }
      }
    }
    await configure(page, { checked: false });
    await page.waitForFunction(() => Number.parseFloat(getComputedStyle(document.querySelector('.fixture-thumb')!).left) < 20);
    const redirect = await page.evaluate(async () => {
      const node = document.querySelector('.fixture-thumb')!;
      const from = node.getBoundingClientRect().left;
      (window as any).controlsFixture.configure({ checked: true });
      await (window as any).controlsFixture.flush();
      return { from, to: node.getBoundingClientRect().left };
    });
    assert.ok(Math.abs(redirect.from - redirect.to) < 1, '开关反向从当前边界继续');
    await configure(page, { disabled: true, checked: false });
    await page.locator('#switch label').click({ force: true });
    assert.equal(await page.locator('#switch input').isChecked(), false);
  });
});

it('数值计数存在中间帧，目标更新续接，系统减弱动态效果即时落位', { skip: !browserAvailable }, async () => {
  await withControls(async (page) => {
    await page.waitForFunction(() => Number(document.querySelector('#statistic')!.textContent) === 1000);
    await configure(page, { value: 3000, duration: 600 });
    await page.waitForFunction(() => {
      const value = Number(document.querySelector('#statistic')!.textContent);
      return value > 1000 && value < 3000;
    });
    const before = Number(await page.locator('#statistic').textContent());
    await configure(page, { value: -80.5 });
    const after = Number(await page.locator('#statistic').textContent());
    assert.ok(Math.abs(after - before) < 100, '更新目标不跳回零或前一个终点');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => Number(document.querySelector('#statistic')!.textContent) === -80.5);
    await configure(page, { key: 'c', checked: true, value: 2000 });
    await aligned(page, '#tabs', '.fixture-indicator', '[data-tab-active="true"] [data-tab-title]');
    await aligned(page, '#segmented', '.fixture-slider', '[data-checked="true"]');
    assert.equal(Number(await page.locator('#statistic').textContent()), 2000);
    assert.equal(await page.locator('.fixture-thumb').evaluate(element => Number.parseFloat(getComputedStyle(element).right)), 2);
  });
});

it('动画中途关闭系统动态效果立即终止面板、滑块与高度，初始减弱模式也直接呈现终点', { skip: !browserAvailable }, async () => {
  await withControls(async (page) => {
    await configure(page, { key: 'c', checked: true });
    await page.waitForFunction(() => document.querySelector<HTMLElement>('.fixture-stage')!.style.height !== '');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.querySelector<HTMLElement>('.fixture-thumb')!.style.left === ''
      && document.querySelector<HTMLElement>('.fixture-stage')!.style.height === ''
      && Array.from(document.querySelectorAll('#tabs [role="tabpanel"]')).every(element => !element.getAnimations().some(animation => animation.playState === 'running')),
    undefined, { timeout: 3000 }).catch(async () => {
      assert.fail(JSON.stringify(await page.evaluate(() => ({
        thumb: document.querySelector('.fixture-thumb')!.getAttribute('style'),
        stage: document.querySelector('.fixture-stage')!.getAttribute('style'),
        panes: Array.from(document.querySelectorAll('#tabs [role="tabpanel"]'), element => ({
          style: element.getAttribute('style'), animations: element.getAnimations().map(animation => animation.playState),
        })),
      }))));
    });
    await aligned(page, '#tabs', '.fixture-indicator', '[data-tab-active="true"] [data-tab-title]');
    await aligned(page, '#segmented', '.fixture-slider', '[data-checked="true"]');
    assert.equal(await page.locator('.fixture-thumb').evaluate(element => Number.parseFloat(getComputedStyle(element).right)), 2);
    await page.waitForFunction(() => (window as any).pendingMotionFrames.size === 0);
  });
  await withControls(async (page) => {
    assert.equal(Number(await page.locator('#statistic').textContent()), 1000);
    await configure(page, { key: 'c', checked: true });
    await aligned(page, '#tabs', '.fixture-indicator', '[data-tab-active="true"] [data-tab-title]');
    await aligned(page, '#segmented', '.fixture-slider', '[data-checked="true"]');
    await page.waitForFunction(() => (window as any).pendingMotionFrames.size === 0);
    assert.equal(await page.locator('.fixture-stage').evaluate(element => (element as HTMLElement).style.height), '');
  }, 'reduce');
});

it('滑块无选中项时隐藏，恢复后重新落位，动画中的组件卸载会停止所有后续帧', { skip: !browserAvailable }, async () => {
  await withControls(async (page) => {
    await configure(page, { key: 'c' });
    await configure(page, { key: 'missing' });
    assert.equal(await page.locator('#segmented .fixture-slider').evaluate(element => getComputedStyle(element).opacity), '0');
    assert.equal(await page.locator('#tabs .fixture-indicator').evaluate(element => getComputedStyle(element).opacity), '0');
    await configure(page, { key: 'b' });
    await aligned(page, '#segmented', '.fixture-slider', '[data-checked="true"]');
    await aligned(page, '#tabs', '.fixture-indicator', '[data-tab-active="true"] [data-tab-title]');
    await configure(page, { key: 'c', checked: true, value: 3000, duration: 1500 });
    await page.evaluate(() => (window as any).controlsFixture.stop());
    await page.waitForFunction(() => (window as any).pendingMotionFrames.size === 0);
    assert.equal(await page.locator('main').count(), 0);
  });
});
