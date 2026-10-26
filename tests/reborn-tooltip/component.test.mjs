/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { afterEach, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { runInThisContext } from 'node:vm';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const { compileScript, parse } = require('@vue/compiler-sfc');
const { build } = require('esbuild');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost', pretendToBeVisual: true });
for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent', 'FocusEvent', 'MutationObserver']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
const { createApp, h, ref, shallowRef, nextTick } = await import(pathToFileURL(require.resolve('vue')).href);
// 只替换动画容器，提示内容、定位计算、事件与状态均运行真实源码。
const transitionStub = `import {h,ref} from 'vue'; export default { props:['show','customStyle','customClass'], setup(p,{slots,expose}) { const el=ref(null); expose({el}); return ()=>p.show?h('div',{ref:el,class:p.customClass,style:p.customStyle},slots.default?.()):null; } };`;
const result = await build({
  entryPoints: [path.resolve('app/components/reborn/ui/reborn-tooltip/RebornTooltip.vue')], bundle: true, write: false,
  platform: 'node', format: 'cjs', packages: 'external',
  plugins: [{ name: '测试编译Vue', setup(builder) {
    builder.onResolve({ filter: /^~\// }, args => ({ path: path.resolve('app', `${args.path.slice(2)}.ts`) }));
    builder.onLoad({ filter: /\.vue$/ }, args => {
      if (path.basename(args.path) === 'RebornTransition.vue') return { contents: transitionStub, loader: 'js' };
      const { descriptor, errors } = parse(readFileSync(args.path, 'utf8'), { filename: args.path });
      assert.deepEqual(errors, []);
      return { contents: compileScript(descriptor, { id: args.path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') } }).content, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  } }],
});
const module = { exports: {} };
runInThisContext(`(function(module, exports, require) { ${result.outputFiles[0].text}\n})`)(module, module.exports, require);
const Tooltip = module.exports.default;
const mounted = [];
function mount(initial = {}, slots) {
  const props = shallowRef(initial);
  const opened = ref(initial.open);
  const container = document.createElement('div'); document.body.append(container);
  const app = createApp({ setup: () => () => h(Tooltip, { ...props.value, open: opened.value, 'onUpdate:open': value => { opened.value = value; } }, slots || { default: () => h('button', '触发') }) });
  app.mount(container);
  const cleanup = () => { app.unmount(); container.remove(); };
  mounted.push(cleanup);
  return { props, opened, container, cleanup };
}
function anchor(x = 100) {
  const element = document.createElement('button'); document.body.append(element);
  element.getBoundingClientRect = () => ({ left: x, right: x + 80, top: 100, bottom: 130, width: 80, height: 30, x, y: 100, toJSON: () => ({}) });
  return element;
}
const tick = async () => { await nextTick(); await nextTick(); };
const popup = () => document.querySelector('[role="tooltip"]');
afterEach(() => { mounted.splice(0).forEach(cleanup => cleanup()); document.body.innerHTML = ''; });

it('默认文案转义，显式 HTML 解析且插槽优先', async () => {
  const p = mount({ content: '<strong>已保存</strong>', defaultOpen: true }); await tick();
  assert.equal(popup().textContent, '<strong>已保存</strong>'); assert.equal(popup().querySelector('strong'), null);
  p.props.value = { ...p.props.value, rawContent: true }; await tick(); assert.equal(popup().querySelector('strong').textContent, '已保存');
  p.cleanup(); mounted.pop();
  mount({ content: '<strong>错误回退</strong>', rawContent: true, defaultOpen: true }, { content: () => h('em', '插槽优先') }); await tick();
  assert.equal(popup().querySelector('em').textContent, '插槽优先'); assert.equal(popup().querySelector('strong'), null);
});
it('普通插槽按钮仍支持点击、外部关闭和 Escape', async () => {
  const p = mount({ content: '提示', trigger: 'click', openDelay: 0, closeDelay: 0 }); await tick();
  p.container.querySelector('button').click(); await tick(); assert.ok(popup());
  document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); await tick(); assert.equal(popup(), null);
  p.container.querySelector('button').click(); await tick();
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await tick(); assert.equal(popup(), null);
});
it('普通模式透传根元素属性与事件', async () => {
  let clicks = 0;
  const p = mount({ content: '提示', id: '原有根节点', style: { marginLeft: '3px' }, 'aria-label': '触发说明', onClick: () => clicks++ }); await tick();
  const wrapper = p.container.querySelector('#原有根节点');
  assert.ok(wrapper); assert.equal(wrapper.style.marginLeft, '3px'); assert.equal(wrapper.getAttribute('aria-label'), '触发说明');
  p.container.querySelector('button').click(); assert.equal(clicks, 1);
});
it('虚拟触发支持四种事件且只点击外部时关闭', async () => {
  const button = anchor();
  const p = mount({ virtualTriggering: true, virtualRef: button, content: '虚拟提示', trigger: ['hover', 'focus', 'click', 'contextMenu'], openDelay: 0, closeDelay: 0 }); await tick();
  assert.equal(p.container.querySelector('button'), null);
  button.dispatchEvent(new MouseEvent('mouseenter')); await tick(); assert.ok(popup());
  button.dispatchEvent(new MouseEvent('mouseleave')); await tick(); assert.equal(popup(), null);
  button.dispatchEvent(new FocusEvent('focusin')); await tick(); assert.ok(popup());
  button.dispatchEvent(new FocusEvent('focusout')); await tick(); assert.equal(popup(), null);
  button.click(); await tick(); assert.ok(popup());
  button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); await tick(); assert.ok(popup());
  button.click(); await tick(); assert.equal(popup(), null);
  const event = new MouseEvent('contextmenu', { cancelable: true }); button.dispatchEvent(event); await tick();
  assert.equal(event.defaultPrevented, true); assert.ok(popup());
  document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); await tick(); assert.equal(popup(), null);
});
it('单例同时切锚点、文案和 open，重定位并迁移 ARIA、清理旧监听', async () => {
  const first = anchor(100); const second = anchor(400); first.setAttribute('aria-describedby', '原有描述');
  const p = mount({ virtualTriggering: true, virtualRef: null, content: '', trigger: ['hover', 'focus'], openDelay: 0, closeDelay: 40, open: false }); await tick();
  p.props.value = { ...p.props.value, virtualRef: first, content: '第一个' }; p.opened.value = true; await tick();
  assert.equal(popup().textContent, '第一个'); const id = popup().id;
  assert.equal(first.getAttribute('aria-describedby'), `原有描述 ${id}`); const left = popup().parentElement.style.left;
  first.dispatchEvent(new MouseEvent('mouseleave'));
  p.props.value = { ...p.props.value, virtualRef: second, content: '第二个' }; await tick();
  assert.equal(popup().id, id); assert.equal(popup().textContent, '第二个'); assert.notEqual(popup().parentElement.style.left, left);
  assert.equal(first.getAttribute('aria-describedby'), '原有描述'); assert.equal(second.getAttribute('aria-describedby'), id);
  first.dispatchEvent(new FocusEvent('focusout')); await tick(); assert.ok(popup());
  await new Promise(resolve => setTimeout(resolve, 55)); await tick(); assert.ok(popup());
  second.remove(); await tick(); assert.equal(popup(), null); assert.equal(p.opened.value, false); assert.equal(second.hasAttribute('aria-describedby'), false);
});
it('虚拟引用置空或组件卸载会关闭提示并恢复描述', async () => {
  const button = anchor(); button.setAttribute('aria-describedby', '保留');
  const p = mount({ virtualTriggering: true, virtualRef: button, content: '说明', trigger: 'focus' }); await tick();
  button.dispatchEvent(new FocusEvent('focusin')); await tick(); assert.ok(popup());
  p.props.value = { ...p.props.value, virtualRef: null }; await tick(); assert.equal(popup(), null); assert.equal(button.getAttribute('aria-describedby'), '保留');
  p.props.value = { ...p.props.value, virtualRef: button }; await tick(); button.dispatchEvent(new FocusEvent('focusin')); await tick(); assert.ok(popup());
  p.cleanup(); mounted.pop(); assert.equal(button.getAttribute('aria-describedby'), '保留');
  button.dispatchEvent(new FocusEvent('focusin')); await tick(); assert.equal(popup(), null);
});
it('键盘在单例锚点之间切换不会被同轮失焦关闭', async () => {
  const first = anchor(100); const second = anchor(400);
  const p = mount({ virtualTriggering: true, virtualRef: null, content: '', trigger: ['hover', 'focus'], open: false }); await tick();
  for (const [element, text] of [[first, '第一项'], [second, '第二项']]) {
    element.addEventListener('focus', () => { p.props.value = { ...p.props.value, virtualRef: element, content: text }; p.opened.value = true; });
  }
  first.focus(); await tick(); assert.equal(popup().textContent, '第一项');
  second.focus(); await tick(); assert.equal(popup()?.textContent, '第二项'); assert.equal(p.opened.value, true);
});
it('初始受控打开可等待虚拟节点挂载', async () => {
  const p = mount({ virtualTriggering: true, virtualRef: null, content: '延后挂载', open: true }); await tick(); assert.equal(popup(), null);
  const button = anchor(); p.props.value = { ...p.props.value, virtualRef: button }; await tick(); assert.equal(popup()?.textContent, '延后挂载');
});
it('content 插槽条件增删后提示层随之出现或消失', async () => {
  const withSlot = ref(false);
  const container = document.createElement('div'); document.body.append(container);
  const app = createApp({ setup: () => () => h(Tooltip, { trigger: 'click', openDelay: 0, closeDelay: 0 }, withSlot.value
    ? { default: () => h('button', '触发'), content: () => h('em', '插槽提示') }
    : { default: () => h('button', '触发') }) });
  app.mount(container); mounted.push(() => { app.unmount(); container.remove(); });
  container.querySelector('button').click(); await tick();
  assert.equal(popup(), null);
  withSlot.value = true; await tick();
  container.querySelector('button').click(); await tick();
  assert.equal(popup()?.querySelector('em')?.textContent, '插槽提示');
  withSlot.value = false; await tick();
  assert.equal(popup(), null);
});
