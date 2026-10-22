/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { TableExpose } from '../../app/components/reborn/ui/reborn-table/table.types';
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

const folder = await mkdtemp(resolve('tests/reborn-table/.runtime-'));
const real = resolve(folder, 'real.mjs');
const runtime = resolve(folder, 'runtime.mjs');
after(async () => { await Promise.all([real, runtime].map(file => unlink(file).catch(() => {}))); await rmdir(folder); });
for (const [output, stub] of [[real, false], [runtime, true]] as const) {
  await build({
    entryPoints: [resolve('app/components/reborn/ui/reborn-table/RebornTable.vue')], outfile: output,
    bundle: true, format: 'esm', platform: 'node', packages: 'external', alias: { '~': resolve('app') },
    plugins: [{ name: 'table-test', setup(builder) {
      builder.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'js' }));
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        if (stub && !path.includes('reborn-table')) {
          const name = path.match(/([^/\\]+)\.vue$/)![1];
          return { contents: `import {defineComponent,h} from 'vue'; export default defineComponent({name:'${name}',inheritAttrs:false,setup(_,{attrs,slots}) {return ()=>h('${name}',attrs,slots.default?.());}});`, loader: 'js' };
        }
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        return { contents: compileScript(descriptor, { id: 'table-test', inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') } }).content, loader: 'ts' };
      });
    } }],
  });
}
const Table = (await import(pathToFileURL(real).href)).default;
const RuntimeTable = (await import(pathToFileURL(runtime).href)).default;
const Column = defineComponent({ name: 'RebornTableColumn', setup: () => () => null });
const data = [{ id: 1, name: '甲', amount: 20 }, { id: 2, name: '乙', amount: 10 }];
const columns = [{ prop: 'name', label: '姓名' }, { prop: 'amount', label: '金额', sortable: true }];
async function render(props: Record<string, unknown> = {}, slots = {}) {
  const app = createSSRApp({ render: () => h(Table, { data, columns, ...props }, slots) });
  app.component('Icon', { render: () => h('svg') });
  return renderToString(app);
}

it('真实依赖 SSR 输出语义表格，三档高度使用原生刻度且转义 HTML', async () => {
  for (const [size, height] of [['sm', 36], ['md', 48], ['lg', 56]]) {
    const html = await render({ size, data: [{ name: '<script>危险</script>', amount: 0 }] });
    assert.match(html, /<table[^>]+aria-label="数据表格"/);
    assert.ok(html.includes(`h-${Number(height) / 4}`));
    assert.match(html, /text-base font-medium text-gray-9/);
    assert.doesNotMatch(html, /leading-|line-height:/);
    assert.match(html, /&lt;script&gt;危险&lt;\/script&gt;/);
    assert.match(html, />0<\/div>/);
    assert.doesNotMatch(html, /<script>/);
  }
});

it('声明列首屏支持分组及作用域插槽，配置式 columns 优先', async () => {
  const slots = { default: () => [
    h(Column, { label: '人员' }, { default: () => [h(Column, { prop: 'name', label: '姓名' })] }),
    h(Column, { prop: 'amount', label: '金额', sortable: '' }, { default: ({ row }: { row: typeof data[0] }) => h('strong', `¥${row.amount}`) }),
  ] };
  const html = await render({ columns: undefined }, slots);
  assert.match(html, /人员/);
  assert.match(html, /<strong>¥20<\/strong>/);
  assert.match(html, /rowspan="2"/);
  assert.match(html, /排序金额/);
  const override = await render({ columns: [{ prop: 'id', label: '配置列' }] }, slots);
  assert.match(override, /配置列/);
  assert.doesNotMatch(override, /人员|姓名|¥/);
});

