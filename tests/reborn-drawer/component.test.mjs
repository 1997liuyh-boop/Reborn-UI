/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { after, it } from 'node:test';
import { runInThisContext } from 'node:vm';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

// 使用真实组件、传送、过渡与全局滚动锁，只替代图标显示。
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent', 'FocusEvent', 'getComputedStyle']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
globalThis.requestAnimationFrame = callback => setTimeout(callback, 1);
globalThis.cancelAnimationFrame = clearTimeout;
const { createApp, h, ref, nextTick } = await import('vue');
const source = 'app/components/reborn/ui/reborn-drawer/RebornDrawer.vue';
const result = await build({
  entryPoints: [path.resolve(source)],
  bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external',
  alias: { '~': path.resolve('app'), '@': path.resolve('app') },
  plugins: [{ name: 'vue-test', setup(builder) {
    builder.onLoad({ filter: /\.vue$/ }, args => {
      const { descriptor } = parse(readFileSync(args.path, 'utf8'), { filename: args.path });
      const compiled = compileScript(descriptor, { id: args.path, inlineTemplate: true, fs: {
        fileExists: existsSync, readFile: file => readFileSync(file, 'utf8'),
      } });
      return { contents: compiled.content, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  } }],
});
const module = { exports: {} };
runInThisContext(`(function(module, exports, require) { ${result.outputFiles[0].text}\n})`)(module, module.exports, createRequire(import.meta.url));
const Drawer = module.exports.default;
const mounted = [];
const wait = async (ms = 70) => { await nextTick(); await new Promise(resolve => setTimeout(resolve, ms)); await nextTick(); };
function mount(props = {}, slots = {}) {
  const model = ref(false); const options = ref({ duration: 0, ...props }); const events = [];
  const container = document.createElement('div'); document.body.append(container);
  const app = createApp({ render: () => h(Drawer, { ...options.value, modelValue: model.value, 'onUpdate:modelValue': value => { model.value = value; },
    ...Object.fromEntries(['Open', 'Opened', 'Close', 'Closed', 'OpenAutoFocus', 'CloseAutoFocus', 'ResizeStart', 'Resize', 'ResizeEnd'].map(event => [`on${event}`, (...args) => events.push([event, ...args])])),
  }, { default: () => h('input', { 'data-content': '', placeholder: '内容' }), ...slots }) });
  app.component('Icon', { render: () => h('i') });
  const instance = app.mount(container);
  const cleanup = () => { app.unmount(); container.remove(); }; mounted.push(cleanup);
  return { model, options, events, instance, cleanup, open: async () => { model.value = true; await wait(); }, close: async () => { model.value = false; await wait(); }, panel: () => document.querySelector('[role="dialog"]:not([style*="display: none"])') };
}
function reset() { while (mounted.length) mounted.pop()(); document.querySelectorAll('[data-host]').forEach(el => el.remove()); }
after(() => { reset(); dom.window.close(); });

it('默认从右侧打开、挂载 body、无 header、默认尺寸 30%', async () => {
  reset(); const p = mount(); await p.open(); const panel = p.panel(); assert.ok(panel); assert.equal(panel.style.width, '30%'); assert.equal(panel.querySelector('header'), null); assert.equal(panel.parentElement.parentElement, document.body); await p.close();
});
it('四个方向与数值/百分比尺寸都生效', async () => {
  for (const direction of ['top', 'right', 'bottom', 'left']) { reset(); const p = mount({ direction, size: '320' }); await p.open(); assert.equal(p.panel().style[['left', 'right'].includes(direction) ? 'width' : 'height'], '320px'); await p.close(); }
});
it('header 总插槽覆盖 title close extra；withHeader=false 不渲染头部', async () => {
  reset(); const p = mount({ withHeader: true, title: '标题' }, { title: () => '自定义标题', extra: () => h('button', {}, '操作') }); await p.open(); assert.match(p.panel().querySelector('header').textContent, /自定义标题.*操作/); assert.ok(p.panel().querySelector('[aria-label="关闭抽屉"]')); p.options.value.withHeader = false; await wait(); assert.equal(p.panel().querySelector('header'), null);
  reset(); const q = mount({ withHeader: true }, { header: () => h('b', {}, '完整头部'), extra: () => '不显示' }); await q.open(); assert.equal(q.panel().querySelector('header').textContent, '完整头部');
});
it('关闭回调默认取消，仅 done(false) 放行，重复回调无效', async () => {
  reset(); let done; const p = mount({ withHeader: true, beforeClose: callback => { done = callback; } }); await p.open(); p.panel().querySelector('button').click(); done(); await wait(); assert.equal(p.model.value, true);
  p.panel().querySelector('button').click(); done(true); await wait(); assert.equal(p.model.value, true);
  p.panel().querySelector('button').click(); done(false); done(false); await wait(); assert.equal(p.model.value, false); assert.equal(p.events.filter(([name]) => name === 'Close').length, 1);
});
it('打开和关闭延迟可取消，不产生过期事件', async () => {
  reset(); const p = mount({ openDelay: 45, closeDelay: 45 }); p.model.value = true; await wait(5); assert.equal(p.panel(), null); p.model.value = false; await wait(60); assert.equal(p.events.length, 0);
  await p.open(); await wait(60); assert.ok(p.panel()); p.model.value = false; await wait(5); p.model.value = true; await wait(60); assert.equal(p.events.filter(([name]) => name === 'Close').length, 0); assert.ok(p.panel());
});
it('内容默认保留，destroyOnClose 在退场完成后销毁', async () => {
  reset(); let p = mount(); await p.open(); const input = p.panel().querySelector('input'); input.value = '保留'; await p.close(); await p.open(); assert.equal(p.panel().querySelector('input'), input); assert.equal(input.value, '保留');
  reset(); p = mount({ destroyOnClose: true }); await p.open(); const old = p.panel().querySelector('input'); await p.close(); assert.equal(document.body.contains(old), false); await p.open(); assert.notEqual(p.panel().querySelector('input'), old);
});
it('遮罩关闭与穿透开关独立，透明遮罩仍可拦截', async () => {
  reset(); const p = mount({ modal: false }); await p.open(); let mask = document.querySelector('[data-drawer-backdrop]'); assert.ok(mask); assert.match(mask.className, /bg-transparent/); p.options.value.closeOnClickModal = false; await wait(); mask.click(); await wait(); assert.equal(p.model.value, true); p.options.value.modalPenetrable = true; await wait(); assert.match(document.querySelector('[data-drawer-backdrop]').className, /pointer-events-none/); p.options.value.modal = true; await wait(); mask = document.querySelector('[data-drawer-backdrop]'); assert.ok(mask); p.options.value.closeOnClickModal = true; await wait(); mask.click(); await wait(); assert.equal(p.model.value, false);
});
it('嵌套抽屉只响应最上层 ESC，并独立持有滚动锁', async () => {
  reset(); const p = mount(); const q = mount(); await p.open(); await q.open(); assert.equal(document.documentElement.style.overflow, 'hidden'); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await wait(); assert.equal(p.model.value, true); assert.equal(q.model.value, false); assert.equal(document.documentElement.style.overflow, 'hidden'); await p.close(); assert.notEqual(document.documentElement.style.overflow, 'hidden');
});
it('焦点进入内容、Tab 循环、关闭后还原触发元素', async () => {
  reset(); const trigger = document.createElement('button'); document.body.append(trigger); trigger.focus(); const p = mount(); await p.open(); const input = p.panel().querySelector('input'); assert.equal(document.activeElement, input); input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })); assert.equal(document.activeElement, input); await p.close(); assert.equal(document.activeElement, trigger); assert.deepEqual(p.events.map(([name]) => name), ['Open', 'OpenAutoFocus', 'Opened', 'Close', 'CloseAutoFocus', 'Closed']); trigger.remove();
});
it('自定义挂载节点优先于 appendToBody，局部定位且锁可禁用', async () => {
  reset(); const host = document.createElement('div'); host.id = 'drawer-host'; host.dataset.host = ''; document.body.append(host); const p = mount({ appendTo: '#drawer-host', appendToBody: false, lockScroll: false }); await p.open(); assert.ok(host.contains(p.panel())); assert.match(p.panel().parentElement.className, /absolute/); assert.notEqual(document.documentElement.style.overflow, 'hidden');
});
it('键盘调整尺寸触发完整 resize 生命周期', async () => {
  reset(); const p = mount({ resizable: true, size: 300 }); await p.open(); const panel = p.panel(); panel.getBoundingClientRect = () => ({ width: 300, height: 500 }); panel.parentElement.getBoundingClientRect = () => ({ width: 1000, height: 700 }); const handle = panel.querySelector('[role="separator"]'); assert.ok(handle); handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })); await wait(); assert.equal(panel.style.width, '310px'); assert.deepEqual(p.events.filter(([name]) => name.startsWith('Resize')).map(([name]) => name), ['ResizeStart', 'Resize', 'ResizeEnd']);
});
it('卸载时释放锁，过期关闭回调不能影响新实例', async () => {
  reset(); let done; const p = mount({ withHeader: true, beforeClose: cb => { done = cb; } }); await p.open(); p.panel().querySelector('button').click(); reset(); done(false); await wait(); assert.notEqual(document.documentElement.style.overflow, 'hidden'); assert.equal(document.querySelector('[role="dialog"]'), null);
});
it('四个方向指针调整尺寸遵守边界，结束后移除拖动监听', async () => {
  for (const direction of ['left', 'right', 'top', 'bottom']) {
    reset(); const p = mount({ direction, resizable: true, size: 300 }); await p.open();
    const panel = p.panel(); const horizontal = ['left', 'right'].includes(direction);
    panel.getBoundingClientRect = () => ({ width: 300, height: 300 });
    panel.parentElement.getBoundingClientRect = () => ({ width: 600, height: 600 });
    const pointer = (type, coordinate) => {
      const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX: coordinate, clientY: coordinate });
      Object.defineProperty(event, 'pointerId', { value: 1 }); return event;
    };
    panel.querySelector('[role="separator"]').dispatchEvent(pointer('pointerdown', 300));
    const sign = ['left', 'top'].includes(direction) ? 1 : -1;
    document.dispatchEvent(pointer('pointermove', 300 + 100 * sign)); await wait(5);
    assert.equal(panel.style[horizontal ? 'width' : 'height'], '400px');
    document.dispatchEvent(pointer('pointermove', 300 + 1000 * sign)); await wait(5);
    assert.equal(panel.style[horizontal ? 'width' : 'height'], '600px');
    document.dispatchEvent(pointer('pointermove', 300 - 1000 * sign)); await wait(5);
    assert.equal(panel.style[horizontal ? 'width' : 'height'], '80px');
    document.dispatchEvent(pointer('pointerup', 300));
    const count = p.events.length; document.dispatchEvent(pointer('pointermove', 500));
    assert.equal(p.events.length, count); assert.equal(p.events.at(-1)[0], 'ResizeEnd');
  }
});
it('关闭延迟和退场期间保留内容与滚动锁，动画结束后才销毁', async () => {
  reset(); const p = mount({ duration: 100, closeDelay: 60, destroyOnClose: true });
  await p.open(); await wait(150); const input = p.panel().querySelector('input');
  p.model.value = false; await wait(15);
  assert.equal(p.events.some(([name]) => name === 'Close'), false);
  assert.equal(document.body.contains(input), true);
  await wait(65);
  assert.equal(p.events.some(([name]) => name === 'Close'), true);
  assert.equal(document.body.contains(input), true); assert.equal(document.documentElement.style.overflow, 'hidden');
  await wait(160);
  assert.equal(document.body.contains(input), false); assert.notEqual(document.documentElement.style.overflow, 'hidden');
  assert.equal(p.events.at(-1)[0], 'Closed');
});
it('禁用 ESC 不关闭，动态锁定与过期拦截回调相互独立', async () => {
  reset(); let done; const p = mount({ withHeader: true, closeOnPressEscape: false, beforeClose: callback => { done = callback; } });
  await p.open(); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await wait(5); assert.equal(p.model.value, true);
  p.options.value.lockScroll = false; await wait(5); assert.notEqual(document.documentElement.style.overflow, 'hidden');
  p.options.value.lockScroll = true; await wait(5); assert.equal(document.documentElement.style.overflow, 'hidden');
  p.panel().querySelector('button').click(); await p.close(); await p.open(); done(false); await wait(5);
  assert.equal(p.model.value, true);
});
it('打开抽屉仅锁页面根滚动区域，不改变 body 的溢出样式', async () => {
  reset(); const original = document.body.style.overflow;
  const p = mount(); await p.open();
  assert.equal(document.body.style.overflow, original, 'body 不能成为新的滚动容器，否则 sticky 菜单会失去视口定位');
  assert.equal(document.documentElement.style.overflow, 'hidden');
  await p.close(); assert.equal(document.body.style.overflow, original);
  assert.notEqual(document.documentElement.style.overflow, 'hidden');
});


