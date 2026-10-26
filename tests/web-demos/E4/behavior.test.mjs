/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { afterEach, it } from 'node:test';
import { runInThisContext } from 'node:vm';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>');
for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node']) Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
const vue = require('vue');
const { createApp, defineComponent, h, nextTick } = vue;
const { parse, compileScript } = require('@vue/compiler-sfc');
const { transformSync } = require('esbuild');
const cleanups = [];
const vueWarnings = [];
const noticeCalls = [];
const notices = new Map();
const notification = new Proxy({ destroy(key) { if (key) notices.delete(key); else notices.clear(); } }, { get(target, key) {
  if (key in target) return target[key];
  return (options) => { const handle = { close() { notices.delete(options.key); } }; noticeCalls.push({ type: key, options, handle }); if (options.key) notices.set(options.key, options); return handle; };
} });
const box = defineComponent({ inheritAttrs: false, setup: (_, { slots }) => () => h('div', [slots.tag?.(), slots.default?.()]) });
const Button = defineComponent({ props: ['label', 'disabled'], setup: (props, { attrs, slots }) => () => h('button', { ...attrs, disabled: props.disabled }, props.label || slots.default?.()) });
const stubs = { RebornButton: Button };
const examplesDir = 'app/components/reborn/examples';
/** 按演示文件名在 examples 下查找真实源码，测试只依赖仓库内的文件。 */
function findDemoFile(name) {
  for (const dir of readdirSync(examplesDir)) {
    const file = path.join(examplesDir, dir, `${name}.vue`);
    if (existsSync(file)) return file;
  }
  throw new Error(`未找到演示文件 ${name}.vue`);
}
function load(name, inlineTemplate = false) {
  const file = findDemoFile(name);
  const source = readFileSync(file, 'utf8');
  const content = compileScript(parse(source, { filename: file }).descriptor, { id: name, inlineTemplate }).content;
  const code = transformSync(content, { loader: 'ts', format: 'cjs' }).code;
  const module = { exports: {} };
  const localRequire = id => {
    if (id === '#components') return new Proxy({}, { get: (_, key) => stubs[key] || box });
    if (id.endsWith('.vue')) return stubs[path.basename(id, '.vue')] || box;
    if (id.includes('.config') || id.endsWith('/placement')) return new Proxy({}, { get: () => ['sm', 'md', 'lg'] });
    if (id.includes('/reborn-notification')) return new Proxy({ notification }, { get: (target, key) => key === 'notification' ? target.notification : ['info', 'success', 'warning', 'error'] });
    return require(id);
  };
  runInThisContext(`(function(module,exports,require){${code}\n})`)(module, module.exports, localRequire);
  const component = module.exports.default;
  if (!inlineTemplate) component.render = () => null;
  return component;
}
function mount(name, inline = false) {
  const root = document.createElement('div'); document.body.append(root);
  const app = createApp(load(name, inline));
  app.config.warnHandler = message => vueWarnings.push(message);
  const components = { ...Object.fromEntries(['DemoBlock', 'DemoItem', 'DemoNote', 'DemoSection', 'Icon', 'Playground'].map(name => [name, box])), ...stubs };
  for (const [name, component] of Object.entries(components)) app.component(name, component);
  const vm = app.mount(root);
  let active = true;
  const stop = () => { if (active) { active = false; app.unmount(); root.remove(); } };
  cleanups.push(stop);
  return { root, state: vm.$.setupState, stop };
}
const flush = async () => { await Promise.resolve(); await nextTick(); await Promise.resolve(); };
afterEach(() => {
  cleanups.splice(0).forEach(stop => stop());
  noticeCalls.length = 0;
  notices.clear();
  for (const key of Object.keys(stubs)) if (key !== 'RebornButton') delete stubs[key];
  assert.deepEqual(vueWarnings.splice(0), [], '未预期的 Vue 警告必须为零');
});

it('Steps 不依赖 Vue 全局 API 补全即可真实挂载', () => {
  for (const key of ['computed', 'defineComponent', 'h', 'ref', 'shallowRef']) assert.equal(Object.hasOwn(globalThis, key), false, `${key} 不应由全局补全`);
  const view = mount('RebornStepsDemo', true);
  assert.match(view.root.textContent, /上一步/);
  assert.match(view.root.textContent, /下一步/);
});

