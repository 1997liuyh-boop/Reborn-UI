/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { TableColumn, TableTooltipScope } from '../../app/components/reborn/ui/reborn-table/table.types';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, readFile, rmdir, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { after, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<body></body>', { pretendToBeVisual: true });
const previous = new Map<string, PropertyDescriptor | undefined>();
const globals = {
  window: dom.window, document: dom.window.document, Element: dom.window.Element,
  HTMLElement: dom.window.HTMLElement, SVGElement: dom.window.SVGElement,
  MutationObserver: dom.window.MutationObserver,
  requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
  cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
};
for (const [key, value] of Object.entries(globals)) {
  previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
}
const folder = await mkdtemp(resolve('tests/reborn-table/.runtime-'));
const output = resolve(folder, 'tooltip.mjs');
after(async () => {
  dom.window.close();
  for (const [key, descriptor] of previous) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
  await unlink(output).catch(() => {});
  await rmdir(folder);
});
await build({
  entryPoints: [resolve('app/components/reborn/ui/reborn-table/RebornTable.vue')], outfile: output,
  bundle: true, format: 'esm', platform: 'node', packages: 'external', alias: { '~': resolve('app') },
  plugins: [{ name: 'table-tooltip-test', setup(builder) {
    builder.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'js' }));
    builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
      const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
      return { contents: compileScript(descriptor, { id: 'table-tooltip-test', inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') } }).content, loader: 'ts' };
    });
  } }],
});
const { createApp, defineComponent, h, nextTick, reactive, ref } = await import('vue');
const Table = (await import(pathToFileURL(output).href)).default;

function mount(options: Record<string, unknown> = {}, slots = {}) {
  const container = dom.window.document.createElement('div');
  dom.window.document.body.append(container);
  const props = reactive({
    data: [{ id: 1, name: '原始长内容' }], columns: [{ prop: 'name', label: '姓名', width: 120 }] as TableColumn[],
    showOverflowTooltip: true, tooltipOptions: { openDelay: 0, closeDelay: 0 }, ...options,
  });
  const app = createApp({ render: () => h(Table, props, slots) });
  let tooltipMounts = 0;
  app.mixin({ mounted() { if (this.$options.name === 'RebornTooltip') tooltipMounts += 1; } });
  app.mount(container);
  const cell = () => container.querySelector('tbody td')!;
  const trigger = () => cell().querySelector<HTMLElement>('[data-table-overflow]')!;
  // jsdom 没有排版，只替换几何输入；提示渲染、事件和 Teleport 使用真实组件。
  function geometry(width: number, contentWidth: number) {
    const element = trigger();
    assert.ok(element, '溢出单元格应使用真实 Tooltip 触发区域');
    Object.defineProperties(element, {
      clientWidth: { value: width, configurable: true }, scrollWidth: { value: contentWidth, configurable: true },
      clientHeight: { value: 22, configurable: true }, scrollHeight: { value: 22, configurable: true },
    });
  }
  async function enter(focus = false) {
    const wrapper = trigger().parentElement!.parentElement!;
    wrapper.dispatchEvent(new dom.window.Event(focus ? 'focusin' : 'mouseenter', { bubbles: focus }));
    await nextTick(); await nextTick(); await nextTick();
  }
  return { props, cell, trigger, geometry, enter, get tooltipMounts() { return tooltipMounts; }, stop() { app.unmount(); container.remove(); } };
}
const tooltip = () => dom.window.document.querySelector<HTMLElement>('[role="tooltip"]');

it('大量溢出单元格首屏不创建 Tooltip，首次交互后仅创建并复用当前实例', async () => {
  const t = mount({
    data: Array.from({ length: 24 }, (_, id) => ({ id, name: `第 ${id} 行长文本` })),
    columns: Array.from({ length: 8 }, (_, index) => ({ prop: 'name', columnKey: String(index), width: 120 })),
  });
  try {
    assert.equal(t.tooltipMounts, 0, '192 个单元格不应在首屏提前创建 Tooltip');
    t.geometry(100, 240);
    await t.enter();
    assert.equal(t.tooltipMounts, 1, '只创建正在交互的单元格提示');
    assert.equal(tooltip()?.textContent, '第 0 行长文本');
    t.trigger().parentElement!.parentElement!.dispatchEvent(new dom.window.Event('mouseleave'));
    await nextTick();
    await t.enter();
    assert.equal(t.tooltipMounts, 1, '再次进入时应复用实例');
  } finally { t.stop(); }
});

