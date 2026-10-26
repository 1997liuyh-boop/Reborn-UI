/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { afterEach, it } from 'node:test';
import { runInThisContext } from 'node:vm';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html class="dark"><body></body></html>', { url: 'http://localhost' });
for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
const { parse, compileScript } = require('@vue/compiler-sfc');
const { transformSync } = require('esbuild');
const vue = require('vue');
const { createApp, defineComponent, h, nextTick, shallowRef } = vue;
const theme = shallowRef('dark');
const cleanups = [];
const stubs = {};
const passthrough = defineComponent({ setup: (_, { slots }) => () => h('div', [slots.tag?.(), slots.default?.()]) });
stubs.RebornButton = defineComponent({
  props: ['label', 'disabled'],
  setup: (props, { attrs, slots }) => () => h('button', { ...attrs, disabled: props.disabled }, props.label || slots.default?.()),
});

/** 编译真实演示源码；仅替换其外部 UI，保留状态、生命周期与模板事件接线。 */
function compile(file, inlineTemplate = true) {
  let source = readFileSync(file, 'utf8');
  const helpers = ['ref', 'shallowRef', 'computed', 'reactive', 'watch', 'onBeforeUnmount', 'onMounted', 'useId', 'useTemplateRef'];
  const imported = [...source.matchAll(/import\s*\{([^}]+)\}\s*from\s*["']vue["']/g)].flatMap(match => match[1].split(',').map(value => value.trim()));
  const missing = helpers.filter(name => new RegExp(`\\b${name}\\s*[(<]`).test(source) && !imported.includes(name));
  if (missing.length) source = source.replace(/(<script[^>]*>)/, `$1\nimport { ${missing.join(', ')} } from 'vue';`);
  const { descriptor } = parse(source, { filename: file });
  const content = compileScript(descriptor, { id: file, inlineTemplate }).content;
  const code = transformSync(content, { loader: 'ts', format: 'cjs' }).code;
  const module = { exports: {} };
  const localRequire = id => {
    if (id === '#imports') return { useColorMode: () => ({ get value() { return theme.value; } }) };
    if (id.endsWith('.svg')) return '/logo.svg';
    if (id.endsWith('.vue')) return stubs[path.basename(id, '.vue')] || passthrough;
    if (id.includes('reborn-alert.config')) {
      const actual = readFileSync('app/components/reborn/ui/reborn-alert/reborn-alert.config.ts', 'utf8');
      return Object.fromEntries(['alertTypes', 'alertVariants'].map(name => [name, JSON.parse(actual.match(new RegExp(`const ${name} = (\\[[^;]+?\\])`))[1].replaceAll("'", '"'))]));
    }
    return require(id);
  };
  runInThisContext(`(function(module, exports, require) { ${code}\n})`)(module, module.exports, localRequire);
  return module.exports.default;
}

function mount(component, extra = {}) {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp(component);
  for (const name of ['DemoSection', 'DemoBlock', 'DemoNote', 'Playground', 'Icon']) app.component(name, passthrough);
  for (const [name, stub] of Object.entries({ ...stubs, ...extra })) app.component(name, stub);
  const vm = app.mount(root);
  const stop = () => { app.unmount(); root.remove(); };
  cleanups.push(stop);
  return { root, vm, stop };
}
afterEach(() => { cleanups.splice(0).forEach(stop => stop()); });
const flush = async () => { await Promise.resolve(); await nextTick(); await Promise.resolve(); };

it('关闭后重开隔离旧异步链；完成与卸载均无残留计时', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const loaders = [];
  const loader = defineComponent({ props: ['steps', 'loading', 'preventClose'], emits: ['close'], setup(props, { emit }) { loaders.push({ props, emit }); return () => h('div'); } });
  const view = mount(compile('app/components/reborn/examples/multi-step-loader/MultiStepLoaderDemo.vue'), { MultiStepLoader: loader });
  const button = view.root.querySelectorAll('button')[1];
  button.click(); await flush();
  const flow = loaders[1];
  assert.deepEqual(flow.props.steps.slice(0, 3).map(step => step.async), [true, true, true]);
  context.mock.timers.tick(2000); await flush();
  assert.deepEqual(flow.props.steps.slice(0, 3).map(step => step.async), [false, true, true]);
  flow.emit('close'); await flush(); button.click(); await flush();
  context.mock.timers.tick(1000); await flush();
  assert.deepEqual(flow.props.steps.slice(0, 3).map(step => step.async), [true, true, true]);
  context.mock.timers.tick(1000); await flush();
  assert.deepEqual(flow.props.steps.slice(0, 3).map(step => step.async), [false, true, true]);
  context.mock.timers.tick(1000); await flush();
  assert.equal(flow.props.steps[1].async, true);
  context.mock.timers.tick(2000); await flush();
  assert.equal(flow.props.steps[1].async, false);
  context.mock.timers.tick(2500); await flush();
  assert.equal(flow.props.steps[2].async, false);
  flow.props.steps[3].action(); await flush();
  assert.match(view.root.textContent, /异步流程已走完/);
  button.click(); await flush();
  view.stop(); cleanups.pop();
  context.mock.timers.tick(20000); await flush();
  assert.equal(view.root.innerHTML, '');
});

it('输出 HSL 只更新回显，不回写色板输入', async () => {
  let picker;
  const ColorPicker = defineComponent({ props: ['value'], emits: ['value-change'], setup(props, { emit, slots }) { picker = { props, emit }; return () => h('div', slots.default?.()); } });
  const view = mount(compile('app/components/reborn/examples/color-picker/ColorPickerDemo.vue'), { ColorPicker });
  picker.emit('value-change', { hex: '#000000', hsl: { h: 250, s: 0, l: 0, a: 1 }, hsla: { h: 250, s: 0, l: 0, a: 1 }, rgb: { r: 0, g: 0, b: 0, a: 1 }, rgba: { r: 0, g: 0, b: 0, a: 1 } });
  await flush();
  assert.equal(picker.props.value, '#A35fFF');
  assert.match(view.root.querySelector('pre').textContent, /#000000/);
});

it('计时已到期但异步续段尚未执行时卸载，不会再排入下一步', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const scheduled = context.mock.method(globalThis, 'setTimeout');
  const view = mount(compile('app/components/reborn/examples/multi-step-loader/MultiStepLoaderDemo.vue'), { MultiStepLoader: passthrough });
  view.root.querySelectorAll('button')[1].click(); await flush();
  context.mock.timers.tick(2000);
  view.stop(); cleanups.pop();
  const count = scheduled.mock.callCount();
  await flush();
  assert.equal(scheduled.mock.callCount(), count);
});

it('提示关闭后通过参数变更或重置恢复，保持同一组件实例', async () => {
  let alert;
  let created = 0;
  stubs.RebornAlert = defineComponent({ props: ['show'], emits: ['update:show'], setup(props, { emit }) { created++; alert ||= { props, emit }; return () => props.show === false ? null : h('aside', '提示'); } });
  const component = compile('app/components/reborn/examples/reborn-alert/RebornAlertDemo.vue', false);
  component.render = () => null;
  const view = mount(component);
  const state = view.vm.$.setupState;
  state.playgroundShow = false;
  state.state.title = '新标题'; await flush();
  assert.equal(state.playgroundShow, true);
  state.playgroundShow = false;
  state.resetState(); await flush();
  assert.equal(state.playgroundShow, true);
  assert.equal(state.state.title, '');
  const rendered = mount(compile('app/components/reborn/examples/reborn-alert/RebornAlertDemo.vue'));
  const count = created;
  alert.emit('update:show', false); await flush();
  rendered.root.querySelector('button').click(); await flush();
  assert.equal(alert.props.show, true);
  assert.equal(created, count);
});

it('两份光束舞台的 SVG 标识独立且引用存在，渐变属性有效', async () => {
  const Rays = compile('app/components/reborn/examples/lens/Rays.vue');
  const Beams = compile('app/components/reborn/examples/lens/Beams.vue');
  const view = mount({ render: () => h('div', [h(Rays), h(Beams), h(Rays), h(Beams)]) });
  const ids = [...view.root.querySelectorAll('[id]')].map(el => el.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const svg of view.root.querySelectorAll('svg')) {
    const own = new Set([...svg.querySelectorAll('[id]')].map(el => el.id));
    for (const el of svg.querySelectorAll('[filter], [fill], [stroke]')) {
      for (const attr of ['filter', 'fill', 'stroke']) {
        const value = el.getAttribute(attr);
        if (value?.startsWith('url(#')) assert.ok(own.has(value.slice(5, -1)), `${attr} 的 ${value} 必须指向当前 SVG`);
      }
    }
  }
  assert.ok(view.root.querySelector('stop[stop-color="#AF53FF"]'));
  assert.equal(view.root.querySelector('[stopColor], [floodOpacity], [colorInterpolationFilters]'), null);
});

it('三处模式演示跟随站点主题，挂载不改写 html', async () => {
  for (const file of ['balance-slider/BalanceSliderDemo', 'gradient-button/GradientButtonDemo', 'gradient-button/GradientButtonOverview']) {
    theme.value = 'dark';
    const component = compile(`app/components/reborn/examples/${file}.vue`, false);
    component.render = () => null;
    const view = mount(component);
    const state = view.vm.$.setupState;
    assert.equal(state.isDark, true);
    theme.value = 'light'; await flush();
    assert.equal(state.isDark, false);
    assert.equal(document.documentElement.className, 'dark');
  }
});
