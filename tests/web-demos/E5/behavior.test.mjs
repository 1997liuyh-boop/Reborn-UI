/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { afterEach, it } from 'node:test';
import { runInThisContext } from 'node:vm';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html><body></body></html>', { url: 'http://localhost' });
for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node', 'Event', 'CustomEvent'])
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
const { compileScript, parse } = require('@vue/compiler-sfc');
const { transformSync } = require('esbuild');
const vue = require('vue');
const { createApp, defineComponent, h, nextTick, reactive } = vue;
const cleanups = [];
const theme = reactive({ value: 'light' });
let components = {};
let records = {};
let messages = [];
let themeReads = 0;
// 基线演示依赖 Nuxt 自动导入，测试也提供同一组 Vue API。
for (const key of ['ref', 'computed', 'shallowRef', 'onMounted', 'onUnmounted', 'onBeforeUnmount', 'watch', 'useTemplateRef']) globalThis[key] = vue[key];
const snapshot = process.env.E5_SOURCE_SNAPSHOT ? JSON.parse(readFileSync(process.env.E5_SOURCE_SNAPSHOT, 'utf8')) : {};
function readSource(file) { return snapshot[file.replaceAll('\\', '/').replace(`${process.cwd().replaceAll('\\', '/')}/`, '')] ?? readFileSync(file, 'utf8'); }
const wrapper = defineComponent({ setup: (_props, { slots }) => () => h('div', [slots.tag?.(), slots.default?.(), slots.note?.()]) });

/** 编译真实演示，公共 UI 仅替换为记录契约的控件。 */
function load(file) {
  const absolute = path.resolve(file);
  let script = readSource(absolute);
  if (file.endsWith('.vue')) {
    const { descriptor } = parse(script, { filename: absolute });
    script = compileScript(descriptor, { id: absolute, inlineTemplate: true, fs: { fileExists: existsSync, readFile: name => readFileSync(name, 'utf8') } }).content;
  }
  const code = transformSync(script, { loader: 'ts', format: 'cjs' }).code;
  const module = { exports: {} };
  const localRequire = (id) => {
    if (id === '#components') return new Proxy({}, { get: (_target, name) => components[name] || wrapper });
    if (id === '#imports') return { useColorMode: () => { themeReads++; return theme; } };
    if (id === '@vueuse/core') return { ...require(id), useColorMode: () => vue.computed(() => theme.value) };
    if (id.endsWith('/reborn-toast/index')) return { message: new Proxy({}, { get: (_target, type) => (...args) => { messages.push({ type, args }); return Promise.resolve(); } }) };
    if (id.endsWith('/useTree')) return { useTree: () => ({ getPath: () => [] }) };
    if (id.endsWith('.vue')) return components[path.basename(id, '.vue')] || wrapper;
    if (id.startsWith('~/') || id.startsWith('@/') || id.startsWith('.')) {
      let target = id.startsWith('.') ? path.resolve(path.dirname(absolute), id) : path.resolve('app', id.slice(2));
      if (!existsSync(target)) target += '.ts';
      return load(target);
    }
    return require(id);
  };
  runInThisContext(`(function(module,exports,require){${code}\n})`)(module, module.exports, localRequire);
  return file.endsWith('.vue') ? module.exports.default : module.exports;
}

function observe(name, props, render) {
  components[name] = defineComponent({
    name, inheritAttrs: false, props: Object.fromEntries(props.map(key => [key, key === 'destroyOnClose' ? Boolean : null])),
    emits: ['update:modelValue', 'update:selectedKeys', 'select', 'drop'],
    setup(props, { attrs, emit, slots, expose }) {
      const record = { props, attrs, emit };
      (records[name] ||= []).push(record);
      expose({ abort() {}, submit() {}, handleStart() {}, clearFiles() {} });
      return () => render ? render({ props, attrs, emit, slots }) : h('div');
    },
  });
}

