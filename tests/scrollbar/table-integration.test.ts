import type { Component } from 'vue';
/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rmdir, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { after, afterEach, before, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

interface ScrollOptions { animated?: boolean; duration?: number; silent?: boolean }
interface ScrollbarApi {
  update: () => void;
  refresh: () => void;
  scrollTo: (position: { top?: number; left?: number }, options?: ScrollOptions) => Promise<void>;
  setScrollTop: (value: number, options?: ScrollOptions) => Promise<void>;
  setScrollLeft: (value: number, options?: ScrollOptions) => Promise<void>;
  stopScroll: () => void;
}

const dom = new JSDOM('<div id="app"></div>');
const previous = new Map<string, PropertyDescriptor | undefined>();
const frames = new Map<number, FrameRequestCallback>();
let time = 0;
let frameId = 0;
let reducedMotion = false;
let folder: string;
let output: string;
let vue: typeof import('vue');
let Scrollbar: Component;
let unmount: (() => void) | undefined;

before(async () => {
  // 只替代浏览器布局和时钟，组件、Vue 响应式、DOM 事件均使用真实实现。
  const globals = {
    window: dom.window, document: dom.window.document, Element: dom.window.Element,
    HTMLElement: dom.window.HTMLElement, SVGElement: dom.window.SVGElement,
    performance: { now: () => time },
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      frames.set(++frameId, callback);
      return frameId;
    },
    cancelAnimationFrame: (id: number) => frames.delete(id),
  };
  for (const [key, value] of Object.entries(globals)) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
  }
  Object.defineProperty(dom.window, 'matchMedia', {
    value: (query: string) => ({ matches: query === '(prefers-reduced-motion: reduce)' && reducedMotion }),
  });
  folder = await mkdtemp(resolve('tests/scrollbar/.runtime-'));
  output = resolve(folder, 'scrollbar.mjs');
  await build({
    entryPoints: [resolve('app/components/reborn/ui/scrollbar/RebornScrollbar.vue')],
    outfile: output, bundle: true, format: 'esm', platform: 'node', packages: 'external',
    alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'scrollbar-integration', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        return { contents: compileScript(descriptor, { id: 'scrollbar-integration', inlineTemplate: true }).content, loader: 'ts' };
      });
    } }],
  });
  // Vue 初始化时缓存 document，必须在 jsdom globals 就绪后导入。
  vue = await import('vue');
  Scrollbar = (await import(pathToFileURL(output).href)).default;
});

afterEach(() => {
  unmount?.();
  unmount = undefined;
  frames.clear();
  time = 0;
  reducedMotion = false;
});

after(async () => {
  dom.window.close();
  for (const [key, descriptor] of previous) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
  if (output) await unlink(output).catch(() => {});
  if (folder) await rmdir(folder);
});

