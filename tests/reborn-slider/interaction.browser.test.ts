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
const browserAvailable = existsSync(executablePath);
let browser: Awaited<ReturnType<typeof chromium.launch>>;
let server: ReturnType<typeof createServer>;
let url = '';

/** 受控范围滑块、拒收更新的单值滑块、带 thumb 插槽的单值滑块 */
before(async () => {
  if (!browserAvailable) return;
  const result = await build({
    stdin: {
      contents: `
        import Slider from '~/components/reborn/ui/reborn-slider/RebornSlider.vue';
        import {createApp,h,nextTick,reactive} from 'vue';
        const state=reactive({nodes:[20,22],completes:[],locked:40,lockedChanges:[],custom:10,hoverValue:40,hoverNodes:[20,80],hoverProps:{},sizedDisabled:false});
        const customUi={thumb:'fixture-custom-sized h-5 w-[30px] rounded-full bg-warning',tooltip:'fixture-custom-tip'};
        const customSlots={thumb:({value,active,disabled})=>h('span',{class:['pointer-events-none text-sm text-white',{'opacity-60':disabled,'font-semibold':active}]},String(value)),
          value:({value})=>h('span',{class:'fixture-custom-value'},value+'%')};
        const app=createApp({render:()=>h('main',{style:'width:600px;padding:40px'},[
          h('section',{id:'range'},[h(Slider,{range:true,values:state.nodes,'onUpdate:values':v=>state.nodes=v,
            onChangeComplete:v=>state.completes.push(v)})]),
          h('section',{id:'locked'},[h(Slider,{modelValue:state.locked,'onUpdate:modelValue':()=>{},onChange:v=>state.lockedChanges.push(v)})]),
          h('section',{id:'custom'},[h(Slider,{modelValue:state.custom,'onUpdate:modelValue':v=>state.custom=v},
            {thumb:({value,index,active,disabled})=>h('span',{class:'fixture-thumb','data-meta':[value,index,active,disabled].join('|')},String(value))})]),
          h('section',{id:'hover',style:'margin-top:60px'},[h(Slider,{...state.hoverProps,modelValue:state.hoverValue,'onUpdate:modelValue':v=>state.hoverValue=v,ui:{thumb:'fixture-hover-thumb',tooltip:'fixture-hover-tip'}})]),
          h('section',{id:'hover-range',style:'margin-top:60px'},[h(Slider,{...state.hoverProps,range:true,values:state.hoverNodes,'onUpdate:values':v=>state.hoverNodes=v,ui:{thumb:'fixture-hover-thumb',tooltip:'fixture-hover-tip'}})]),
          h('section',{id:'custom-sized',style:'margin-top:60px'},[h(Slider,{...state.hoverProps,modelValue:state.custom,'onUpdate:modelValue':v=>state.custom=v,disabled:state.sizedDisabled,ui:customUi},customSlots)]),
          h('section',{id:'custom-sized-range',style:'margin-top:60px'},[h(Slider,{...state.hoverProps,range:true,values:state.hoverNodes,'onUpdate:values':v=>state.hoverNodes=v,disabled:state.sizedDisabled,ui:customUi},customSlots)]),
        ])});
        app.component('Icon',props=>h('svg',{'data-icon':props.name}));
        app.mount('#app');
        window.sliderFixture={state,flush:nextTick,configure:async props=>{Object.assign(state.hoverProps,props);await nextTick();}};
      `,
      resolveDir: resolve('.'), loader: 'ts', sourcefile: 'slider-interaction-fixture.ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false, alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'slider-interaction', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        const contents = compileScript(descriptor, {
          id: path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        }).content;
        return { contents, loader: 'ts' };
      });
    } }],
  });
  const compiler = await compile(`@import 'tailwindcss';@import './app/assets/theme/typography.css';@import './app/assets/theme/base.css';`, { base: resolve('.'), onDependency() {} });
  const scanner = new Scanner({ sources: [{ base: resolve('app/components/reborn/ui/reborn-slider'), pattern: '**/*', negated: false }] });
  const css = compiler.build([...scanner.scan(), 'h-5', 'w-[30px]', 'bg-warning', 'text-white', 'font-semibold', 'opacity-60']);
  const script = result.outputFiles[0]!.text;
  server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : request.url === '/style.css' ? 'text/css' : 'text/html');
    response.end(request.url === '/app.js' ? script : request.url === '/style.css' ? css : '<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body><div id="app"></div><script type="module" src="/app.js"></script></body></html>');
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

