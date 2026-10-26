/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, readFile, rmdir, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { after, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { compileScript, parse } from '@vue/compiler-sfc';
import { renderToString } from '@vue/server-renderer';
import { build } from 'esbuild';
import { createRenderer, createSSRApp, defineComponent, h, nextTick, reactive, ref } from 'vue';
import { resolveDependencies } from '../../packages/cli/src/utils/dependencies';

const folder = await mkdtemp(resolve('tests/reborn-carousel/.runtime-'));
const files = [resolve(folder, 'client.mjs'), resolve(folder, 'server.mjs'), resolve(folder, 'fixture.mjs')];
after(async () => { await Promise.all(files.map(file => unlink(file))); await rmdir(folder); });
for (const [index, output] of files.entries()) {
  const fixture = `<script setup lang="ts">import Carousel from '~/components/reborn/ui/reborn-carousel/RebornCarousel.vue';defineProps<{title:string}>();</script><template><Carousel loop :height="240"><article v-for="id in 3" :key="id"><span>{{ title }}</span></article></Carousel></template>`;
  const fixtureScript = compileScript(parse(fixture, { filename: 'fixture.vue' }).descriptor, { id: 'fixture', inlineTemplate: true }).content;
  await build({
    ...(index === 2 ? { stdin: { contents: fixtureScript, loader: 'ts' as const, resolveDir: resolve('.'), sourcefile: 'fixture.ts' } } : { entryPoints: [resolve('app/components/reborn/ui/reborn-carousel/RebornCarousel.vue')] }), outfile: output,
    bundle: true, format: 'esm', platform: 'node', packages: 'external', alias: { '~': resolve('app'), '@': resolve('app') },
    define: { 'import.meta.client': String(index !== 1) },
    plugins: [{ name: 'carousel-test', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        return { contents: compileScript(descriptor, { id: 'carousel-test', inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') } }).content, loader: 'ts' };
      });
    } }],
  });
}
const Carousel = (await import(pathToFileURL(files[0]!).href)).default;
const ServerCarousel = (await import(pathToFileURL(files[1]!).href)).default;
const Fixture = (await import(pathToFileURL(files[2]!).href)).default;

it('pagination.display=never 不渲染五种内置指示器，也不挂载自定义分页插槽', async () => {
  for (const type of ['line', 'dot', 'progress', 'fraction', 'button']) {
    const t = await mount({ pagination: { type, display: 'never' }, ui: { indicatorWrapper: 'test-pagination' } });
    try {
      assert.equal(t.nodes().some(node => node.props.class?.includes('test-pagination')), false, type);
    } finally { t.stop(); }
  }
  let rendered = 0;
  const t = await mount({ pagination: { display: 'never' } }, { indicators: () => { rendered++; return h('button', '自定义分页'); } });
  try { assert.equal(rendered, 0); } finally { t.stop(); }
});

it('指示器默认 always，动态显示模式与旧隐藏规则互不干扰，不改变索引或触发切换事件', async () => {
  const t = await mount({ modelValue: 2 });
  try {
    assert.equal(t.indicators().length, 4);
    for (const display of ['never', 'hover', 'always']) {
      Object.assign(t.props, { pagination: { type: 'dot', display } }); await settle();
      assert.equal(t.indicators().length, display === 'never' ? 0 : 4);
      assert.equal(t.exposed.value.activeIndex, 2);
    }
    Object.assign(t.props, { indicatorPosition: 'none' }); await settle();
    assert.equal(t.indicators().length, 0);
    Object.assign(t.props, { indicatorPosition: 'inside', pagination: null }); await settle();
    assert.equal(t.indicators().length, 0);
    assert.deepEqual(t.changes, []); assert.deepEqual(t.updates, []);
  } finally { t.stop(); }
});

it('安装 Carousel 时自动解析并带上 RebornProgress 组件依赖', async () => {
  const registryComponents = await Promise.all(['reborn-carousel', 'reborn-progress'].map(async name => ({
    name, dependencies: [], files: [{ path: name === 'reborn-carousel' ? 'RebornCarousel.vue' : 'RebornProgress.vue', content: await readFile(resolve(`app/components/reborn/ui/${name}/${name === 'reborn-carousel' ? 'RebornCarousel' : 'RebornProgress'}.vue`), 'utf8') }],
  })));
  const dependencies = resolveDependencies({ registryComponents, targets: ['reborn-carousel'], platform: 'web' });
  assert.deepEqual(dependencies.components, ['reborn-progress']);
});

/** 内存 DOM 保留真实组件事件与滚动调用，几何尺寸固定为 600×240。 */
class Element extends EventTarget {
  props: Record<string, any> = {};
  children: Element[] = [];
  parent?: Element;
  scrollLeft = 0;
  scrollTop = 0;
  scrolls: ScrollToOptions[] = [];
  onscrollend = null;
  constructor(public type: string, public text = '') { super(); }
  get style() { return this.props.style ?? {}; }
  get offsetWidth(): number { return Number.parseFloat(this.style.flexBasis) || 600; }
  get offsetHeight(): number { return Number.parseFloat(this.style.minHeight) || 240; }
  get clientWidth() { return 600; }
  get clientHeight() { return 240; }
  get offsetLeft(): number { return this.before().reduce((sum, node) => sum + node.offsetWidth + (Number.parseFloat(this.parent?.style.gap) || 0), 0); }
  get offsetTop(): number { return this.before().reduce((sum, node) => sum + node.offsetHeight + (Number.parseFloat(this.parent?.style.gap) || 0), 0); }
  get scrollWidth(): number { return this.children[0]?.children.filter(node => node.type === 'div').reduce((sum, node) => sum + node.offsetWidth, 0) ?? 600; }
  get scrollHeight(): number { return this.children[0]?.children.filter(node => node.type === 'div').reduce((sum, node) => sum + node.offsetHeight, 0) ?? 240; }
  get firstElementChild() { return this.children.find(node => node.type !== '#comment'); }
  before() { return this.parent?.children.slice(0, this.parent.children.indexOf(this)).filter(node => node.type === 'div') ?? []; }
  scrollTo(options: ScrollToOptions) { this.scrolls.push(options); this.scrollLeft = options.left ?? this.scrollLeft; this.scrollTop = options.top ?? this.scrollTop; }
  getBoundingClientRect() { return { width: 600, height: 240 }; }
  contains(node: Element): boolean { return node === this || this.children.some(child => child.contains(node)); }
  matches() { return false; }
  closest(selector: string): Element | null { return selector.includes(this.type) ? this : this.parent?.closest(selector) ?? null; }
  setPointerCapture() {}
  releasePointerCapture() {}
}
const browser = Object.assign(new EventTarget(), {
  innerWidth: 1024,
  setInterval: (callback: () => void, delay: number) => setInterval(callback, delay),
  clearInterval: (id: ReturnType<typeof setInterval>) => clearInterval(id),
});
const page = Object.assign(new EventTarget(), { hidden: false });
Object.assign(globalThis, { window: browser, document: page });
let frameId = 0;
const frames = new Map<number, FrameRequestCallback>();
Object.assign(globalThis, {
  requestAnimationFrame: (callback: FrameRequestCallback) => { frames.set(++frameId, callback); return frameId; },
  cancelAnimationFrame: (id: number) => frames.delete(id),
});
async function settle() {
  for (let i = 0; i < 4; i++) {
    await nextTick();
    const batch = [...frames.values()]; frames.clear(); batch.forEach(callback => callback(0));
  }
}
const renderer = createRenderer<Element, Element>({
  createElement: type => new Element(type), createText: text => new Element('#text', text), createComment: text => new Element('#comment', text),
  setText: (node, text) => { node.text = text; }, setElementText: (node, text) => { node.text = text; node.children = []; },
  parentNode: node => node.parent ?? null, nextSibling: node => node.parent?.children[node.parent.children.indexOf(node) + 1] ?? null,
  patchProp: (node, key, _, value) => { node.props[key] = value; },
  insert(node, parent, anchor) {
    if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1);
    const index = anchor ? parent.children.indexOf(anchor) : -1;
    parent.children.splice(index < 0 ? parent.children.length : index, 0, node); node.parent = parent;
  },
  remove(node) { if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1); },
});
const flatten = (node: Element): Element[] => [node, ...node.children.flatMap(flatten)];
async function mount(initial: Record<string, unknown> = {}, customSlots = {}, component = Carousel) {
  const props = reactive({ pagination: { type: 'dot' }, ...initial });
  const items = ref([0, 1, 2, 3]);
  const exposed = ref<any>();
  const changes: number[] = [];
  const updates: number[] = [];
  const root = new Element('root');
  const app = renderer.createApp(defineComponent({ setup: () => () => h(component, {
    ...props, ref: exposed, onChange: (index: number) => changes.push(index),
    'onUpdate:modelValue': (index: number) => updates.push(index),
  }, { default: () => items.value.map(index => h('article', { key: index }, `第 ${index + 1} 项`)), ...customSlots }) }));
  app.component('Icon', { render: () => h('svg') });
  app.mount(root); await settle();
  const nodes = () => flatten(root);
  const viewport = () => nodes().find(node => node.props['data-direction'])!;
  const indicators = () => nodes().filter(node => node.type === 'button' && node.props['aria-label']?.startsWith('切换到'));
  return { props, items, exposed, changes, updates, nodes, viewport, indicators, stop: () => { app.unmount(); frames.clear(); page.hidden = false; } };
}