it('进退场结束后仍只对位移过渡，不给拖拽宽高附加动画', async () => {
  reset(); const p = mount({ duration: 30, resizable: true });
  for (let count = 0; count < 2; count++) {
    await p.open();
    assert.ok(p.panel().classList.contains('transition-transform'), '过渡属性必须常驻，不能在入场后回退为 all');
    await p.close();
  }
});
function resizePointer(type, coordinate, pointerId = 1) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX: coordinate, clientY: coordinate });
  // jsdom 的 MouseEvent 会截断小数坐标，显式保留真实 PointerEvent 的亚像素精度。
  Object.defineProperties(event, { pointerId: { value: pointerId }, clientX: { value: coordinate }, clientY: { value: coordinate } });
  return event;
}
function beginResize(p) {
  const panel = p.panel();
  panel.getBoundingClientRect = () => ({ width: 300, height: 300 });
  panel.parentElement.getBoundingClientRect = () => ({ width: 600, height: 600 });
  panel.querySelector('[role="separator"]').dispatchEvent(resizePointer('pointerdown', 300));
  return panel;
}
it('同帧指针移动只提交最后尺寸，相同像素和边界不重复通知', async () => {
  reset(); const p = mount({ resizable: true, size: 300 }); await p.open(); const panel = beginResize(p);
  const changes = () => p.events.filter(([name]) => name === 'Resize');
  for (let x = 299; x >= 200; x--) document.dispatchEvent(resizePointer('pointermove', x));
  assert.equal(changes().length, 0, '指针事件只记录位置，渲染帧统一提交');
  await wait(5); assert.equal(panel.style.width, '400px'); assert.deepEqual(changes(), [['Resize', 400]]);
  document.dispatchEvent(resizePointer('pointermove', 199.9)); await wait(5);
  assert.equal(changes().length, 1, '取整后尺寸不变，不重复通知');
  document.dispatchEvent(resizePointer('pointermove', -500)); await wait(5);
  document.dispatchEvent(resizePointer('pointermove', -600)); await wait(5);
  assert.deepEqual(changes(), [['Resize', 400], ['Resize', 600]]);
  document.dispatchEvent(resizePointer('pointerup', -600));
});
it('帧提交前松手保留最后尺寸，resize-end 后不再出现延迟更新', async () => {
  reset(); const p = mount({ resizable: true, size: 300 }); await p.open(); const panel = beginResize(p);
  document.dispatchEvent(resizePointer('pointermove', 220));
  document.dispatchEvent(resizePointer('pointermove', 100, 2));
  document.dispatchEvent(resizePointer('pointerup', 100, 2));
  assert.equal(p.events.filter(([name]) => name === 'Resize').length, 0);
  document.dispatchEvent(resizePointer('pointerup', 220));
  assert.deepEqual(p.events.filter(([name]) => name.startsWith('Resize')), [['ResizeStart', 300], ['Resize', 380], ['ResizeEnd', 380]]);
  const count = p.events.length; await wait(5);
  assert.equal(panel.style.width, '380px'); assert.equal(p.events.length, count);
});
it('关闭、卸载、取消与禁用拖拽都会清理待提交帧', async () => {
  for (const reason of ['close', 'unmount', 'cancel', 'disable', 'direction', 'size']) {
    reset(); const p = mount({ resizable: true, size: 300 }); await p.open(); beginResize(p);
    document.dispatchEvent(resizePointer('pointermove', 200));
    if (reason === 'close') p.model.value = false;
    if (reason === 'unmount') reset();
    if (reason === 'cancel') document.dispatchEvent(resizePointer('pointercancel', 200));
    if (reason === 'disable') p.options.value.resizable = false;
    if (reason === 'direction') p.options.value.direction = 'top';
    if (reason === 'size') p.options.value.size = 350;
    await nextTick();
    assert.equal(p.events.filter(([name]) => name === 'ResizeEnd').length, 1);
    const count = p.events.filter(([name]) => name.startsWith('Resize')).length;
    await wait(5); document.dispatchEvent(resizePointer('pointermove', 100));
    assert.equal(p.events.filter(([name]) => name.startsWith('Resize')).length, count, reason);
  }
});