it('固定列、分组表头和滚动区域有独立定位，底部位于滚动区外', async () => {
  const html = await render({ height: 240, border: true, headerBackground: true, columns: [
    { prop: 'name', label: '姓名', fixed: 'left', width: 100 },
    { label: '数据', children: [{ prop: 'amount', label: '金额', width: 120 }] },
    { prop: 'id', label: '编号', fixed: 'right', width: 80 },
  ] }, { footer: () => h('button', { 'data-table-footer': '' }, '提交') });
  assert.match(html, /height:240px/);
  assert.match(html, /left:0px;position:sticky/);
  assert.match(html, /right:0px;position:sticky/);
  assert.match(html, /top:48px/);
  assert.match(html, /border-gray-3/);
  assert.match(html, /bg-gray-2/);
  assert.ok(html.indexOf('data-table-footer') > html.lastIndexOf('reborn-scrollbar__bar'));
});

it('fixedHeader 保留高度自动固定，可关闭且不影响横向固定列', async () => {
  for (const height of [{}, { height: 180 }, { maxHeight: 180 }]) {
    const defaultHtml = await render(height);
    assert.equal(/top:0px/.test(defaultHtml), Object.keys(height).length > 0);
    const html = await render({ ...height, fixedHeader: false, columns: [
      { prop: 'name', fixed: 'left' }, { prop: 'amount' },
    ] });
    assert.doesNotMatch(html, /top:0px/);
    assert.match(html, /left:0px;position:sticky/);
  }
});

it('tableLayout 默认为 fixed，auto 可动态切换且保留列宽与滚动', async () => {
  const t = mount({ height: 180 });
  const table = () => t.nodes().find(node => node.type === 'table')!;
  assert.match(table().props.class, /(?:^| )table-fixed(?: |$)/);
  Object.assign(t.props, { tableLayout: 'auto' });
  await nextTick();
  assert.match(table().props.class, /(?:^| )table-auto(?: |$)/);
  assert.doesNotMatch(table().props.class, /(?:^| )table-fixed(?: |$)/);
  assert.ok(table().props.style.minWidth);
  t.stop();
});

it('固定表头为纵向滚动条预留整组表头高度，关闭固定或隐藏表头后归零', async () => {
  const t = mount({ height: 200, size: 'lg', columns: [{ label: '分组', children: columns }] });
  const bar = () => t.nodes().find(node => node.type === 'RebornScrollbar')!;
  try {
    assert.equal(bar().props.verticalOffset, 112);
    Object.assign(t.props, { fixedHeader: false });
    await nextTick();
    assert.equal(bar().props.verticalOffset, 0);
    Object.assign(t.props, { fixedHeader: true, showHeader: false });
    await nextTick();
    assert.equal(bar().props.verticalOffset, 0);
    Object.assign(t.props, { showHeader: true, size: 'sm' });
    await nextTick();
    assert.equal(bar().props.verticalOffset, 72);
    Object.assign(t.props, { height: undefined, maxHeight: undefined });
    await nextTick();
    assert.equal(bar().props.verticalOffset, 0);
  } finally { t.stop(); }
});

it('懒加载行展示展开入口与加载反馈，完成后可见子行且父数据不变', async () => {
  let resolveChildren: ((rows: Record<string, unknown>[]) => void) | undefined;
  const source = [{ id: 1, name: '父节点', hasChildren: true }];
  const t = mount({ data: source, lazy: true, load: (_row: unknown, _node: unknown, resolve: typeof resolveChildren) => { resolveChildren = resolve; } });
  try {
    const expand = () => t.nodes().find(node => node.props['aria-label'] === '展开第 1 行' || node.props['aria-label'] === '收起第 1 行');
    assert.ok(expand(), 'hasChildren 为 true 的待加载行应展示展开入口');
    expand()!.props.onClick({ stopPropagation() {} });
    await nextTick();
    assert.equal(expand()!.props['aria-busy'], true);
    assert.ok(t.nodes().some(node => node.type === 'RebornLoading'));
    resolveChildren?.([{ id: 11, name: '异步子节点' }]);
    await nextTick();
    assert.equal(expand()!.props['aria-busy'], false);
    assert.ok(t.nodes().some(node => node.props['data-row-key'] === 11));
    assert.equal('children' in source[0]!, false);
  } finally { t.stop(); }
});