it('未绑定模型时 initialSlide 决定首帧，绑定模型时模型优先', async () => {
  for (const [props, expected] of [[{ initialSlide: 2 }, 2], [{ initialSlide: 2, modelValue: 1 }, 1]] as const) {
    const t = await mount(props);
    try { assert.equal(t.viewport().scrollLeft, expected * 600); assert.deepEqual(t.changes, []); } finally { t.stop(); }
  }
});

it('slidesPerView 与旧拼写兼容，新参数优先且断点覆盖基础值', async () => {
  for (const [props, width] of [[{ slidesPerView: 2 }, 300], [{ slidesPerview: 2 }, 300], [{ slidesPerView: 2, slidesPerview: 3 }, 300], [{ slidesPerView: 2, breakpoints: { 800: { slidesPerView: 3 } } }, 200]] as const) {
    const t = await mount(props);
    try { assert.equal(t.viewport().children[0]!.children.find(node => node.type === 'div')!.style.flexBasis, `${width}px`); } finally { t.stop(); }
  }
});

it('数字高度转换为 px，无效尺寸不生成 NaN 样式', async () => {
  const t = await mount({ height: 240, slidesPerView: Number.NaN, spaceBetween: -10 });
  try {
    assert.ok(t.nodes().some(node => node.style.height === '240px'));
    assert.equal(t.viewport().children[0]!.style.gap, '0px');
  } finally { t.stop(); }
});