// jsdom 没有布局引擎，显式模拟传统滚动条占用的视口宽度。
function mockScrollbar(width) {
  const root = document.documentElement;
  const descriptor = Object.getOwnPropertyDescriptor(root, 'clientWidth');
  Object.defineProperty(root, 'clientWidth', { configurable: true, value: window.innerWidth - width });
  return () => {
    if (descriptor) Object.defineProperty(root, 'clientWidth', descriptor);
    else delete root.clientWidth;
  };
}
it('锁定保留滚动条占位，嵌套抽屉全部关闭后才恢复', async () => {
  reset(); const restore = mockScrollbar(10); const root = document.documentElement;
  const gutterClass = '[scrollbar-gutter:stable]';
  try {
    const p = mount(); const q = mount();
    await p.open(); assert.equal(root.classList.contains(gutterClass), true);
    await q.open(); await q.close(); assert.equal(root.classList.contains(gutterClass), true);
    await p.close(); assert.equal(root.classList.contains(gutterClass), false);
    await p.open(); assert.equal(root.classList.contains(gutterClass), true);
    reset(); assert.equal(root.classList.contains(gutterClass), false);
  } finally { reset(); restore(); }
});
it('没有占宽滚动条或禁用锁定时不添加占位', async () => {
  reset(); let restore = mockScrollbar(0); const root = document.documentElement;
  try {
    const p = mount(); await p.open(); assert.equal(root.classList.contains('[scrollbar-gutter:stable]'), false);
    reset(); restore(); restore = mockScrollbar(10);
    const q = mount({ lockScroll: false }); await q.open(); assert.equal(root.classList.contains('[scrollbar-gutter:stable]'), false);
    q.options.value.lockScroll = true; await wait(5); assert.equal(root.classList.contains('[scrollbar-gutter:stable]'), true);
    q.options.value.lockScroll = false; await wait(5); assert.equal(root.classList.contains('[scrollbar-gutter:stable]'), false);
  } finally { reset(); restore(); }
});
it('不覆盖或移除使用方已有的滚动条占位样式', async () => {
  reset(); const restore = mockScrollbar(10); const root = document.documentElement;
  const previous = root.style.scrollbarGutter; const gutterClass = '[scrollbar-gutter:stable]';
  const originalGetComputedStyle = globalThis.getComputedStyle;
  // 当前 jsdom 尚不支持 scrollbar-gutter 的计算样式，补齐浏览器返回值。
  Object.defineProperty(globalThis, 'getComputedStyle', { configurable: true, value: element => {
    const style = originalGetComputedStyle(element);
    if (element === root) Object.defineProperty(style, 'scrollbarGutter', { value: root.style.scrollbarGutter });
    return style;
  } });
  try {
    root.style.scrollbarGutter = 'stable both-edges';
    const p = mount(); await p.open();
    assert.equal(root.classList.contains(gutterClass), false);
    await p.close(); assert.equal(root.style.scrollbarGutter, 'stable both-edges');
    root.style.scrollbarGutter = previous;
    root.classList.add(gutterClass);
    await p.open(); await p.close(); assert.equal(root.classList.contains(gutterClass), true);
  } finally { reset(); root.style.scrollbarGutter = previous; root.classList.remove(gutterClass); Object.defineProperty(globalThis, 'getComputedStyle', { configurable: true, value: originalGetComputedStyle }); restore(); }
});