function mount(name) {
  components.RebornButton ||= defineComponent({ props: ['label', 'disabled'], setup: (props, { attrs, slots }) => () => h('button', { ...attrs, disabled: props.disabled }, props.label || slots.default?.()) });
  components.Playground ||= wrapper;
  const source = parse(readSource(`app/components/reborn/examples/${name}`)).descriptor.template.content;
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp(load(`app/components/reborn/examples/${name}`));
  const warnings = [];
  app.config.warnHandler = message => warnings.push(message);
  for (const name of new Set([...source.matchAll(/<([A-Z]\w*)\b/g)].map(match => match[1]))) app.component(name, components[name] || wrapper);
  app.directive('track', {});
  app.mount(root);
  let mounted = true;
  const unmount = () => { if (mounted) { app.unmount(); root.remove(); mounted = false; } };
  cleanups.push(unmount);
  return { root, warnings, unmount };
}

function button(root, label) {
  const target = [...root.querySelectorAll('button')].find(node => node.textContent.includes(label));
  assert.ok(target, label);
  target.click();
}

/** 可控时钟能证明卸载确实取消回调，而非等待超时自然结束。 */
function fakeClock() {
  let next = 0;
  const timers = new Map();
  const frames = new Map();
  const intervals = new Map();
  const originals = Object.fromEntries(['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'setInterval', 'clearInterval'].map(key => [key, globalThis[key]]));
  Object.assign(globalThis, {
    setTimeout: fn => { timers.set(++next, fn); return next; }, clearTimeout: id => timers.delete(id),
    requestAnimationFrame: fn => { frames.set(++next, fn); return next; }, cancelAnimationFrame: id => frames.delete(id),
    setInterval: fn => { intervals.set(++next, fn); return next; }, clearInterval: id => intervals.delete(id),
  });
  cleanups.unshift(() => Object.assign(globalThis, originals));
  return { timers, frames, intervals };
}

afterEach(() => {
  for (const cleanup of cleanups.reverse()) cleanup();
  cleanups.length = 0;
  components = {}; records = {}; messages = []; themeReads = 0; theme.value = 'light';
});

it('ShaderToy 三个预设切换均更新源码，并复用同一个渲染实例', async () => {
  observe('ShaderToy', ['shaderCode']);
  observe('RebornSelect', ['modelValue', 'options']);
  const demo = mount('shader-toy/ShaderToyDemo.vue');
  const selector = records.RebornSelect[0];
  assert.equal(selector.props.options.length, 3);
  const sources = new Set();
  for (const option of selector.props.options) {
    selector.emit('update:modelValue', option.value);
    await nextTick();
    sources.add(records.ShaderToy[0].props.shaderCode);
  }
  assert.equal(sources.size, 3);
  assert.equal(records.ShaderToy.length, 1);
  assert.deepEqual(demo.warnings, []);
});

it('两个 Sparkles 示例各读取一次 Nuxt 主题，切换颜色不创建新主题实例', async () => {
  observe('Sparkles', ['particleColor']);
  const first = mount('sparkles/SparklesDemo.vue');
  const second = mount('sparkles/SparklesFullPageDemo.vue');
  assert.equal(themeReads, 2);
  assert.deepEqual(records.Sparkles.map(item => item.props.particleColor), ['#000000', '#000000']);
  theme.value = 'dark'; await nextTick();
  assert.deepEqual(records.Sparkles.map(item => item.props.particleColor), ['#FFFFFF', '#FFFFFF']);
  theme.value = 'light'; await nextTick();
  assert.equal(themeReads, 2);
  assert.deepEqual([...first.warnings, ...second.warnings], []);
});

it('树点选和筛选保留数据身份，拖拽后重置还原初始结构', async () => {
  observe('RebornTree', ['treeData', 'selectedKeys', 'filterTreeNode', 'loadData']);
  observe('RebornInput', ['modelValue']);
  const { root } = mount('reborn-tree/RebornTreeDemo.vue');
  const initial = records.RebornTree.map(item => item.props.treeData);
  const selected = records.RebornTree.find(item => item.props.selectedKeys);
  selected.emit('update:selectedKeys', ['frontend']);
  records.RebornInput[0].emit('update:modelValue', '支付');
  await nextTick();
  records.RebornTree.forEach((item,index) => assert.equal(item.props.treeData, initial[index]));
  const play = records.RebornTree[0];
  const before = JSON.stringify(play.props.treeData);
  play.emit('drop', { dragNode: play.props.treeData[1], node: play.props.treeData[0], dropPosition: 0 });
  await nextTick();
  assert.notEqual(JSON.stringify(play.props.treeData), before);
  button(root, '重置配置'); await nextTick();
  assert.equal(JSON.stringify(play.props.treeData), before);
});

it('树异步加载卸载会取消 timer 并完成待定 Promise', async () => {
  const clock = fakeClock();
  observe('RebornTree', ['treeData', 'loadData']);
  const demo = mount('reborn-tree/RebornTreeDemo.vue');
  const lazy = records.RebornTree.find(item => item.props.loadData);
  const result = lazy.props.loadData(lazy.props.treeData[0]);
  assert.equal(clock.timers.size, 1);
  demo.unmount();
  await result;
  assert.equal(clock.timers.size, 0);
  assert.equal(lazy.props.treeData[0].children, undefined);
});

it('Textarea 上限控件与预览、复制代码同步', async () => {
  observe('Playground', ['modelValue', 'controls', 'code'], ({ slots }) => h('div', slots.default?.()));
  observe('RebornTextarea', ['maxlength']);
  mount('reborn-textarea/RebornTextareaDemo.vue');
  const play = records.Playground[0];
  assert.equal(play.props.controls.flatMap(item => item.children).find(item => item.key === 'maxlength').defaultValue, 200);
  assert.equal(records.RebornTextarea[0].props.maxlength, 200);
  play.emit('update:modelValue', { ...play.props.modelValue, maxlength: 320 }); await nextTick();
  assert.equal(records.RebornTextarea[0].props.maxlength, 320);
  assert.match(play.props.code, /:maxlength="320"/);
});

it('TimePicker 时间事件同步父级模型、受控属性和复制代码', async () => {
  observe('Playground', ['modelValue', 'controls', 'code'], ({ slots }) => h('div', slots.default?.()));
  observe('RebornTimePicker', ['modelValue']);
  const demo = mount('reborn-time-picker/RebornTimePickerDemo.vue');
  const play = records.Playground[0];
  const preview = records.RebornTimePicker[0];
  assert.equal(preview.props.modelValue, '09:30:15');
  preview.emit('update:modelValue', '10:45:30');
  await nextTick();
  assert.equal(preview.props.modelValue, '10:45:30');
  assert.equal(play.props.modelValue.value, '10:45:30');
  assert.match(play.props.code, /shallowRef\("10:45:30"\)/);
  preview.emit('update:modelValue', '');
  await nextTick();
  assert.equal(preview.props.modelValue, '');
  assert.equal(play.props.modelValue.value, '');
  assert.match(play.props.code, /shallowRef\(""\)/);
  assert.deepEqual(demo.warnings, []);
});

it('上传关闭预览立即卸载视频，重复压缩文案不产生重复 key', async () => {
  observe('RebornUpload', ['onPreview', 'onSuccess', 'beforeUpload', 'fileList']);
  observe('RebornDialog', ['modelValue', 'destroyOnClose'], ({ slots }) => h('div', slots.default?.()));
  const demo = mount('reborn-upload/RebornUploadDemo.vue');
  records.RebornUpload.find(item => item.props.onPreview).props.onPreview({ name: '音轨.mp4', url: 'blob:test', raw: { type: 'video/mp4' } });
  await nextTick();
  assert.ok(demo.root.querySelector('video'));
  assert.equal(records.RebornDialog[0].props.destroyOnClose, true);
  records.RebornDialog[0].emit('update:modelValue', false); await nextTick();
  assert.equal(demo.root.querySelector('video'), null);
  const compress = records.RebornUpload.find(item => item.props.beforeUpload);
  for (let i = 0; i < 2; i++) compress.props.onSuccess({ original: 2048, submitted: 1024 }, { name: '同一张.jpg' });
  await nextTick();
  assert.equal(demo.root.textContent.match(/同一张.jpg/g).length, 2);
  assert.equal(demo.warnings.some(message => message.includes('Duplicate keys')), false);
});

it('上传录像卸载立即取消 rAF、停止录制及媒体轨道', async () => {
  const clock = fakeClock();
  let stops = 0;
  let trackStops = 0;
  const originalContext = dom.window.HTMLCanvasElement.prototype.getContext;
  const originalStream = dom.window.HTMLCanvasElement.prototype.captureStream;
  const originalRecorder = globalThis.MediaRecorder;
  dom.window.HTMLCanvasElement.prototype.getContext = () => ({ fillRect() {}, fillText() {} });
  dom.window.HTMLCanvasElement.prototype.captureStream = () => ({ getTracks: () => [{ stop: () => trackStops++ }] });
  globalThis.MediaRecorder = class {
    static isTypeSupported() { return true; }
    state = 'inactive';
    start() { this.state = 'recording'; }
    stop() { this.state = 'inactive'; stops++; this.onstop?.(); }
  };
  cleanups.unshift(() => {
    dom.window.HTMLCanvasElement.prototype.getContext = originalContext;
    dom.window.HTMLCanvasElement.prototype.captureStream = originalStream;
    globalThis.MediaRecorder = originalRecorder;
  });
  observe('RebornUpload', ['httpRequest']);
  const demo = mount('reborn-upload/RebornUploadDemo.vue');
  button(demo.root, '生成示例视频');
  assert.equal(clock.frames.size, 1);
  demo.unmount(); await nextTick(); await Promise.resolve();
  assert.equal(clock.frames.size, 0);
  assert.equal(stops, 1);
  assert.ok(trackStops > 0);
  assert.equal(messages.some(item => item.type === 'error'), false);
});

it('Toast 的同 key 后续消息与全局配置 timer 不跨页面执行', async () => {
  const clock = fakeClock();
  const demo = mount('reborn-toast/RebornToastDemo.vue');
  button(demo.root, '同 key');
  assert.equal(clock.timers.size, 1);
  demo.unmount();
  assert.equal(clock.timers.size, 0);
  assert.equal(messages.some(item => item.type === 'success'), false);
});

it('Toast 未启动全局演示时卸载不改写消息配置', () => {
  const demo = mount('reborn-toast/RebornToastDemo.vue');
  demo.unmount();
  assert.deepEqual(messages, []);
});

it('Transition 重复播放只保留一帧，卸载取消帧与 timer', () => {
  const clock = fakeClock();
  const demo = mount('reborn-transition/RebornTransitionDemo.vue');
  button(demo.root, '播放动画'); button(demo.root, '播放动画');
  assert.equal(clock.frames.size, 1);
  demo.unmount();
  assert.equal(clock.frames.size, 0);
  assert.equal(clock.timers.size, 0);
});

it('Track 事件流封顶 50 条且保留最新记录', async () => {
  fakeClock();
  const { root } = mount('track/TrackDemo.vue');
  for (let index = 0; index < 75; index++) window.dispatchEvent(new CustomEvent('track:event', { detail: { eventName: `测试事件-${index}`, params: {}, timestamp: index } }));
  await nextTick();
  assert.equal(root.querySelectorAll('.border-l-primary').length, 50);
  assert.match(root.textContent, /测试事件-74/);
  assert.equal(root.textContent.includes('测试事件-24'), false);
});

it('Testimonial 演示的头像地址在独立挂载间完全一致', () => {
  observe('TestimonialSlider', ['testimonials']);
  mount('testimonial-slider/TestimonialSliderDemo.vue');
  mount('testimonial-slider/TestimonialSliderDemo.vue');
  assert.deepEqual(records.TestimonialSlider[0].props.testimonials.map(item => item.img), records.TestimonialSlider[1].props.testimonials.map(item => item.img));
});

it('Timeline 数据驱动示例用真实组件渲染时不出现字面 HTML 标签，说明文字不再声称按 HTML 解析', () => {
  // 先载入真实节点组件，再载入真实时间线，使 items 模式走组件默认的文本渲染分支
  components.RebornTimelineItem = load('app/components/reborn/ui/reborn-timeline/RebornTimelineItem.vue');
  components.RebornTimeline = load('app/components/reborn/ui/reborn-timeline/RebornTimeline.vue');
  const { root, warnings } = mount('reborn-timeline/RebornTimelineDemo.vue');
  assert.deepEqual(warnings, []);
  assert.match(root.textContent, /确定 v1\.2\.0 发布范围/);
  assert.equal(/<\/?(?:strong|code|em|b)\b/.test(root.textContent), false, '默认文本渲染下不应出现字面标签');
  assert.equal(root.textContent.includes('按 HTML 解析'), false);
});