it('goTo 归一化非整数及非法索引，只在实际变化时触发事件', async () => {
  const t = await mount();
  try {
    t.exposed.value.goTo(1.8); await settle();
    assert.deepEqual(t.changes, [1]);
    t.exposed.value.goTo(Number.NaN); await settle();
    assert.deepEqual(t.changes, [1, 0]);
    t.exposed.value.goTo(0); await settle(); assert.deepEqual(t.changes, [1, 0]);
  } finally { t.stop(); }
});

it('原生 scrollend 不触发时仍解除导航锁，支持后续切换', async (ctx) => {
  ctx.mock.timers.enable({ apis: ['setTimeout'] });
  const t = await mount();
  try {
    t.exposed.value.next(); await settle();
    ctx.mock.timers.tick(1000); await settle();
    t.exposed.value.next(); await settle();
    assert.deepEqual(t.changes, [1, 2]);
  } finally { t.stop(); }
});

it('同帧连续指令保留最后目标，loop goTo 与箭头切换不会被旧回调覆盖', async () => {
  const t = await mount({ loop: true });
  try {
    t.indicators()[2]!.props.onMouseenter();
    t.exposed.value.next();
    await settle();
    assert.deepEqual(t.changes, [2, 3]);
    assert.equal(t.viewport().scrolls.at(-1)!.left, 4200);
    t.exposed.value.goTo(1); await settle();
    assert.equal(t.changes.at(-1), 1);
  } finally { t.stop(); }
});

