/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, readFile, rmdir, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { after, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { compileScript, parse } from '@vue/compiler-sfc';
import dayjs from 'dayjs';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { resolveDependencies } from '../../packages/cli/src/utils/dependencies';

/** 浏览器全局先于 Vue 初始化，组件在真实 DOM 中运行。 */
const dom = new JSDOM('<!doctype html><html><body></body></html>');
const previous = new Map<string, PropertyDescriptor | undefined>();
for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node']) {
  previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true });
}
const { createApp, createSSRApp, h, nextTick, reactive, ref } = await import('vue');
const { renderToString } = await import('@vue/server-renderer');
const folder = await mkdtemp(resolve('tests/reborn-statistic/.runtime-'));
const output = resolve(folder, 'components.mjs');
after(async () => {
  await unlink(output).catch(() => {});
  await rmdir(folder);
  dom.window.close();
  for (const [key, descriptor] of previous) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});
await build({
  stdin: {
    contents: `export {default as Statistic} from '~/components/reborn/ui/reborn-statistic/RebornStatistic.vue';export {default as Countdown} from '~/components/reborn/ui/reborn-countdown/RebornCountdown.vue';`,
    resolveDir: resolve('.'), loader: 'ts',
  },
  outfile: output, bundle: true, format: 'esm', platform: 'node', packages: 'external', alias: { '~': resolve('app') },
  plugins: [{ name: 'statistic-test', setup(builder) {
    builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
      const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
      return { contents: compileScript(descriptor, {
        id: path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
      }).content, loader: 'ts' };
    });
  } }],
});
const { Statistic, Countdown } = await import(pathToFileURL(output).href);

/** 挂载真实组件，保留响应式参数、插槽、公开实例和事件。 */
async function mount(component: typeof Statistic, initial: Record<string, unknown> = {}, slots = {}) {
  const root = document.createElement('div');
  document.body.append(root);
  const props = reactive(initial);
  const instance = ref();
  const app = createApp({ render: () => h(component, { ...props, ref: instance }, slots) });
  app.mount(root);
  await nextTick();
  return { root, props, instance, stop: () => { app.unmount(); root.remove(); } };
}

/** 用可推进的浏览器帧验证实际中间数值，避免依赖机器速度或只检查动画类名。 */
function enableMotion(t: TestContext) {
  const media = Object.assign(new dom.window.EventTarget(), { matches: false });
  const descriptors = [
    [window, 'matchMedia'], [window, 'requestAnimationFrame'], [window, 'cancelAnimationFrame'], [globalThis, 'requestAnimationFrame'],
  ].map(([target, key]) => ({ target: target as object, key: key as string, descriptor: Object.getOwnPropertyDescriptor(target, key as string) }));
  const frames = new Map<number, FrameRequestCallback>();
  let sequence = 0;
  let now = 0;
  t.mock.method(performance, 'now', () => now);
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => media });
  const schedule = (callback: FrameRequestCallback) => {
    frames.set(++sequence, callback);
    return sequence;
  };
  Object.defineProperty(window, 'requestAnimationFrame', { configurable: true, value: schedule });
  Object.defineProperty(globalThis, 'requestAnimationFrame', { configurable: true, value: schedule });
  Object.defineProperty(window, 'cancelAnimationFrame', { configurable: true, value: (id: number) => frames.delete(id) });
  t.after(() => {
    for (const { target, key, descriptor } of descriptors) {
      if (descriptor) Object.defineProperty(target, key, descriptor);
      else Reflect.deleteProperty(target, key);
    }
  });
  return {
    media,
    advance(milliseconds: number) {
      now += milliseconds;
      const scheduled = Array.from(frames.values());
      frames.clear();
      for (const callback of scheduled) callback(now);
    },
    pending: () => frames.size,
  };
}

it('与 Total Transactions 一样在 1500 毫秒内从零连续计数到目标', async (t) => {
  const motion = enableMotion(t);
  const view = await mount(Statistic, { value: 172000 });
  try {
    assert.equal(view.root.textContent, '0');
    motion.advance(750); await nextTick();
    assert.equal(view.root.textContent, '86,000');
    assert.equal(view.instance.value.displayValue, '86,000');
    motion.advance(750); await nextTick();
    assert.equal(view.root.textContent, '172,000');
    assert.equal(motion.pending(), 0);
  } finally { view.stop(); }
});