async function mount(props: Record<string, unknown> = {}) {
  const state = vue.reactive({ inset: 10, ...props });
  const instance = vue.ref<ScrollbarApi>();
  const events: { scrollTop: number; scrollLeft: number }[] = [];
  const app = vue.createApp({ render: () => vue.h(Scrollbar, {
    ...state, ref: instance, onScroll: (event: typeof events[number]) => events.push(event),
  }, () => vue.h('div', '固定头部与可滚动表体')) });
  app.mount(dom.window.document.querySelector('#app')!);
  unmount = () => app.unmount();
  const root = dom.window.document.querySelector<HTMLElement>('.reborn-scrollbar')!;
  const wrap = root.querySelector<HTMLElement>('.reborn-scrollbar__wrap')!;
  const yTrack = root.querySelector<HTMLElement>('.reborn-scrollbar__bar--vertical')!;
  const xTrack = root.querySelector<HTMLElement>('.reborn-scrollbar__bar--horizontal')!;
  const yThumb = yTrack.firstElementChild as HTMLElement;
  const xThumb = xTrack.firstElementChild as HTMLElement;
  const dimensions = { clientHeight: 240, scrollHeight: 840, clientWidth: 400, scrollWidth: 1000 };
  for (const key of Object.keys(dimensions) as (keyof typeof dimensions)[]) {
    Object.defineProperty(wrap, key, { get: () => dimensions[key] });
  }
  // jsdom 不布局，按已有 CSS 的上下内缩及组件动态样式还原轨道盒子。
  const inset = () => Number.parseFloat(root.style.getPropertyValue('--reborn-scrollbar-inset'));
  const yTop = () => Number.parseFloat(yTrack.style.top || `${inset()}`);
  const yLength = () => Number.parseFloat(yTrack.style.height || `${Math.max(dimensions.clientHeight - yTop() - inset(), 0)}`);
  yTrack.getBoundingClientRect = () => rect(390, 100 + yTop(), 6, yLength());
  xTrack.getBoundingClientRect = () => rect(50 + inset(), 330, dimensions.clientWidth - 2 * inset(), 6);
  const api = instance.value!;
  api.refresh();
  await vue.nextTick();
  async function scrollEvent() {
    wrap.dispatchEvent(new dom.window.Event('scroll'));
    await vue.nextTick();
  }
  return { api, root, wrap, state, dimensions, yTrack, xTrack, yThumb, xThumb, yTop, yLength, events, scrollEvent };
}

async function advance(ms: number) {
  time += ms;
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(time);
  await vue.nextTick();
}

function mouse(target: EventTarget, type: string, x: number, y: number) {
  target.dispatchEvent(new dom.window.MouseEvent(type, { bubbles: true, clientX: x, clientY: y }));
}

function rect(x: number, y: number, width: number, height: number): DOMRect {
  return { x, y, width, height, top: y, left: x, right: x + width, bottom: y + height, toJSON: () => ({ x, y, width, height }) };
}

function closeTo(actual: number, expected: number) {
  assert.ok(Math.abs(actual - expected) < 0.00001, `${actual} 应接近 ${expected}`);
}

it('默认及显式零 offset 保留原轨道、thumb 比例与双轴末端几何', async () => {
  const f = await mount();
  assert.equal(f.yTrack.style.top, '');
  assert.equal(f.yTrack.style.height, '');
  assert.equal(f.yTop(), 10);
  assert.equal(f.yLength(), 220);
  closeTo(Number.parseFloat(f.yThumb.style.height), 62.857142857);
  assert.equal(f.xThumb.style.width, '152px');
  f.wrap.scrollTop = 600;
  f.wrap.scrollLeft = 600;
  await f.scrollEvent();
  closeTo(Number.parseFloat(f.yThumb.style.transform.slice(11)), 157.142857143);
  assert.equal(f.xThumb.style.transform, 'translateX(228px)');
  Object.assign(f.state, { verticalOffset: 0 });
  await vue.nextTick();
  assert.equal(f.yLength(), 220);
  assert.equal(f.yTrack.style.top, '');
  assert.equal(f.yTrack.style.height, '');
});

it('固定头部只缩短纵向轨道与表体比例，offset 动态切换自动刷新', async () => {
  const f = await mount({ verticalOffset: 40 });
  assert.equal(f.yTop(), 50);
  assert.equal(f.yLength(), 180);
  assert.equal(f.yThumb.style.height, '45px');
  f.wrap.scrollTop = 300;
  await f.scrollEvent();
  assert.equal(f.yThumb.style.transform, 'translateY(67.5px)');
  assert.equal(f.xThumb.style.width, '152px');
  Object.assign(f.state, { verticalOffset: 80 });
  await vue.nextTick();
  assert.equal(f.yTop(), 90);
  assert.equal(f.yLength(), 140);
  closeTo(Number.parseFloat(f.yThumb.style.height), 29.473684211);
  Object.assign(f.state, { verticalOffset: 0 });
  await vue.nextTick();
  assert.equal(f.yLength(), 220);
  assert.equal(f.wrap.scrollTop, 300);
  assert.equal(f.xThumb.style.width, '152px');
});