it('动态删除内容修正索引和模型，清空后不保留旧项', async () => {
  const t = await mount({ modelValue: 3 });
  try {
    t.items.value = [0, 1]; await settle();
    assert.equal(t.indicators().length, 2); assert.equal(t.updates.at(-1), 1);
    t.items.value = []; await settle();
    assert.equal(t.indicators().length, 0); assert.equal(t.updates.at(-1), 0);
  } finally { t.stop(); }
});

it('键盘不劫持输入框方向键，keyboard=false 可关闭导航', async () => {
  const t = await mount();
  try {
    let prevented = 0;
    t.viewport().props.onKeydown({ key: 'ArrowRight', target: new Element('input'), preventDefault: () => prevented++ });
    await settle(); assert.equal(prevented, 0); assert.deepEqual(t.changes, []);
    Object.assign(t.props, { keyboard: false }); await settle();
    t.viewport().props.onKeydown({ key: 'ArrowRight', target: t.viewport(), preventDefault: () => prevented++ });
    assert.equal(prevented, 0);
  } finally { t.stop(); }
});

it('hover 指示器仍响应点击和键盘原生 click，clickable=false 禁用', async () => {
  const t = await mount();
  try {
    t.indicators()[2]!.props.onClick(); await settle();
    assert.deepEqual(t.changes, [2]);
    Object.assign(t.props, { pagination: { type: 'dot', clickable: false } }); await settle();
    assert.equal(t.indicators()[0]!.props.disabled, true);
    t.indicators()[0]!.props.onClick(); assert.deepEqual(t.changes, [2]);
  } finally { t.stop(); }
});

it('自动播放支持取消悬停暂停，手动 pause 不会被导航重启，resume 恢复', async (ctx) => {
  ctx.mock.timers.enable({ apis: ['setInterval', 'setTimeout'] });
  const t = await mount({ loop: true, autoplay: { delay: 800, pauseOnHover: false } });
  try {
    const root = t.nodes().find(node => node.props.onPointerenter)!;
    root.props.onPointerenter({ pointerType: 'mouse' }); await settle();
    ctx.mock.timers.tick(800); await settle(); assert.deepEqual(t.changes, [1]);
    assert.equal(typeof t.exposed.value.pause, 'function');
    t.exposed.value.pause(); t.exposed.value.goTo(2); await settle();
    ctx.mock.timers.tick(3000); await settle(); assert.deepEqual(t.changes, [1, 2]);
    t.exposed.value.resume(); ctx.mock.timers.tick(800); await settle();
    assert.equal(t.changes.at(-1), 3);
  } finally { t.stop(); }
});

it('后台页面暂停计时，恢复可见后重新计时，卸载清理定时器', async (ctx) => {
  ctx.mock.timers.enable({ apis: ['setInterval', 'setTimeout'] });
  const t = await mount({ loop: true, autoplay: true });
  try {
    page.hidden = true; page.dispatchEvent(new Event('visibilitychange')); await settle();
    ctx.mock.timers.tick(4000); await settle(); assert.deepEqual(t.changes, []);
    page.hidden = false; page.dispatchEvent(new Event('visibilitychange')); await settle();
    ctx.mock.timers.tick(3000); await settle(); assert.deepEqual(t.changes, [1]);
  } finally { t.stop(); }
  ctx.mock.timers.tick(10000); await settle(); assert.deepEqual(t.changes, [1]);
});