async function withSliders(run: (page: Page) => Promise<void>) {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(url);
    await page.locator('#range [tabindex="0"]').first().waitFor();
    await run(page);
    assert.deepEqual(errors, [], '组件不抛出运行时异常');
  } finally { await page.close(); }
}

function fixtureState(page: Page): Promise<{ nodes: number[]; completes: number[][]; locked: number; lockedChanges: number[]; custom: number }> {
  return page.evaluate(() => JSON.parse(JSON.stringify((window as any).sliderFixture.state)));
}

it('范围模式用方向键推过相邻节点后，焦点跟到新下标，继续按键移动的仍是同一个滑块', { skip: !browserAvailable }, async () => {
  await withSliders(async (page) => {
    const thumbs = page.locator('#range [tabindex="0"]');
    await thumbs.nth(0).focus();
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
    // 20 → 23 越过 22，换位后为 [22, 23]
    assert.deepEqual((await fixtureState(page)).nodes, [22, 23]);
    const focusedIndex = await page.evaluate(() => {
      const list = [...document.querySelectorAll('#range [tabindex="0"]')];
      return list.indexOf(document.activeElement as Element);
    });
    assert.equal(focusedIndex, 1, '焦点跟到被移动滑块的新下标');
    await page.keyboard.press('ArrowRight');
    assert.deepEqual((await fixtureState(page)).nodes, [22, 24], '继续移动的是同一个滑块，而不是被越过的邻居');
  });
});

it('松手时先冲刷合帧移动，changeComplete 的载荷是最终值', { skip: !browserAvailable }, async () => {
  await withSliders(async (page) => {
    const track = (await page.locator('#range [class*="rounded-full"][class*="bg-gray-4"]').first().boundingBox())!;
    const thumb = (await page.locator('#range [tabindex="0"]').nth(1).boundingBox())!;
    await page.mouse.move(thumb.x + thumb.width / 2, thumb.y + thumb.height / 2);
    await page.mouse.down();
    // 同一帧内移动后立刻松手：最后一次移动还在合帧队列里，由 pointerup 冲刷
    await page.evaluate(({ x, y }) => {
      const inner = document.querySelector('#range [tabindex="0"]')!.parentElement!;
      inner.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: x, clientY: y, pointerId: 1 }));
      inner.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x, clientY: y, pointerId: 1 }));
    }, { x: track.x + track.width * 0.8, y: track.y + track.height / 2 });
    await page.mouse.up();
    const state = await fixtureState(page);
    assert.ok(state.nodes[1]! >= 75 && state.nodes[1]! <= 85, `拖到 80% 附近：${JSON.stringify(state.nodes)}`);
    assert.deepEqual(state.completes.at(-1), state.nodes, 'changeComplete 与最终绑定值一致，不是提交前的旧值');
  });
});

it('受控绑定被父级拒收时，显示停在父级的值，不与绑定值分叉', { skip: !browserAvailable }, async () => {
  await withSliders(async (page) => {
    const thumb = page.locator('#locked [tabindex="0"]');
    const before = (await thumb.boundingBox())!;
    await thumb.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    const state = await fixtureState(page);
    assert.deepEqual(state.lockedChanges, [41, 41], '每次都基于父级的 40 计算，change 照常发出');
    const after = (await thumb.boundingBox())!;
    assert.ok(Math.abs(after.x + after.width / 2 - before.x - before.width / 2) < 0.01, '滑块中心位置不动');
  });
});

it('thumb 插槽只替换中心圆，外层滑块仍可聚焦并响应方向键', { skip: !browserAvailable }, async () => {
  await withSliders(async (page) => {
    const custom = page.locator('#custom .fixture-thumb');
    assert.equal(await custom.getAttribute('data-meta'), '10|0|true|false');
    const host = page.locator('#custom [tabindex="0"]');
    assert.equal(await host.locator('.fixture-thumb').count(), 1, '插槽内容渲染在可聚焦的滑块节点内');
    await host.focus();
    await page.keyboard.press('ArrowRight');
    assert.equal((await fixtureState(page)).custom, 11);
    assert.equal(await custom.getAttribute('data-meta'), '11|0|true|false');
  });
});