it('offset 下拖拽的中间位置、上下两端和越界夹紧与 thumb 一致', async () => {
  const f = await mount({ verticalOffset: 40 });
  mouse(f.yThumb, 'mousedown', 390, 170);
  mouse(dom.window.document, 'mousemove', 390, 215);
  closeTo(f.wrap.scrollTop, 200);
  await f.scrollEvent();
  assert.equal(f.yThumb.style.transform, 'translateY(45px)');
  mouse(dom.window.document, 'mousemove', 390, 305);
  closeTo(f.wrap.scrollTop, 600);
  mouse(dom.window.document, 'mousemove', 390, 500);
  assert.equal(f.wrap.scrollTop, 600);
  mouse(dom.window.document, 'mousemove', 390, 0);
  assert.equal(f.wrap.scrollTop, 0);
  mouse(dom.window.document, 'mouseup', 390, 0);
});

it('offset 下点击轨道中点与上下两端使用表体轨道坐标', async () => {
  const f = await mount({ verticalOffset: 40 });
  mouse(f.yTrack, 'mousedown', 390, 240);
  closeTo(f.wrap.scrollTop, 300);
  mouse(f.yTrack, 'mousedown', 390, 330);
  assert.equal(f.wrap.scrollTop, 600);
  await f.scrollEvent();
  assert.equal(f.yThumb.style.transform, 'translateY(135px)');
  mouse(f.yTrack, 'mousedown', 390, 150);
  assert.equal(f.wrap.scrollTop, 0);
});

it('纵向 offset 不改变横向拖拽及左右端点点击', async () => {
  const f = await mount({ verticalOffset: 40 });
  mouse(f.xThumb, 'mousedown', 60, 330);
  mouse(dom.window.document, 'mousemove', 174, 330);
  assert.equal(f.wrap.scrollLeft, 300);
  mouse(dom.window.document, 'mousemove', 288, 330);
  assert.equal(f.wrap.scrollLeft, 600);
  mouse(dom.window.document, 'mouseup', 288, 330);
  mouse(f.xTrack, 'mousedown', 60, 330);
  assert.equal(f.wrap.scrollLeft, 0);
  mouse(f.xTrack, 'mousedown', 440, 330);
  assert.equal(f.wrap.scrollLeft, 600);
  assert.equal(f.wrap.scrollTop, 0);
});