it('鼠标拖动真实改变滚动偏移，松开吸附，触控继续使用原生滚动', async () => {
  const t = await mount({ draggable: true });
  try {
    const viewport = t.viewport();
    assert.equal(typeof viewport.props.onPointerdown, 'function');
    viewport.props.onPointerdown({ pointerId: 1, pointerType: 'mouse', button: 0, clientX: 500, clientY: 0, target: viewport });
    viewport.props.onPointermove({ pointerId: 1, clientX: 0, clientY: 0, preventDefault() {} });
    assert.equal(viewport.scrollLeft, 500);
    viewport.props.onPointerup({ pointerId: 1 }); await settle();
    assert.equal(t.changes.at(-1), 1); assert.equal(viewport.scrollLeft, 600);
  } finally { t.stop(); }
});

it('SSR 首帧体现初始索引，loop 克隆片不可聚焦且导航有可访问名称', async () => {
  const app = createSSRApp({ render: () => h(ServerCarousel, { loop: true, initialSlide: 2, pagination: { type: 'button' } }, { default: () => [0, 1, 2].map(index => h('button', `内容 ${index}`)) }) });
  app.component('Icon', { render: () => h('svg') });
  const html = await renderToString(app);
  assert.match(html, /aria-roledescription="轮播"/);
  assert.match(html, /aria-label="切换到第 3 项"[^>]*aria-current="true"/);
  assert.match(html, /aria-hidden="true"[^>]*inert/);
});

it('每次 SSR 渲染只读取默认插槽一次，不随克隆项数量重复执行', async () => {
  let calls = 0;
  const app = createSSRApp({ render: () => h(ServerCarousel, { loop: true, thumbs: { position: 'bottom' } }, { default: () => { calls++; return [0, 1, 2].map(index => h('article', `内容 ${index}`)); } }) });
  app.component('Icon', { render: () => h('svg') });
  await renderToString(app);
  assert.equal(calls, 1);
});

it('loop 首尾切换双向衔接，非 loop 多项显示时箭头与方法边界一致', async () => {
  const t = await mount({ loop: true, initialSlide: 0 });
  try {
    t.exposed.value.prev(); await settle(); t.viewport().dispatchEvent(new Event('scrollend')); await settle();
    assert.equal(t.exposed.value.activeIndex, 3);
    t.exposed.value.next(); await settle(); t.viewport().dispatchEvent(new Event('scrollend')); await settle();
    assert.equal(t.exposed.value.activeIndex, 0);
  } finally { t.stop(); }
  const multi = await mount({ slidesPerView: 2, initialSlide: 2 });
  try {
    assert.equal(multi.nodes().find(node => node.props['aria-label'] === '下一项')!.props.disabled, true);
    multi.exposed.value.next(); await settle(); assert.deepEqual(multi.changes, []);
  } finally { multi.stop(); }
});

it('高宽断点的旧拼写仍可覆盖低宽断点的新拼写', async () => {
  const t = await mount({ breakpoints: { 640: { slidesPerView: 2 }, 900: { slidesPerview: 3 } } });
  try { assert.equal(t.viewport().children[0]!.children.find(node => node.type === 'div')!.style.flexBasis, '200px'); } finally { t.stop(); }
});

it('多项非循环自动播放到末个可视组时停止计时', async (ctx) => {
  ctx.mock.timers.enable({ apis: ['setInterval', 'setTimeout'] });
  const t = await mount({ slidesPerView: 2, initialSlide: 2, autoplay: true });
  try {
    ctx.mock.timers.tick(3000); await settle();
    assert.equal(t.exposed.value.isPlaying, false); assert.deepEqual(t.changes, []);
  } finally { t.stop(); }
});

it('接缝直接平滑进入相邻克隆片，完成后才瞬时归位，不依赖额外动画帧', async () => {
  for (const [initialSlide, method, cloneOffset, realOffset] of [[3, 'next', 4800, 2400], [0, 'prev', 1800, 4200]] as const) {
    const t = await mount({ loop: true, initialSlide });
    try {
      t.viewport().scrolls.length = 0;
      t.exposed.value[method](); await settle();
      assert.equal(t.viewport().scrolls[0]!.behavior, 'smooth');
      assert.equal(t.viewport().scrolls[0]!.left, cloneOffset);
      t.viewport().dispatchEvent(new Event('scrollend')); await settle();
      assert.equal(t.viewport().scrolls.at(-1)!.behavior, 'instant');
      assert.equal(t.viewport().scrolls.at(-1)!.left, realOffset);
    } finally { t.stop(); }
  }
});