it('连续更新从当前数值衔接，支持负数与小数，卸载取消后续帧', async (t) => {
  const motion = enableMotion(t);
  const view = await mount(Statistic, { value: 100, precision: 1, duration: 100 });
  try {
    motion.advance(40); await nextTick();
    assert.equal(view.root.textContent, '40.0');
    view.props.value = 200; await nextTick();
    motion.advance(50); await nextTick();
    assert.equal(view.root.textContent, '120.0');
    view.props.value = -80.5; await nextTick();
    motion.advance(50); await nextTick();
    assert.equal(view.root.textContent, '19.8');
    motion.advance(50); await nextTick();
    assert.equal(view.instance.value.displayValue, '-80.5');
    view.props.value = 300; await nextTick();
    assert.equal(motion.pending(), 1);
  } finally { view.stop(); }
  assert.equal(motion.pending(), 0);
});

it('减少动态效果、动画开关、零时长和自定义格式化均立即显示', async (t) => {
  const { media, advance, pending } = enableMotion(t);
  media.matches = true;
  const view = await mount(Statistic, { value: 1000 });
  try {
    assert.equal(view.root.textContent, '1,000');
    assert.equal(pending(), 0);
    media.matches = false;
    media.dispatchEvent(new dom.window.Event('change')); await nextTick();
    view.props.value = 2000; await nextTick();
    advance(750); await nextTick();
    assert.equal(view.root.textContent, '1,500');
    view.props.animated = false; await nextTick();
    assert.equal(view.root.textContent, '2,000');
    assert.equal(pending(), 0);
    view.props.animated = true; await nextTick();
    view.props.duration = 0; await nextTick();
    view.props.value = 3000; await nextTick();
    assert.equal(view.root.textContent, '3,000');
    Object.assign(view.props, { duration: 200, formatter: (value: number) => `<b>${value}</b> 人` }); await nextTick();
    assert.equal(view.root.textContent, '<b>3000</b> 人');
    assert.equal(view.root.querySelector('b'), null);
    assert.equal(view.root.querySelector('[aria-hidden="true"]'), null);
  } finally { view.stop(); }
});

it('统计组件服务端直接展示目标，不启动动画帧', async (t) => {
  const motion = enableMotion(t);
  const html = await renderToString(createSSRApp({ render: () => h(Statistic, { value: 172000 }) }));
  assert.match(html, /172,000/);
  assert.equal(motion.pending(), 0);
});

it('统计数值响应参数更新，formatter 优先且公开值为当前显示内容', async () => {
  const view = await mount(Statistic, { value: 1234.56, precision: 1, title: '销售额', prefix: '¥', suffix: '元' });
  try {
    assert.equal(view.instance.value.displayValue, '1,234.6');
    assert.match(view.root.textContent!, /销售额¥1,234.6元/);
    Object.assign(view.props, { formatter: (value: number) => `自定义 ${value}`, precision: 4 });
    await nextTick();
    assert.equal(view.instance.value.displayValue, '自定义 1234.56');
    Object.assign(view.props, { value: 0 }); await nextTick();
    assert.equal(view.instance.value.displayValue, '自定义 0');
  } finally { view.stop(); }
});

it('三个具名插槽优先，数值样式和结构类名落在对应节点', async () => {
  const view = await mount(Statistic, {
    title: '原标题', prefix: '原前缀', suffix: '原后缀', valueStyle: { color: 'red' },
    class: 'root-test', ui: { content: 'content-test', value: 'value-test', title: 'title-test', prefix: 'prefix-test', suffix: 'suffix-test' },
  }, { title: () => h('b', '插槽标题'), prefix: () => '￥', suffix: () => '次' });
  try {
    assert.equal(view.root.textContent, '插槽标题￥0次');
    assert.equal(view.root.querySelector<HTMLElement>('.content-test')?.style.color, 'red');
    assert.equal(view.root.querySelector('.value-test')?.textContent, '0');
    assert.ok(view.root.querySelector('.root-test .title-test b'));
    Object.assign(view.props, { valueStyle: 'color: blue' }); await nextTick();
    assert.equal(view.root.querySelector<HTMLElement>('.content-test')?.style.color, 'blue');
  } finally { view.stop(); }
});