for (const scale of [0.5, 2]) {
  for (const verticalOffset of [0, 40]) {
    it(`祖先缩放 ${scale}、offset ${verticalOffset} 时点击两轴轨道中点及端点准确`, async () => {
      const f = await mount({ verticalOffset });
      // 模拟 CSS 缩放后的视口盒子，布局尺寸仍保持原值。
      f.yTrack.getBoundingClientRect = () => rect(390, 100 + f.yTop() * scale, 6 * scale, f.yLength() * scale);
      f.xTrack.getBoundingClientRect = () => rect(50 + 10 * scale, 330, 380 * scale, 6 * scale);
      const y = f.yTrack.getBoundingClientRect();
      const x = f.xTrack.getBoundingClientRect();
      mouse(f.yTrack, 'mousedown', 390, y.bottom);
      closeTo(f.wrap.scrollTop, 600);
      mouse(f.yTrack, 'mousedown', 390, y.top + y.height / 2);
      closeTo(f.wrap.scrollTop, 300);
      mouse(f.yTrack, 'mousedown', 390, y.top);
      assert.equal(f.wrap.scrollTop, 0);
      mouse(f.xTrack, 'mousedown', x.right, 330);
      closeTo(f.wrap.scrollLeft, 600);
      mouse(f.xTrack, 'mousedown', x.left + x.width / 2, 330);
      closeTo(f.wrap.scrollLeft, 300);
      mouse(f.xTrack, 'mousedown', x.left, 330);
      assert.equal(f.wrap.scrollLeft, 0);
    });

    it(`祖先缩放 ${scale}、offset ${verticalOffset} 时两轴拖拽按实际可见行程移动`, async () => {
      const f = await mount({ verticalOffset });
      f.yTrack.getBoundingClientRect = () => rect(390, 100 + f.yTop() * scale, 6 * scale, f.yLength() * scale);
      f.xTrack.getBoundingClientRect = () => rect(50 + 10 * scale, 330, 380 * scale, 6 * scale);
      mouse(f.yThumb, 'mousedown', 390, 100);
      mouse(dom.window.document, 'mousemove', 390, 100 + 54 * scale);
      closeTo(f.wrap.scrollTop, verticalOffset === 40 ? 240 : 206.181818182);
      // jsdom 的鼠标坐标取整，向上取整确保覆盖轨道末端。
      const yTravel = verticalOffset === 40 ? 135 : 157.142857143;
      mouse(dom.window.document, 'mousemove', 390, Math.ceil(100 + yTravel * scale));
      assert.equal(f.wrap.scrollTop, 600);
      mouse(dom.window.document, 'mousemove', 390, 100);
      assert.equal(f.wrap.scrollTop, 0);
      mouse(dom.window.document, 'mouseup', 390, 100);
      mouse(f.xThumb, 'mousedown', 50, 330);
      mouse(dom.window.document, 'mousemove', 50 + 76 * scale, 330);
      closeTo(f.wrap.scrollLeft, 200);
      mouse(dom.window.document, 'mousemove', 50 + 228 * scale, 330);
      closeTo(f.wrap.scrollLeft, 600);
      mouse(dom.window.document, 'mousemove', 50, 330);
      assert.equal(f.wrap.scrollLeft, 0);
      mouse(dom.window.document, 'mouseup', 50, 330);
    });
  }
}

it('过大、负数、非有限 offset 与极小视窗不会产生负长度或无效滚动', async () => {
  const f = await mount({ verticalOffset: 999 });
  assert.equal(f.yLength(), 0);
  assert.equal(f.yThumb.style.height, '0px');
  mouse(f.yThumb, 'mousedown', 390, 100);
  mouse(dom.window.document, 'mousemove', 390, 300);
  mouse(dom.window.document, 'mouseup', 390, 300);
  mouse(f.yTrack, 'mousedown', 390, 300);
  assert.equal(f.wrap.scrollTop, 0);
  for (const verticalOffset of [-40, Number.NaN, Number.POSITIVE_INFINITY]) {
    Object.assign(f.state, { verticalOffset });
    await vue.nextTick();
    assert.equal(f.yTop(), 10);
    assert.equal(f.yLength(), 220);
  }
  f.dimensions.clientHeight = 8;
  Object.assign(f.state, { verticalOffset: 40 });
  await vue.nextTick();
  assert.equal(f.yLength(), 0);
  assert.equal(f.yThumb.style.height, '0px');
  assert.equal(f.yThumb.style.transform, 'translateY(0px)');
});

it('双轴 scrollTo 共用动画进度，中间帧与终值都到达且 Promise 按时结束', { timeout: 2000 }, async () => {
  const f = await mount();
  assert.equal(typeof f.api.scrollTo, 'function');
  f.wrap.scrollTop = 600;
  f.wrap.scrollLeft = 400;
  let finished = false;
  const task = f.api.scrollTo({ top: 0, left: 0 }, { animated: true }).then(() => { finished = true; });
  assert.deepEqual([f.wrap.scrollTop, f.wrap.scrollLeft], [600, 400]);
  await advance(100);
  assert.deepEqual([f.wrap.scrollTop, f.wrap.scrollLeft], [562.5, 375]);
  assert.equal(finished, false);
  await advance(100);
  assert.deepEqual([f.wrap.scrollTop, f.wrap.scrollLeft], [300, 200]);
  await advance(200);
  await task;
  assert.equal(finished, true);
  assert.deepEqual([f.wrap.scrollTop, f.wrap.scrollLeft], [0, 0]);
});