it('三个自定义分页模型独立；12 页示例可保留第 8 页', async () => {
  const pagers = [];
  stubs.RebornPagination = defineComponent({ props: ['modelValue', 'total', 'pageSize'], emits: ['update:modelValue'], setup(props, { emit }) { pagers.push({ props, emit }); return () => h('div'); } });
  const view = mount('RebornPaginationDemo', true);
  const custom = pagers.slice(-3);
  assert.equal(custom.length, 3);
  custom[2].emit('update:modelValue', 8); await flush();
  assert.equal(custom[2].props.modelValue, 8);
  assert.equal(custom[0].props.modelValue, 3);
  assert.equal(custom[1].props.modelValue, 3);
  view.stop();
});

it('页码插槽调用 select，page-size 模型回写演练面板', async () => {
  let selected = 0;
  let preview;
  stubs.RebornPagination = defineComponent({ props: ['modelValue', 'pageSize'], emits: ['update:pageSize'], setup(props, { emit, slots }) {
    preview ||= { props, emit };
    return () => h('div', slots['pager-item']?.({ page: 4, active: false, disabled: false, select: () => { selected++; } }));
  } });
  const view = mount('RebornPaginationDemo', true);
  [...view.root.querySelectorAll('button')].find(button => button.textContent.trim() === '4').click();
  assert.equal(selected, 1);
  preview.emit('update:pageSize', 20); await flush();
  assert.equal(preview.props.pageSize, 20);
});

it('同 key 通知销毁后不会被待执行更新重新创建，卸载亦取消更新', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const view = mount('RebornNotificationDemo', true);
  const click = text => [...view.root.querySelectorAll('button')].find(button => button.textContent.trim() === text).click();
  click('同 key 原位更新');
  click("destroy('sync-task')");
  context.mock.timers.tick(1500); await flush();
  assert.equal(notices.size, 0);
  assert.equal(noticeCalls.filter(call => call.type === 'success').length, 0);
  click('同 key 原位更新'); view.stop();
  context.mock.timers.tick(1500); await flush();
  assert.equal(noticeCalls.filter(call => call.type === 'success').length, 0);
});

it('通知底部两个动作均关闭自己的句柄并回显', () => {
  const { state } = mount('RebornNotificationDemo');
  for (const index of [0, 1]) {
    state.fireVNodeDemo();
    const call = noticeCalls.at(-1);
    let closed = 0;
    call.handle.close = () => { closed++; };
    call.options.footer().children[index].props.onClick();
    assert.equal(closed, 1);
    assert.match(state.lastEvent, /邀请/);
  }
});

it('卸载开关演示会取消延迟确认并以 false 结束 Promise', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let confirms = 0;
  context.mock.method(window, 'confirm', () => { confirms++; return true; });
  const view = mount('RebornSwitchDemo');
  const promise = view.state.handleBeforeChange();
  view.stop(); context.mock.timers.tick(1000);
  assert.equal(await promise, false);
  assert.equal(confirms, 0);
});

it('远程搜索选中结果在收起、清空搜索后仍有标签，卸载取消远程和触底请求', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const view = mount('RebornSelectDemo');
  view.state.onRemoteSearch('30'); context.mock.timers.tick(600); await flush();
  view.state.remoteValue = 'city-30';
  view.state.onRemoteVisibleChange(false);
  assert.equal(view.state.remoteOptions.find(option => option.value === 'city-30').label, '城市站点 30');
  view.state.onRemoteSearch('');
  assert.ok(view.state.remoteOptions.some(option => option.value === 'city-30'));
  view.state.onRemoteSearch('50');
  view.state.onDropdownScroll({ target: { scrollHeight: 100, scrollTop: 50, clientHeight: 50 } });
  const selected = view.state.remoteOptions;
  const rows = view.state.scrollLoadOptions;
  view.stop(); context.mock.timers.tick(1000); await flush();
  assert.equal(view.state.remoteOptions, selected);
  assert.equal(view.state.scrollLoadOptions, rows);
});

it('异步确认离开页面后不再回写状态', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const view = mount('RebornPopconfirmDemo');
  view.state.onAsyncConfirm();
  const action = view.state.lastAction;
  view.stop(); context.mock.timers.tick(2000); await flush();
  assert.equal(view.state.lastAction, action);
});

it('外部关闭在 pointerdown 已回写 false 后保持关闭，打开按钮明确写 true', async () => {
  let popover;
  stubs.RebornPopover = defineComponent({ props: ['open', 'placement'], emits: ['update:open'], setup(props, { emit }) { if (props.placement === 'top' && props.open !== undefined) popover = { props, emit }; return () => h('div'); } });
  const view = mount('RebornPopoverDemo', true);
  const open = [...view.root.querySelectorAll('button')].find(button => button.textContent === '外部打开');
  assert.ok(open); open.click(); await flush();
  assert.equal(popover.props.open, true);
  popover.emit('update:open', false); await flush();
  [...view.root.querySelectorAll('button')].find(button => button.textContent === '外部关闭').click(); await flush();
  assert.equal(popover.props.open, false);
});