it('自定义索引接收组件已叠加的分页偏移，业务回调不需再次计算页码', async () => {
  const html = await render({
    data: Array.from({ length: 8 }, (_, id) => ({ id, name: `记录 ${id}` })),
    currentPage: 2, pageSize: 3, pagination: true,
    columns: [{ type: 'index', label: '编号', index: (index: number) => `BX-${String(index + 1).padStart(3, '0')}` }, { prop: 'name' }],
  });
  assert.match(html, /BX-004/);
  assert.match(html, /BX-006/);
  assert.doesNotMatch(html, /BX-007/);
});

it('空状态、加载、合并与合计使用有效列数并允许插槽覆盖', async () => {
  assert.match(await render({ data: [] }, { empty: () => '没有匹配结果' }), /colspan="2"[^>]*>没有匹配结果/);
  assert.match(await render({ loading: true }, { loading: () => '正在查询' }), /role="status"[^>]*>正在查询/);
  const html = await render({ showSummary: true, spanMethod: ({ columnIndex }: { columnIndex: number }) => columnIndex === 0 ? [1, 2] : [0, 0] });
  assert.match(html, /colspan="2"/);
  assert.match(html, /<tfoot/);
  assert.match(html, />30<\/div>/);
});

it('受控默认展开在 SSR 首帧包含子节点', async () => {
  const expanded = ref<(string | number)[]>([]);
  const app = createSSRApp({ render: () => h(Table, {
    data: [{ id: 1, name: '根', children: [{ id: 11, name: '子节点' }] }], columns,
    defaultExpandAll: true, expandedRowKeys: expanded.value,
    'onUpdate:expandedRowKeys': (value: (string | number)[]) => { expanded.value = value; },
  }) });
  const html = await renderToString(app);
  assert.match(html, /data-row-key="11"/);
  assert.match(html, /子节点/);
});

it('纵向合并区内的详情延后到合并块尾部，避免吞掉后续行', async () => {
  const html = await render({
    columns: [{ type: 'expand' }, ...columns], expandedRowKeys: [1],
    spanMethod: ({ $index, columnIndex }: { $index: number; columnIndex: number }) => columnIndex === 1 ? ($index === 0 ? [2, 1] : [0, 0]) : [1, 1],
  }, { expand: () => h('div', { 'data-details': '' }, '详情') });
  assert.ok(html.indexOf('data-details') > html.indexOf('data-row-key="2"'));
  assert.match(html, /rowspan="2"/);
});

it('单选列可通过键盘聚焦，禁选行不进入 Tab 顺序', async () => {
  const html = await render({ columns: [{ type: 'radio', selectable: (row: typeof data[0]) => row.id !== 2 }, ...columns] });
  assert.match(html, /tabindex="0"[^>]*role="radio"/);
  assert.match(html, /tabindex="-1"[^>]*role="radio"/);
});