it('立即双轴定位夹紧目标；仅指定一轴或空目标不会改写另一轴', async () => {
  const f = await mount();
  assert.equal(typeof f.api.scrollTo, 'function');
  await f.api.scrollTo({ top: 900, left: -20 }, { animated: false });
  assert.deepEqual([f.wrap.scrollTop, f.wrap.scrollLeft], [600, 0]);
  await f.api.scrollTo({ left: 200 }, { duration: 0 });
  assert.deepEqual([f.wrap.scrollTop, f.wrap.scrollLeft], [600, 200]);
  await f.api.scrollTo({});
  await f.api.scrollTo({ top: 600, left: 200 });
  assert.deepEqual([f.wrap.scrollTop, f.wrap.scrollLeft], [600, 200]);
});

it('单轴动画不覆盖未指定轴的外部位置变化，旧 setter 默认仍使用动画', { timeout: 2000 }, async () => {
  const f = await mount();
  const topTask = f.api.setScrollTop(400);
  await advance(200);
  assert.equal(f.wrap.scrollTop, 200);
  f.wrap.scrollLeft = 73;
  await advance(200);
  await topTask;
  assert.deepEqual([f.wrap.scrollTop, f.wrap.scrollLeft], [400, 73]);
  const leftTask = f.api.setScrollLeft(273, { duration: 200 });
  await advance(100);
  assert.equal(f.wrap.scrollLeft, 173);
  await advance(100);
  await leftTask;
  assert.deepEqual([f.wrap.scrollTop, f.wrap.scrollLeft], [400, 273]);
});

for (const action of ['stop', 'wheel', 'touch', 'drag', 'track', 'unmount'] as const) {
  it(`双轴动画被 ${action} 取消后两轴停止且 Promise 结束`, { timeout: 2000 }, async () => {
    const f = await mount();
    assert.equal(typeof f.api.scrollTo, 'function');
    const task = f.api.scrollTo({ top: 600, left: 400 });
    await advance(200);
    if (action === 'stop') f.api.stopScroll();
    if (action === 'wheel') f.wrap.dispatchEvent(new dom.window.Event('wheel'));
    if (action === 'touch') f.wrap.dispatchEvent(new dom.window.Event('touchstart'));
    if (action === 'drag') mouse(f.yThumb, 'mousedown', 390, 200);
    if (action === 'track') mouse(f.yTrack, 'mousedown', 390, 200);
    if (action === 'unmount') { unmount?.(); unmount = undefined; }
    await task;
    const stopped = [f.wrap.scrollTop, f.wrap.scrollLeft];
    await advance(400);
    assert.deepEqual([f.wrap.scrollTop, f.wrap.scrollLeft], stopped);
  });
}

it('新请求取消旧双轴动画并结束旧 Promise，不残留另一轴动画', { timeout: 2000 }, async () => {
  const f = await mount();
  assert.equal(typeof f.api.scrollTo, 'function');
  const first = f.api.scrollTo({ top: 600, left: 400 });
  await advance(200);
  const second = f.api.scrollTo({ left: 0 }, { duration: 200 });
  await first;
  await advance(200);
  await second;
  assert.deepEqual([f.wrap.scrollTop, f.wrap.scrollLeft], [300, 0]);
});