it('内容卡片点击保持遮罩打开，背景点击仍可关闭', async () => {
  stubs.RebornOverlay = defineComponent({ props: ['modelValue', 'closeOnClickOverlay'], emits: ['update:modelValue'], setup(props, { emit, slots }) { return () => props.modelValue ? h('aside', { onClick: () => { if (props.closeOnClickOverlay !== false) emit('update:modelValue', false); } }, slots.default?.()) : null; } });
  const view = mount('RebornOverlayDemo', true);
  [...view.root.querySelectorAll('button')].find(button => button.textContent === '展开局部遮罩').click(); await flush();
  [...view.root.querySelectorAll('p')].find(node => node.textContent === '局部遮罩内容').click(); await flush();
  assert.ok(view.root.querySelector('aside'));
  view.root.querySelector('aside').click(); await flush();
  assert.equal(view.root.querySelector('aside'), null);
});

it('表格不因事件回显重建数据或配置；远程总数和提示开关仍响应更新', async () => {
  const tables = [];
  stubs.RebornTable = defineComponent({ props: ['data', 'pagination', 'tooltipOptions', 'treeProps', 'defaultSort', 'showOverflowTooltip'], emits: ['row-click'], setup(props, { emit }) { tables.push({ props, emit }); return () => h('div'); } });
  mount('RebornTableDemo', true);
  assert.ok(tables.length > 20);
  const snapshots = tables.map(table => Object.fromEntries(Object.entries(table.props)));
  tables[0].emit('row-click', { id: 1 }); await flush();
  tables.forEach((table, index) => {
    for (const key of ['data', 'pagination', 'tooltipOptions', 'treeProps', 'defaultSort', 'showOverflowTooltip']) assert.equal(table.props[key], snapshots[index][key], `${index} 的 ${key} 应保持引用`);
  });
  const { state } = mount('RebornTableDemo');
  state.remoteTotal = 123;
  assert.equal(state.remotePagination.total, 123);
  state.tooltipArrow = false;
  assert.equal(state.tableTooltipOptions.arrow, false);
  state.statusEmpty = false;
  assert.equal(state.statusData, state.rows3);
  state.fluidExpanded = true;
  assert.equal(state.fluidData, state.rows);
});

it('表格懒加载卸载后结束等待，不再通知旧实例', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const view = mount('RebornTableDemo');
  let resolved = 0;
  const pending = view.state.loadChildren({ id: 'team', name: '团队' }, {}, () => { resolved++; });
  view.stop(); context.mock.timers.tick(1000); await pending;
  assert.equal(resolved, 0);
});

it('静态气泡缩略图页面滚动后保留内容且不创建真实浮层', async () => {
  let mounted = 0;
  stubs.RebornPopover = stubs.RebornPopconfirm = defineComponent({ setup() { mounted++; return () => null; } });
  for (const name of ['RebornPopoverOverview', 'RebornPopconfirmOverview']) {
    const view = mount(name, true);
    window.dispatchEvent(new window.Event('scroll')); await flush();
    assert.match(view.root.textContent, /预计明天送达|确定删除这条记录/);
  }
  assert.equal(mounted, 0);
});

it('搜索框演练控件使用 Web 真实契约，外部历史可回写且本地历史键独立', async () => {
  let playground;
  const searchBoxes = [];
  stubs.Playground = defineComponent({ props: ['modelValue'], emits: ['update:modelValue'], setup(props, { emit, slots }) { playground = { props, emit }; return () => h('div', slots.default?.()); } });
  stubs.RebornSearchBox = defineComponent({ props: ['modelValue', 'history', 'historyKey', 'showDropdown', 'size', 'shape'], emits: ['update:history'], setup(props, { emit }) { searchBoxes.push({ props, emit }); return () => h('div'); } });
  mount('RebornSearchBoxDemo', true);
  const preview = searchBoxes[0];
  assert.equal(preview.props.showDropdown, true);
  playground.emit('update:modelValue', { ...playground.props.modelValue, showDropdown: false, size: 'lg', shape: 'square' }); await flush();
  assert.equal(preview.props.showDropdown, false);
  assert.equal(preview.props.size, 'lg');
  assert.equal(preview.props.shape, 'square');
  preview.emit('update:history', ['新关键词']); await flush();
  assert.deepEqual(preview.props.history, ['新关键词']);
  const localKeys = searchBoxes.slice(1).map(box => box.props.historyKey);
  assert.equal(new Set(localKeys).size, localKeys.length);
  assert.ok(localKeys.every(Boolean));
});