it('切换方向期间忽略旧轴滚动事件，保留当前索引再对齐新轴', async () => {
  const t = await mount({ loop: true, initialSlide: 2 });
  try {
    Object.assign(t.props, { direction: 'vertical', height: 240 });
    t.viewport().scrollTop = 0;
    t.viewport().props.onScroll();
    await settle();
    assert.equal(t.exposed.value.activeIndex, 2);
    assert.deepEqual(t.changes, []);
  } finally { t.stop(); }
});

it('编译模板的动态子节点在真实片和所有克隆片中同步更新', async () => {
  const t = await mount({ title: '旧内容' }, {}, Fixture);
  try {
    Object.assign(t.props, { title: '新内容' }); await settle();
    const labels = t.nodes().filter(node => node.type === 'span').map(node => node.text);
    assert.equal(labels.length, 9);
    assert.ok(labels.every(label => label === '新内容'), `仍有旧内容：${labels.join(',')}`);
  } finally { t.stop(); }
});

it('loop 转场中回到起点会平滑取消旧目标并实际归位', async () => {
  const t = await mount({ loop: true });
  try {
    t.exposed.value.goTo(2); await settle();
    t.exposed.value.goTo(0); await settle();
    assert.equal(t.exposed.value.activeIndex, 0);
    assert.equal(t.viewport().scrolls.at(-1)!.behavior, 'smooth');
    assert.equal(t.viewport().scrollLeft, 2400);
    t.viewport().dispatchEvent(new Event('scrollend')); await settle();
    assert.equal(t.viewport().scrollLeft, 2400, '旧目标不能在动画完成后覆盖归位结果');
  } finally { t.stop(); }
});

it('连续循环耗尽克隆缓冲后保留等价位置，仍能双向继续步进', async () => {
  for (const method of ['next', 'prev']) {
    const t = await mount({ loop: true });
    try {
      for (let i = 1; i <= 18; i++) {
        t.exposed.value[method](); await settle();
        assert.equal(t.exposed.value.activeIndex, method === 'next' ? i % 4 : (4 - i % 4) % 4);
        assert.ok(t.viewport().scrollLeft >= 0 && t.viewport().scrollLeft <= 6600);
      }
      t.viewport().dispatchEvent(new Event('scrollend')); await settle();
      assert.equal(t.viewport().scrollLeft, 3600);
    } finally { t.stop(); }
  }
});

it('纵向外部模型更新也使用双向相邻克隆片', async () => {
  for (const [modelValue, target, cloneOffset] of [[3, 0, 1920], [0, 3, 720]] as const) {
    const t = await mount({ loop: true, direction: 'vertical', height: 240, modelValue });
    try {
      t.viewport().scrolls.length = 0;
      Object.assign(t.props, { modelValue: target }); await settle();
      assert.equal(t.viewport().scrolls[0]!.top, cloneOffset);
      assert.deepEqual(t.changes, []); assert.deepEqual(t.updates, []);
    } finally { t.stop(); }
  }
});

it('最短路径越出克隆缓冲时使用可达的真实区路径', async () => {
  const t = await mount({ loop: true });
  try {
    t.items.value = Array.from({ length: 12 }, (_, i) => i); await settle();
    t.viewport().scrolls.length = 0;
    t.exposed.value.goTo(7); await settle();
    assert.equal(t.viewport().scrolls[0]!.left, 6600);
    assert.equal(t.exposed.value.activeIndex, 7);
  } finally { t.stop(); }
});