it('悬停单个滑块立即显示当前值，放大和圆环不改变布局，拖出滑块仍保持拖拽反馈', { skip: !browserAvailable }, async () => {
  await withSliders(async (page) => {
    const thumb = page.locator('#hover .fixture-hover-thumb');
    const tip = page.locator('#hover .fixture-hover-tip');
    const initial = (await thumb.boundingBox())!;
    const wrapper = await page.locator('#hover').boundingBox();
    assert.equal(initial.width, 12);
    assert.equal(initial.height, 12);
    assert.equal(await tip.count(), 0);
    await thumb.hover();
    await tip.waitFor();
    assert.equal(await thumb.evaluate(el => getComputedStyle(el).width), '12px', '悬停只缩放，不改写基础宽度');
    await page.waitForFunction(() => Math.abs(document.querySelector('#hover .fixture-hover-thumb')!.getBoundingClientRect().width - 16) < 0.01);
    assert.equal(await tip.textContent(), '40');
    const ring = await thumb.evaluate(el => {
      const style = getComputedStyle(el);
      const probe = document.createElement('span');
      el.append(probe);
      probe.style.color = style.getPropertyValue('--tw-ring-color');
      const actual = getComputedStyle(probe).color;
      probe.style.color = 'color-mix(in oklab, var(--color-brand-6) 20%, transparent)';
      const expected = getComputedStyle(probe).color;
      probe.remove();
      return { shadow: style.getPropertyValue('--tw-ring-shadow'), actual, expected };
    });
    assert.ok(ring.shadow.includes('4px'));
    assert.equal(ring.actual, ring.expected);
    assert.deepEqual(await page.locator('#hover').boundingBox(), wrapper);
    await page.mouse.down();
    await page.mouse.move(700, 500);
    assert.equal(await tip.count(), 1, '指针捕获转到交互带后气泡仍显示');
    assert.ok(Math.abs((await thumb.boundingBox())!.width - 16) < 0.01);
    await page.mouse.up();
    await page.mouse.move(0, 0);
    await page.waitForFunction(() => !document.querySelector('#hover .fixture-hover-tip'));
    await page.waitForFunction(() => document.querySelector('#hover .fixture-hover-thumb')!.getBoundingClientRect().width === 12);
  });
});

it('自定义胶囊滑块在单值和范围模式等比放大，按压与禁用均保留自定义宽高', { skip: !browserAvailable }, async () => {
  await withSliders(async (page) => {
    for (const id of ['custom-sized', 'custom-sized-range']) {
      const thumb = page.locator(`#${id} .fixture-custom-sized`).first();
      const dimensions = () => thumb.evaluate(el => {
        const style = getComputedStyle(el);
        return { width: style.width, height: style.height };
      });
      assert.deepEqual(await dimensions(), { width: '30px', height: '20px' });
      await thumb.hover();
      await page.waitForFunction(selector => Math.abs(document.querySelector(selector)!.getBoundingClientRect().width - 40) < 0.01, `#${id} .fixture-custom-sized`);
      assert.deepEqual(await dimensions(), { width: '30px', height: '20px' });
      const box = (await thumb.boundingBox())!;
      assert.ok(Math.abs(box.width / box.height - 1.5) < 0.01, '胶囊长宽比不变');
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height + 40);
      assert.deepEqual(await dimensions(), { width: '30px', height: '20px' }, '拖拽也不改写自定义尺寸');
      assert.ok(Math.abs((await thumb.boundingBox())!.width - 40) < 0.01);
      assert.equal(await page.locator(`#${id} .fixture-custom-tip`).count(), 1);
      await page.mouse.up();
      await page.mouse.move(0, 0);
    }
    await page.evaluate(() => { (window as any).sliderFixture.state.sizedDisabled = true; });
    const disabledThumb = page.locator('#custom-sized .fixture-custom-sized');
    await disabledThumb.hover();
    await page.waitForFunction(() => document.querySelector('#custom-sized .fixture-custom-sized')!.getBoundingClientRect().width === 30);
    assert.equal(await disabledThumb.evaluate(el => getComputedStyle(el).height), '20px');
    assert.equal(await page.locator('#custom-sized .fixture-custom-tip').count(), 0);
    assert.equal(await page.locator('#custom-sized .fixture-custom-value').textContent(), `${(await fixtureState(page)).custom}%`);
  });
});