it('首次键盘聚焦不替换文本节点，并保留 UI 覆盖和 ARIA 关联', async () => {
  const t = mount({ tooltipOptions: { openDelay: 0, closeDelay: 0, ui: { wrapper: 'custom-wrapper', trigger: 'custom-trigger', content: 'custom-content' } } });
  try {
    t.geometry(100, 240);
    t.props.data = [{ id: 1, name: '键盘聚焦时的长内容' }];
    await nextTick(); await nextTick(); await nextTick();
    const element = t.trigger();
    element.focus();
    await nextTick(); await nextTick(); await nextTick();
    assert.equal(t.trigger(), element, '按需创建提示不能重建触发元素');
    assert.equal(dom.window.document.activeElement, element, '首次打开后焦点仍在文本上');
    assert.equal(element.getAttribute('aria-describedby'), tooltip()?.id);
    assert.ok(element.parentElement?.classList.contains('custom-trigger'));
    assert.ok(element.parentElement?.parentElement?.classList.contains('custom-wrapper'));
    assert.ok(tooltip()?.classList.contains('custom-content'));
  } finally { t.stop(); }
});

it('仅真实溢出时显示 Tooltip，不再附加原生 title；默认提示使用格式化后的文本', async () => {
  const t = mount({ columns: [{ prop: 'name', label: '姓名', formatter: () => '格式化文本' }] });
  try {
    t.geometry(120, 120);
    await t.enter();
    assert.equal(tooltip(), null);
    t.geometry(120, 240);
    await t.enter();
    assert.equal(tooltip()?.textContent, '格式化文本');
    assert.equal(t.cell().querySelector('[title]'), null);
    assert.equal(t.trigger().tabIndex, 0);
  } finally { t.stop(); }
});

it('列级提示配置和 formatter 覆盖表级，false 禁用单列，键盘焦点可打开', async () => {
  const t = mount({
    tooltipFormatter: () => '表级',
    columns: [{ prop: 'name', label: '姓名', showOverflowTooltip: { color: 'rgb(10, 20, 30)' }, tooltipFormatter: (scope: TableTooltipScope) => h('strong', `${scope.column.label}：${scope.cellValue}`) }],
  });
  try {
    t.geometry(120, 240);
    await t.enter(true);
    assert.equal(tooltip()?.querySelector('strong')?.textContent, '姓名：原始长内容');
    assert.equal(tooltip()?.style.backgroundColor, 'rgb(10, 20, 30)');
    assert.equal(t.trigger().getAttribute('aria-describedby'), tooltip()?.id, '聚焦元素自身需关联提示内容');
    t.props.columns = [{ prop: 'name', showOverflowTooltip: false }];
    await nextTick();
    assert.equal(tooltip(), null);
    assert.equal(t.cell().querySelector('[data-table-overflow]'), null);
  } finally { t.stop(); }
});

it('tooltip 插槽优先于 formatter，收到真实展示文本、行与列索引', async () => {
  let received: TableTooltipScope | undefined;
  const t = mount({ tooltipFormatter: () => '不应出现' }, {
    cell: () => h('b', '插槽内的长文本'),
    tooltip: (scope: TableTooltipScope) => { received = scope; return h('em', `提示：${scope.content}`); },
  });
  try {
    t.geometry(100, 300);
    await t.enter();
    assert.equal(tooltip()?.querySelector('em')?.textContent, '提示：插槽内的长文本');
    assert.equal(received?.row.id, 1);
    assert.equal(received?.columnIndex, 0);
    assert.equal(received?.$index, 0);
    assert.equal(received?.cellValue, '原始长内容');
  } finally { t.stop(); }
});

it('禁用提示或加载时不打开，恢复并更新内容后重新测量', async () => {
  const t = mount({ tooltipOptions: { disabled: true, openDelay: 0, closeDelay: 0 } });
  try {
    t.geometry(100, 300);
    await t.enter();
    assert.equal(tooltip(), null);
    Object.assign(t.props, { loading: true, tooltipOptions: { openDelay: 0, closeDelay: 0 } });
    await nextTick();
    await t.enter();
    assert.equal(tooltip(), null);
    Object.assign(t.props, { loading: false, data: [{ id: 1, name: '更新后内容' }] });
    await nextTick();
    await t.enter();
    assert.equal(tooltip()?.textContent, '更新后内容');
  } finally { t.stop(); }
});

it('插槽子组件独立更新文本时重新检测溢出，键盘入口与已打开的提示及时更新', async () => {
  const text = ref('短文本');
  const Child = defineComponent({ setup: () => () => h('span', text.value) });
  const t = mount({}, { cell: () => h(Child) });
  try {
    t.geometry(100, 100);
    await t.enter();
    assert.equal(t.trigger().getAttribute('tabindex'), null);
    t.geometry(100, 240);
    text.value = '子组件独立更新后的长文本';
    await nextTick(); await nextTick(); await nextTick();
    assert.equal(t.trigger().tabIndex, 0, '无需鼠标进入即可通过键盘聚焦');
    await t.enter(true);
    assert.equal(tooltip()?.textContent, text.value);
    text.value = '提示已打开时再次独立更新';
    await nextTick(); await nextTick(); await nextTick();
    assert.equal(tooltip()?.textContent, text.value);
    t.geometry(100, 100);
    text.value = '恢复短文';
    await nextTick(); await nextTick(); await nextTick();
    assert.equal(t.trigger().getAttribute('tabindex'), null);
    assert.equal(t.trigger().getAttribute('aria-describedby'), null);
  } finally { t.stop(); }
});