it('外部模型双向跨接缝使用相邻克隆片，不触发 change 或回写模型', async () => {
  for (const [modelValue, target, cloneOffset, realOffset] of [[3, 0, 4800, 2400], [0, 3, 1800, 4200]] as const) {
    const t = await mount({ loop: true, modelValue });
    try {
      t.viewport().scrolls.length = 0;
      Object.assign(t.props, { modelValue: target }); await settle();
      assert.equal(t.viewport().scrolls[0]!.behavior, 'smooth');
      assert.equal(t.viewport().scrolls[0]!.left, cloneOffset);
      t.viewport().dispatchEvent(new Event('scrollend')); await settle();
      assert.equal(t.viewport().scrollLeft, realOffset);
      assert.deepEqual(t.changes, []); assert.deepEqual(t.updates, []);
    } finally { t.stop(); }
  }
});

it('跨接缝未结束时连续步进沿克隆区续接，不倒滚回真实区', async () => {
  for (const [initialSlide, method, offsets] of [[3, 'next', [4800, 5400]], [0, 'prev', [1800, 1200]]] as const) {
    const t = await mount({ loop: true, initialSlide });
    try {
      t.viewport().scrolls.length = 0;
      for (const offset of offsets) {
        t.exposed.value[method](); await settle();
        assert.equal(t.viewport().scrolls.at(-1)!.left, offset);
        assert.equal(t.viewport().scrolls.at(-1)!.behavior, 'smooth');
      }
      assert.ok(t.viewport().scrolls.every(scroll => scroll.behavior === 'smooth'));
    } finally { t.stop(); }
  }
});

it('四项轮播耗尽缓冲时跨接缝仍保持相邻方向，箭头与指示器一致', async () => {
  for (const [initialSlide, step, offset] of [[3, 1, 4800], [0, -1, 1800]] as const) for (const mode of ['arrow', 'indicator']) {
    const t = await mount({ loop: true, initialSlide });
    try {
      for (let i = 0; i < 5; i++) {
        if (mode === 'arrow') t.exposed.value[step === 1 ? 'next' : 'prev']();
        else t.exposed.value.goTo((initialSlide + step * (i + 1) + 8) % 4);
        await settle();
      }
      assert.equal(t.viewport().scrolls.at(-1)!.left, offset, `${mode}/${step} 缓冲归位后仍应滑入相邻克隆片`);
    } finally { t.stop(); }
  }
});

it('指示器跨接缝后继续导航不瞬时退回旧起点', async () => {
  const t = await mount({ loop: true, initialSlide: 3 });
  try {
    t.viewport().scrolls.length = 0;
    t.indicators()[0]!.props.onClick(); await settle();
    t.indicators()[1]!.props.onClick(); await settle();
    assert.deepEqual(t.viewport().scrolls.map(scroll => [scroll.behavior, scroll.left]), [['smooth', 4800], ['smooth', 5400]]);
  } finally { t.stop(); }
});

it('旧目标的 scrollend 不能提前完成新循环转场', async () => {
  const t = await mount({ loop: true, initialSlide: 3 });
  try {
    t.exposed.value.next(); await settle(); t.exposed.value.next(); await settle();
    const viewport = t.viewport();
    const calls = viewport.scrolls.length;
    viewport.scrollLeft = 4800; viewport.dispatchEvent(new Event('scrollend')); await settle();
    assert.equal(viewport.scrolls.length, calls, '尚未抵达新目标，不应静默归位');
    viewport.scrollLeft = 5400; viewport.dispatchEvent(new Event('scrollend')); await settle();
    assert.equal(viewport.scrollLeft, 3000);
  } finally { t.stop(); }
});

it('循环转场超时兜底等待实际目标，缺失 scrollend 时仍能完成', async (ctx) => {
  ctx.mock.timers.enable({ apis: ['setTimeout'] });
  const t = await mount({ loop: true, initialSlide: 3 });
  try {
    t.exposed.value.next(); await settle();
    const viewport = t.viewport();
    viewport.scrollLeft = 4600;
    ctx.mock.timers.tick(600); await settle();
    assert.equal(viewport.scrollLeft, 4600, '动画未结束时不能因固定 600ms 提前跳转');
    viewport.scrollLeft = 4800;
    ctx.mock.timers.tick(120); await settle();
    assert.equal(viewport.scrollLeft, 2400);
  } finally { t.stop(); }
});