/** 内存渲染器保留事件回调，用于验证真实状态与组件间模型传递。 */
interface Element { type: string; text: string; props: Record<string, any>; children: Element[]; parent?: Element }
const element = (type: string, text = ''): Element => ({ type, text, props: {}, children: [] });
let focused: Element | undefined;
const renderer = createRenderer<Element, Element>({
  createElement: type => Object.assign(element(type), {
    focus() { focused = this; },
    querySelector() { return flatten(this).find(node => node.type === 'RebornRadio'); },
  }), createText: text => element('#text', text), createComment: text => element('#comment', text),
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
function flatten(node: Element): Element[] { return [node, ...node.children.flatMap(flatten)]; }
function mount(initial: Record<string, unknown> = {}, declared = false) {
  const props = reactive({ data, columns: declared ? undefined : columns, ...initial });
  const selected = ref<(string | number)[]>([]);
  const exposed = ref<TableExpose>();
  const root = element('root');
  const events: unknown[][] = [];
  const app = renderer.createApp(defineComponent({ setup: () => () => h(RuntimeTable, {
    ...props, ref: exposed, selectedKeys: selected.value, 'onUpdate:selectedKeys': (keys: (string | number)[]) => { selected.value = keys; },
    onSelectionChange: (...args: unknown[]) => events.push(args),
  }, declared ? { default: () => props.data.map(row => h(Column, { prop: 'name', columnKey: String(row.id), label: row.name })) } : {}) }));
  app.mount(root);
  return { props, selected, exposed, events, nodes: () => flatten(root), stop: () => app.unmount() };
}

it('真实模型交互选中、全选与实例清空保持同步，禁选行不变', async () => {
  const t = mount({ columns: [{ type: 'selection', selectable: (row: typeof data[0]) => row.id !== 2 }, ...columns] });
  const checks = t.nodes().filter(node => node.type === 'RebornCheckbox');
  checks[1]!.props['onUpdate:modelValue'](true);
  await nextTick();
  assert.deepEqual(t.selected.value, [1]);
  assert.equal(t.exposed.value!.getSelectionRows()[0]!.name, '甲');
  assert.equal(t.nodes().filter(node => node.type === 'RebornCheckbox')[2]!.props.disabled, true);
  t.exposed.value!.clearSelection();
  await nextTick();
  assert.deepEqual(t.selected.value, []);
  assert.equal(t.events.length, 2);
  t.stop();
});

it('三档尺寸的选择列表头和复选框双向居中，不改变普通列的对齐', () => {
  for (const size of ['sm', 'md', 'lg']) {
    for (const width of [48, 80]) {
      const t = mount({ size, border: true, columns: [
        { type: 'selection', width, fixed: 'left', selectable: (row: typeof data[0]) => row.id !== 2 },
        { prop: 'name', label: '姓名' }, { prop: 'amount', label: '金额', align: 'right' },
      ] });
      const checks = t.nodes().filter(node => node.type === 'RebornCheckbox');
      assert.equal(checks.length, 3, '全选和两行复选框均须参与验证');
      for (const checkbox of checks) {
        let cell = checkbox.parent!;
        while (cell.type !== 'th' && cell.type !== 'td') cell = cell.parent!;
        assert.match(cell.props.class, /(?:^| )align-middle(?: |$)/);
        assert.match(cell.props.class, /(?:^| )text-center(?: |$)/);
        assert.match(cell.props.class, /(?:^| )px-2(?: |$)/, '48px 选择列应为勾选框留足空间');
        const content = cell.children[0]!;
        for (const token of ['flex', 'items-center', 'justify-center']) {
          assert.ok(content.props.class.split(' ').includes(token), `选择列内容缺少 ${token}`);
        }
      }
      const headers = t.nodes().filter(node => node.type === 'th');
      assert.match(headers[1]!.props.class, /(?:^| )text-left(?: |$)/);
      assert.match(headers[2]!.props.class, /(?:^| )text-right(?: |$)/);
      const row = t.nodes().find(node => node.props['data-row-key'] === 1)!;
      assert.match(row.children[2]!.props.class, /(?:^| )text-right(?: |$)/);
      t.stop();
    }
  }
});

it('排序按钮改变渲染行序，声明列响应运行时增删', async () => {
  const t = mount();
  const button = t.nodes().find(node => node.props['aria-label'] === '排序金额')!;
  button.props.onClick();
  await nextTick();
  assert.deepEqual(t.nodes().filter(node => node.props['data-row-key'] !== undefined).map(node => node.props['data-row-key']), [2, 1]);
  t.stop();
  const declared = mount({}, true);
  assert.equal(declared.nodes().filter(node => node.type === 'th').length, 2);
  declared.props.data = [{ id: 3, name: '新列', amount: 40 }];
  await nextTick();
  assert.equal(declared.nodes().filter(node => node.type === 'th').length, 1);
  declared.stop();
});

it('单选键盘空格和方向键可选择行且跳过禁选', async () => {
  const t = mount({ data: [...data, { id: 3, name: '丙', amount: 30 }], columns: [{ type: 'radio', selectable: (row: typeof data[0]) => row.id !== 2 }, ...columns] });
  const event = (key: string) => ({ key, preventDefault() {}, stopPropagation() {} });
  t.nodes().find(node => node.type === 'RebornRadio')!.props.onKeydown(event(' '));
  await nextTick();
  assert.deepEqual(t.selected.value, [1]);
  t.nodes().find(node => node.type === 'RebornRadio')!.props.onKeydown(event('ArrowDown'));
  await nextTick();
  assert.deepEqual(t.selected.value, [3]);
  t.stop();
});

it('数值与字符串同值键保持独立的键盘焦点', async () => {
  const t = mount({ data: [{ id: 1, name: '数值键' }, { id: '1', name: '字符串键' }, { id: 2, name: '末行' }], columns: [{ type: 'radio' }, ...columns] });
  const radios = () => t.nodes().filter(node => node.type === 'RebornRadio');
  const down = { key: 'ArrowDown', preventDefault() {}, stopPropagation() {} };
  radios()[0]!.props.onKeydown(down);
  await nextTick(); await nextTick();
  assert.deepEqual(t.selected.value, ['1']);
  assert.ok(focused === radios()[1], '焦点必须移到字符串键所在的第二行');
  focused!.props.onKeydown(down);
  await nextTick(); await nextTick();
  assert.deepEqual(t.selected.value, [2]);
  assert.ok(focused === radios()[2], '再次向下必须移到第三行');
  t.stop();
});

it('外框底边覆盖在末行边线上，短内容仍保留自己的底线且合并详情不重复描边', () => {
  for (const options of [{}, { height: 300 }, { maxHeight: 300 }, { showSummary: true }, { columns: [{ type: 'expand' }, ...columns], expandedRowKeys: [2] }, {
    spanMethod: ({ $index, columnIndex }: { $index: number; columnIndex: number }) => columnIndex === 0 ? ($index === 0 ? [2, 1] : [0, 0]) : [1, 1],
  }, { data: [] }]) {
    const t = mount({ border: true, ...options });
    const nodes = t.nodes();
    const frame = nodes.find(node => node.type === 'RebornScrollbar')!.props.class.split(' ');
    assert.ok(frame.includes('border-x') && frame.includes('border-t'));
    assert.ok(!frame.includes('border') && !frame.includes('border-b'), '底框不能在表格底线外再占 1px');
    assert.ok(frame.includes('after:h-px'), '底框在滚动区域内叠绘一条 1px 线');
    assert.ok(nodes.find(node => node.type === 'table')!.props.class.split(' ').includes('border-b'), '短内容仍保留表格底线');
    for (const cell of nodes.filter(node => node.type === 'td')) {
      assert.ok(!cell.props.class.split(' ').includes('border-b'), '表体与合计不应再绘制下边框');
    }
    t.stop();
  }
  const plain = mount();
  assert.ok(plain.nodes().find(node => node.type === 'table')!.props.class.split(' ').includes('border-b'), '无外框时仍保留表格底部分隔线');
  plain.stop();
});

it('append 插槽之前的表格底部分隔线仍然保留', async () => {
  const html = await render({ border: true }, { append: () => h('div', '追加内容') });
  const table = html.match(/<table\s[^>]*class="([^"]*)"/)![1]!;
  assert.ok(table.split(' ').includes('border-b'));
  assert.ok(html.indexOf('追加内容') > html.indexOf('</table>'));
});

it('分组表头按逻辑列边界保留城市与跨行金额之间的分隔线', () => {
  const t = mount({ border: true, columns: [
    { prop: 'name', label: '姓名' },
    { label: '组织信息', children: [{ prop: 'department', label: '部门' }, { prop: 'city', label: '城市' }] },
    { prop: 'amount', label: '报销金额', align: 'right' },
  ] });
  const headers = t.nodes().filter(node => node.type === 'th');
  const city = headers.find(node => node.props['data-column-key'] === 'city')!;
  const amount = headers.find(node => node.props['data-column-key'] === 'amount')!;
  assert.doesNotMatch(city.props.class, /(?:last:)?border-r-0/, 'DOM 最后一个表头并不一定在表格最右侧');
  assert.match(amount.props.class, /(?:^| )border-r-0(?: |$)/);
  assert.equal(amount.props.rowspan, 2);
  assert.match(amount.props.class, /text-right/);
  t.stop();
});

it('相同行键与跨度的数据刷新保留合并格悬停，真正改变行序才清除', async () => {
  const t = mount({ hover: true,
    columns: [{ prop: 'department' }, ...columns],
    spanMethod: ({ $index, columnIndex }: { $index: number; columnIndex: number }) => columnIndex === 0 ? ($index === 0 ? [2, 1] : [0, 0]) : [1, 1],
  });
  const rows = () => t.nodes().filter(node => node.props['data-row-key'] !== undefined);
  rows()[0]!.children[0]!.props.onMouseenter();
  await nextTick();
  t.props.data = t.props.data.map(row => ({ ...row, amount: row.amount + 1 }));
  await nextTick();
  assert.match(rows()[1]!.props.class, /(?:^| )bg-gray-2(?: |$)/);
  t.props.data = [...t.props.data].reverse();
  await nextTick();
  assert.doesNotMatch(rows()[1]!.props.class, /(?:^| )bg-gray-2(?: |$)/);
  t.stop();
});

it('合并单元格与覆盖数据行双向联动悬停，且不会扩散到其他分组或合计', async () => {
  const t = mount({ data: [...data, { id: 3, name: '丙', amount: 30 }], hover: true, showSummary: true,
    columns: [{ prop: 'department' }, ...columns],
    spanMethod: ({ $index, columnIndex }: { $index: number; columnIndex: number }) => columnIndex === 0 ? ($index === 0 ? [2, 1] : $index === 1 ? [0, 0] : [1, 1]) : [1, 1],
  });
  const rows = () => t.nodes().filter(node => node.props['data-row-key'] !== undefined);
  const merged = () => rows()[0]!.children[0]!;
  const secondName = () => rows()[1]!.children.find(node => node.type === 'td')!;
  assert.equal(typeof merged().props.onMouseenter, 'function');
  merged().props.onMouseenter();
  await nextTick();
  assert.match(rows()[0]!.props.class, /(?:^| )bg-gray-2(?: |$)/);
  assert.match(rows()[1]!.props.class, /(?:^| )bg-gray-2(?: |$)/);
  assert.doesNotMatch(rows()[2]!.props.class, /(?:^| )bg-gray-2(?: |$)/);
  merged().props.onMouseleave();
  secondName().props.onMouseenter();
  await nextTick();
  assert.match(merged().props.class, /(?:^| )bg-gray-2(?: |$)/, '悬停姓名也必须高亮其覆盖的部门单元格');
  assert.doesNotMatch(rows()[0]!.props.class, /(?:^| )bg-gray-2(?: |$)/, '共享部门单元格高亮不应让另一条姓名行全部高亮');
  secondName().props.onMouseleave();
  await nextTick();
  assert.doesNotMatch(merged().props.class, /(?:^| )bg-gray-2(?: |$)/);
  assert.doesNotMatch(rows()[1]!.props.class, /(?:^| )bg-gray-2(?: |$)/);
  t.props.hover = false;
  merged().props.onMouseenter();
  await nextTick();
  assert.doesNotMatch(rows()[1]!.props.class, /(?:^| )bg-gray-2(?: |$)/);
  t.stop();
});

it('当前行使用品牌色二阶，切换当前行时不会被条纹和悬停灰色覆盖', async () => {
  const t = mount({ highlightCurrentRow: true, stripe: true, hover: true });
  t.exposed.value!.setCurrentRow(data[1]);
  await nextTick();
  const rows = () => t.nodes().filter(node => node.props['data-row-key'] !== undefined);
  assert.match(rows()[1]!.props.class, /(?:^| )bg-brand-2(?: |$)/);
  assert.match(rows()[1]!.props.class, /hover:bg-brand-2/);
  rows()[1]!.children[0]!.props.onMouseenter();
  await nextTick();
  assert.match(rows()[1]!.props.class, /(?:^| )bg-brand-2(?: |$)/);
  t.exposed.value!.setCurrentRow(data[0]);
  await nextTick();
  assert.match(rows()[0]!.props.class, /(?:^| )bg-brand-2(?: |$)/);
  assert.doesNotMatch(rows()[1]!.props.class, /bg-brand-2/);
  t.stop();
});