it('倒计时按目标时间校准，延迟唤醒仍到零且只结束一次', async (t) => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 100000 });
  const changes: number[] = [];
  let finishes = 0;
  const view = await mount(Countdown, { value: 103000, onChange: (value: number) => changes.push(value), onFinish: () => finishes++ });
  try {
    assert.equal(view.instance.value.displayValue, '00:00:03');
    t.mock.timers.tick(1100); await nextTick();
    assert.equal(view.instance.value.displayValue, '00:00:01');
    assert.equal(changes.at(-1), 1900);
    t.mock.timers.tick(5000); await nextTick();
    assert.equal(view.instance.value.displayValue, '00:00:00');
    assert.equal(changes.at(-1), 0);
    assert.equal(finishes, 1);
    t.mock.timers.tick(10000); await nextTick();
    assert.equal(finishes, 1);
  } finally { view.stop(); t.mock.timers.reset(); }
});

it('更新目标时间可重启，Dayjs、毫秒格式、前后缀与样式均可用', async (t) => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 100000 });
  let finishes = 0;
  const view = await mount(Countdown, {
    value: dayjs(101000), format: 'ss.SSS', onFinish: () => finishes++, title: '倒计时', prefix: '还剩', suffix: '秒', valueStyle: 'color: red',
  }, { title: () => '自定义标题' });
  try {
    assert.equal(view.instance.value.displayValue, '01.000');
    assert.match(view.root.textContent!, /自定义标题还剩01.000秒/);
    assert.ok(view.root.querySelector('.reborn-countdown'));
    t.mock.timers.tick(250); await nextTick();
    assert.equal(view.instance.value.displayValue, '00.750');
    view.props.value = dayjs(103250); await nextTick();
    assert.equal(view.instance.value.displayValue, '03.000');
    t.mock.timers.tick(500); await nextTick();
    assert.equal(view.instance.value.displayValue, '02.500');
    assert.equal(finishes, 0);
    t.mock.timers.tick(5000); await nextTick();
    assert.equal(finishes, 1);
    view.props.value = Date.now() + 1000; await nextTick();
    t.mock.timers.tick(1000); await nextTick();
    assert.equal(finishes, 2);
  } finally { view.stop(); t.mock.timers.reset(); }
});

it('无效目标不派发结束，过期目标立即结束，卸载后不再派发事件', async (t) => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 100000 });
  let finishes = 0;
  const changes: number[] = [];
  const view = await mount(Countdown, { onFinish: () => finishes++, onChange: (value: number) => changes.push(value) });
  try {
    assert.equal(finishes, 0);
    view.props.value = dayjs('invalid'); await nextTick();
    assert.equal(finishes, 0);
    view.props.value = 99999; await nextTick();
    assert.equal(finishes, 1);
    view.props.value = 105000; await nextTick();
  } finally { view.stop(); }
  const count = changes.length;
  t.mock.timers.tick(10000); await nextTick();
  assert.equal(finishes, 1);
  assert.equal(changes.length, count);
  t.mock.timers.reset();
});

it('服务端倒计时输出稳定，不创建计时器或派发业务事件', async (t) => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 100000 });
  let changes = 0;
  const render = () => renderToString(createSSRApp({ render: () => h(Countdown, { value: 200000, onChange: () => changes++ }) }));
  const first = await render();
  t.mock.timers.tick(5000);
  assert.equal(await render(), first);
  assert.match(first, /00:00:00/);
  assert.equal(changes, 0);
  t.mock.timers.reset();
});

it('CLI 安装倒计时时包含统计组件依赖，复制源码后可独立使用', async () => {
  const registryComponents = await Promise.all(['reborn-countdown', 'reborn-statistic'].map(async name => ({
    name, dependencies: [], files: [{
      path: name === 'reborn-countdown' ? 'RebornCountdown.vue' : 'RebornStatistic.vue',
      content: await readFile(resolve(`app/components/reborn/ui/${name}/${name === 'reborn-countdown' ? 'RebornCountdown' : 'RebornStatistic'}.vue`), 'utf8'),
    }],
  })));
  const result = resolveDependencies({ registryComponents, targets: ['reborn-countdown'], platform: 'web' });
  assert.deepEqual(result.components, ['reborn-statistic']);
});