it('同帧连续指令保留尚未执行的周期平移', async () => {
  for (const [initialSlide, method, visualOffset, shiftedOffset, targetOffset] of [[3, 'next', 6049, 3649, 5400], [0, 'prev', 547, 2947, 1200]] as const) {
    const t = await mount({ loop: true, initialSlide });
    try {
      for (let i = 0; i < 4; i++) { t.exposed.value[method](); await settle(); }
      t.viewport().scrollLeft = visualOffset; t.viewport().scrolls.length = 0;
      t.exposed.value[method](); t.exposed.value[method](); await settle();
      assert.deepEqual(t.viewport().scrolls.map(scroll => [scroll.behavior, scroll.left]), [['instant', shiftedOffset], ['smooth', targetOffset]]);
    } finally { t.stop(); }
  }
});

it('多项显示的周期平移使用原始几何跨度，不受滚动边界裁剪影响', async () => {
  const t = await mount({ loop: true, initialSlide: 3, slidesPerView: 2 });
  try {
    const viewport = t.viewport();
    let previous = viewport.scrollLeft;
    viewport.scrolls.length = 0;
    for (let i = 0; i < 5; i++) { t.exposed.value.next(); await settle(); }
    let shifts = 0;
    for (const scroll of viewport.scrolls) {
      if (scroll.behavior === 'instant') { shifts++; assert.equal(Math.abs(scroll.left! - previous), 1200); }
      previous = scroll.left!;
    }
    assert.equal(shifts, 1);
  } finally { t.stop(); }
});

it('实际动画落后于连续指令时先滑向安全区，不执行越界周期平移', async () => {
  const t = await mount({ loop: true, initialSlide: 3 });
  try {
    t.items.value = Array.from({ length: 12 }, (_, i) => i); await settle();
    const viewport = t.viewport(); viewport.scrolls.length = 0;
    for (let i = 0; i < 13; i++) {
      t.exposed.value.next(); await settle();
      // 真实浏览器动画不会在 nextTick 内完成，此处只延迟几何位置，不替换导航逻辑。
      viewport.scrollLeft = 4200;
    }
    assert.ok(viewport.scrolls.every(scroll => scroll.left! >= 0), '不能把负坐标交给浏览器裁剪');
    assert.equal(viewport.scrolls.at(-1)!.left, 11400, '先沿原方向滑到能安全平移周期的位置');
    viewport.scrollLeft = 11400; viewport.dispatchEvent(new Event('scrollend')); await settle();
    assert.equal(viewport.scrolls.at(-1)!.left, 4800);
    assert.equal(t.exposed.value.activeIndex, 4);
  } finally { t.stop(); }
});

it('越界的初始索引在 SSR 首屏与客户端首帧即被钳制，始终有一项处于激活态', async () => {
  for (const [props, expected] of [[{ initialSlide: 5 }, 3], [{ loop: true, initialSlide: -1 }, 3], [{ modelValue: 9 }, 3]] as const) {
    const app = createSSRApp({ render: () => h(ServerCarousel, { ...props, pagination: { type: 'button' } }, { default: () => [0, 1, 2].map(index => h('article', `内容 ${index}`)) }) });
    app.component('Icon', { render: () => h('svg') });
    const html = await renderToString(app);
    assert.match(html, new RegExp(`aria-label="切换到第 ${expected} 项"[^>]*aria-current="true"`), JSON.stringify(props));
    // 客户端首帧：挂载后、watch(slideCount) 的 nextTick 钳制之前
    const root = new Element('root');
    const client = renderer.createApp(defineComponent({ setup: () => () => h(Carousel, { ...props, pagination: { type: 'button' } }, { default: () => [0, 1, 2].map(index => h('article', { key: index }, `内容 ${index}`)) }) }));
    client.component('Icon', { render: () => h('svg') });
    client.mount(root);
    try {
      const current = flatten(root).filter(node => node.type === 'button' && node.props['aria-current'] === 'true').map(node => node.props['aria-label']);
      assert.deepEqual(current, [`切换到第 ${expected} 项`], JSON.stringify(props));
    } finally { client.unmount(); frames.clear(); }
  }
});