it('滑块圆环取对应色板第六阶的 20% 透明色，数值气泡保持灰色与 80% 不透明度', { skip: !browserAvailable }, async () => {
  await withSliders(async (page) => {
    const palettes = { primary: 'brand', secondary: 'secondary', success: 'green', info: 'blue', warning: 'orange', error: 'red', neutral: 'gray' };
    for (const [color, palette] of Object.entries(palettes)) {
      for (const vertical of [false, true]) {
        await page.evaluate(props => (window as any).sliderFixture.configure(props), { color, vertical, tooltip: { open: true } });
        const colors = await page.locator('#hover .fixture-hover-tip').evaluate((el, { palette, vertical }) => {
          const style = getComputedStyle(el);
          const probe = document.createElement('span');
          el.append(probe);
          probe.style.color = getComputedStyle(el.parentElement!.querySelector('.fixture-hover-thumb')!).getPropertyValue('--tw-ring-color');
          const ringActual = getComputedStyle(probe).color;
          probe.style.color = `color-mix(in oklab, var(--color-${palette}-6) 20%, transparent)`;
          const ringExpected = getComputedStyle(probe).color;
          probe.style.color = 'var(--color-gray-9)';
          const expected = getComputedStyle(probe).color;
          probe.remove();
          const arrow = getComputedStyle(el, '::after');
          return { background: style.backgroundColor, opacity: style.opacity, arrow: vertical ? arrow.borderRightColor : arrow.borderTopColor, expected, ringActual, ringExpected };
        }, { palette, vertical });
        assert.equal(colors.ringActual, colors.ringExpected);
        assert.equal(colors.opacity, '0.8');
        assert.equal(colors.background, colors.expected);
        assert.equal(colors.arrow, colors.expected);
      }
    }
  });
});

it('范围滑块分别显示悬停值，显式隐藏和禁用优先于悬停', { skip: !browserAvailable }, async () => {
  await withSliders(async (page) => {
    const thumbs = page.locator('#hover-range .fixture-hover-thumb');
    const tips = page.locator('#hover-range .fixture-hover-tip');
    await thumbs.nth(0).hover();
    await tips.waitFor();
    assert.equal(await tips.textContent(), '20');
    await thumbs.nth(1).hover();
    assert.equal(await tips.count(), 1);
    assert.equal(await tips.textContent(), '80');
    assert.deepEqual(await page.evaluate(() => [...(window as any).sliderFixture.state.hoverNodes]), [20, 80]);
    await page.evaluate(() => (window as any).sliderFixture.configure({ tooltip: { open: false } }));
    assert.equal(await tips.count(), 0);
    await page.evaluate(() => (window as any).sliderFixture.configure({ tooltip: { formatter: null } }));
    assert.equal(await tips.count(), 0);
    await page.evaluate(() => (window as any).sliderFixture.configure({ tooltip: undefined, disabled: [true, false] }));
    await thumbs.nth(0).hover();
    assert.equal(await tips.count(), 0);
    await page.waitForFunction(() => document.querySelector('#hover-range .fixture-hover-thumb')!.getBoundingClientRect().width === 12);
    await thumbs.nth(1).hover();
    await tips.waitFor();
    assert.equal(await tips.textContent(), '80');
  });
});

it('数值气泡与箭头在水平、垂直及放大状态下无接缝色差', { skip: !browserAvailable }, async () => {
  await withSliders(async (page) => {
    for (const vertical of [false, true]) {
      for (const hovered of [false, true]) {
        await page.mouse.move(0, 0);
        await page.evaluate(props => (window as any).sliderFixture.configure(props), { vertical, tooltip: { open: true } });
        const thumb = page.locator('#hover .fixture-hover-thumb');
        const tip = page.locator('#hover .fixture-hover-tip');
        if (hovered) await thumb.hover();
        await page.waitForFunction(width => Math.abs(document.querySelector('#hover .fixture-hover-thumb')!.getBoundingClientRect().width - width) < 0.01, hovered ? 16 : 12);
        await tip.scrollIntoViewIfNeeded();
        const box = (await tip.boundingBox())!;
        const points = [-3, -2, -1, 0, 1].map(offset => vertical
          ? { x: box.x - offset, y: box.y + box.height / 2 }
          : { x: box.x + box.width / 2, y: box.y + box.height + offset });
        const screenshot = await page.screenshot();
        const colors = await page.evaluate(async ({ url, points }) => {
          const image = new Image();
          image.src = url;
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext('2d')!;
          context.drawImage(image, 0, 0);
          return points.map(point => Array.from(context.getImageData(Math.round(point.x), Math.round(point.y), 1, 1).data));
        }, { url: `data:image/png;base64,${screenshot.toString('base64')}`, points });
        for (const color of colors) {
          assert.ok(color.every((channel, i) => Math.abs(channel - colors[0]![i]!) <= 2),
            `${vertical ? '垂直' : '水平'} / ${hovered ? '放大' : '静止'}：接缝应与主体同色，实际 ${JSON.stringify(colors)}`);
        }
      }
    }
  });
});