it('静默双轴动画仍派发 scroll 并同步 thumb，但不淡入；用户接管后正常显示', { timeout: 2000 }, async () => {
  const f = await mount();
  assert.equal(typeof f.api.scrollTo, 'function');
  const task = f.api.scrollTo({ top: 600, left: 400 }, { silent: true });
  await advance(200);
  await f.scrollEvent();
  assert.deepEqual(f.events.at(-1), { scrollTop: 300, scrollLeft: 200 });
  assert.equal(f.yTrack.classList.contains('is-visible'), false);
  assert.equal(f.xThumb.style.transform, 'translateX(76px)');
  await advance(200);
  await task;
  await f.scrollEvent();
  assert.equal(f.yTrack.classList.contains('is-visible'), false);
  f.wrap.dispatchEvent(new dom.window.Event('wheel'));
  f.wrap.scrollTop = 500;
  await f.scrollEvent();
  assert.equal(f.yTrack.classList.contains('is-visible'), true);
});

it('静默立即定位保留既有行为，无位移的静默请求不吞掉下一次用户滚动', async () => {
  const f = await mount();
  await f.api.setScrollTop(200, { animated: false, silent: true });
  await f.scrollEvent();
  assert.equal(f.yTrack.classList.contains('is-visible'), false);
  await f.api.setScrollTop(200, { animated: false, silent: true });
  f.wrap.scrollTop = 220;
  await f.scrollEvent();
  assert.equal(f.yTrack.classList.contains('is-visible'), true);
});

for (const silent of [true, false]) {
  it(`连续 await 的第二笔无位移请求（silent=${silent}）不清除首笔待派发的静默标记`, async () => {
    const f = await mount();
    await f.api.setScrollTop(200, { animated: false, silent: true });
    await f.api.setScrollLeft(0, { animated: false, silent });
    // 原生 scroll 事件在微任务之后派发，同一帧的两笔请求可能合并为一次。
    await f.scrollEvent();
    assert.deepEqual(f.events, [{ scrollTop: 200, scrollLeft: 0 }]);
    assert.equal(f.yTrack.classList.contains('is-visible'), false);
    assert.equal(f.xTrack.classList.contains('is-visible'), false);
  });
}

it('无位移新请求结束旧静默动画的 Promise，但保留上一帧待派发标记', { timeout: 2000 }, async () => {
  const f = await mount();
  const first = f.api.scrollTo({ top: 600 }, { silent: true });
  await advance(200);
  await f.api.scrollTo({ left: 0 }, { animated: false, silent: true });
  await first;
  await f.scrollEvent();
  assert.equal(f.wrap.scrollTop, 300);
  assert.equal(f.yTrack.classList.contains('is-visible'), false);
  await advance(400);
  assert.equal(f.wrap.scrollTop, 300);
});

it('待派发的静默滚动后出现非静默位移，合并事件正常显示滚动条', async () => {
  const f = await mount();
  await f.api.setScrollTop(200, { animated: false, silent: true });
  await f.api.setScrollLeft(80, { animated: false });
  await f.scrollEvent();
  assert.deepEqual(f.events.at(-1), { scrollTop: 200, scrollLeft: 80 });
  assert.equal(f.yTrack.classList.contains('is-visible'), true);
});

it('用户接管仍清除未派发的静默标记，后续无位移请求不会重新挂标记', async () => {
  const f = await mount();
  await f.api.setScrollTop(200, { animated: false, silent: true });
  f.wrap.dispatchEvent(new dom.window.Event('wheel'));
  await f.api.setScrollLeft(0, { animated: false, silent: true });
  f.wrap.scrollTop = 240;
  await f.scrollEvent();
  assert.equal(f.yTrack.classList.contains('is-visible'), true);
});

it('减少动态效果偏好下双轴请求和旧 setter 均立即落位', { timeout: 2000 }, async () => {
  reducedMotion = true;
  const f = await mount();
  assert.equal(typeof f.api.scrollTo, 'function');
  await f.api.scrollTo({ top: 600, left: 400 }, { animated: true });
  assert.deepEqual([f.wrap.scrollTop, f.wrap.scrollLeft], [600, 400]);
  await f.api.setScrollTop(0);
  await f.api.setScrollLeft(0);
  assert.deepEqual([f.wrap.scrollTop, f.wrap.scrollLeft], [0, 0]);
});