it('滑块悬停、拖拽与键盘聚焦时，气泡保持原尺寸并对准滑块中心', { skip: !browserAvailable }, async () => {
  await withSliders(async (page) => {
    for (const vertical of [false, true]) {
      await page.evaluate(props => (window as any).sliderFixture.configure(props), { vertical, tooltip: { open: true } });
      for (const id of ['hover', 'hover-range', 'custom-sized', 'custom-sized-range']) {
        await page.mouse.move(0, 0);
        await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); });
        const custom = id.startsWith('custom');
        const selector = `#${id} .${custom ? 'fixture-custom-sized' : 'fixture-hover-thumb'}`;
        const thumb = page.locator(selector).first();
        const tip = page.locator(`#${id} .${custom ? 'fixture-custom-tip' : 'fixture-hover-tip'}`).first();
        await tip.scrollIntoViewIfNeeded();
        await page.waitForFunction(({ selector, width }) =>
          Math.abs(document.querySelector(selector)!.getBoundingClientRect().width - width) < 0.01,
        { selector, width: custom ? 30 : 12 });
        const initial = (await tip.boundingBox())!;
        const restingHandle = (await thumb.boundingBox())!;
        const restingGap = vertical ? initial.x - 3 - restingHandle.x - restingHandle.width : restingHandle.y - initial.y - initial.height - 3;
        assert.ok(restingGap > 2 && restingGap <= 4, `${id}：常显气泡未交互时应贴近滑块，实际间距 ${restingGap}px`);
        const checkBorder = async (expected: number) => {
          if (custom) return;
          const border = await thumb.evaluate(el => {
            const outer = el.getBoundingClientRect();
            const inner = el.firstElementChild!.getBoundingClientRect();
            return { horizontal: (outer.width - inner.width) / 2, vertical: (outer.height - inner.height) / 2 };
          });
          assert.ok(Math.abs(border.horizontal - expected) < 0.05 && Math.abs(border.vertical - expected) < 0.05,
            `滑块本体彩色边框应为 ${expected}px，实际 ${JSON.stringify(border)}`);
        };
        await checkBorder(2);
        const checkTooltip = async () => {
          const box = (await tip.boundingBox())!;
          const handle = (await thumb.boundingBox())!;
          assert.ok(Math.abs(box.width - initial.width) < 0.01 && Math.abs(box.height - initial.height) < 0.01,
            `${id} / ${vertical ? '垂直' : '水平'}：滑块放大不能改变气泡尺寸`);
          const alignment = vertical ? box.y + box.height / 2 - handle.y - handle.height / 2 : box.x + box.width / 2 - handle.x - handle.width / 2;
          assert.ok(Math.abs(alignment) < 0.1, '气泡始终对准滑块中心');
          // 圆环随本体缩放，箭头在主体外伸出 3px，二者之间也应保留空隙。
          const gap = vertical ? box.x - 3 - handle.x - handle.width - 4 * 4 / 3 : handle.y - 4 * 4 / 3 - box.y - box.height - 3;
          assert.ok(gap > 2, '气泡箭头不能与放大后的滑块圆环重叠');
          await checkBorder(3);
        };
        const waitForScale = () => page.waitForFunction(({ selector, width }) =>
          Math.abs(document.querySelector(selector)!.getBoundingClientRect().width - width) < 0.01,
        { selector, width: custom ? 40 : 16 });
        await thumb.hover();
        await waitForScale();
        await checkTooltip();
        const handle = (await thumb.boundingBox())!;
        await page.mouse.down();
        await page.mouse.move(handle.x + handle.width / 2 + (vertical ? 40 : 0), handle.y + handle.height / 2 + (vertical ? 0 : 40));
        await checkTooltip();
        await page.mouse.up();
        await page.mouse.move(0, 0);
        await page.keyboard.press('Tab');
        await thumb.focus();
        await waitForScale();
        await checkTooltip();
      }
    }
  });
});
