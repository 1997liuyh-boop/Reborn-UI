/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rmdir, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { after, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { createRenderer, defineComponent, h, nextTick, provide, reactive } from 'vue';

/** 真实运行选择器逻辑，仅将子组件替换为可记录契约的测试替身。 */
const folder = await mkdtemp(resolve('tests/reborn-tree-select/.runtime-'));
const output = resolve(folder, 'component.mjs');
const treeOutput = resolve(folder, 'tree.mjs');
after(async () => { await unlink(output); await unlink(treeOutput); await rmdir(folder); });
await build({
  entryPoints: [resolve('app/components/reborn/ui/reborn-tree-select/RebornTreeSelect.vue')],
  outfile: output, bundle: true, format: 'esm', platform: 'node', packages: 'external',
  alias: { '~': resolve('app') },
  plugins: [{ name: 'vue-test', setup(builder) {
    builder.onLoad({ filter: /Reborn(Tree|SelectTrigger|Badge|Tooltip)\.vue$/ }, ({ path }) => {
      const name = path.match(/Reborn(\w+)\.vue$/)![1];
      return { contents: `import { defineComponent, h } from 'vue';
        export default defineComponent({ name: '${name}', inheritAttrs: false,
          setup(_, {attrs, slots}) { return () => h('${name}', Object.fromEntries(Object.entries(attrs).map(([key, value]) => [key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), value])),
            ${name === 'SelectTrigger' ? "[slots.trigger?.(), ...(attrs['is-open'] ? [slots.content?.()] : [])]" : "slots.default?.()"}); }
        });`, loader: 'js' };
    });
    builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
      const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
      return { contents: compileScript(descriptor, { id: 'tree-select-test', inlineTemplate: true }).content, loader: 'ts' };
    });
  } }],
});
const TreeSelect = (await import(pathToFileURL(output).href)).default;

/** 内存渲染器保留事件处理器，测试无需引入浏览器或模拟 DOM 依赖。 */
interface Element { type: string; text: string; props: Record<string, any>; children: Element[]; parent?: Element }
const element = (type: string, text = ''): Element => ({ type, text, props: {}, children: [] });
const renderer = createRenderer<Element, Element>({
  createElement: type => Object.assign(element(type), { focus() {} }), createText: text => element('#text', text), createComment: text => element('#comment', text),
  setText: (node, text) => { node.text = text; }, setElementText: (node, text) => { node.text = text; node.children = []; },
  parentNode: node => node.parent ?? null,
  nextSibling: node => node.parent?.children[node.parent.children.indexOf(node) + 1] ?? null,
  patchProp: (node, key, _, value) => { node.props[key] = value; },
  insert(node, parent, anchor) {
    if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1);
    const index = anchor ? parent.children.indexOf(anchor) : -1;
    parent.children.splice(index < 0 ? parent.children.length : index, 0, node); node.parent = parent;
  },
  remove(node) { if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1); },
});
function flatten(node: Element): Element[] { return [node, ...node.children.flatMap(flatten)]; }
function mount(initial: Record<string, unknown> = {}, form?: Record<string, unknown>) {
  const props = reactive({ ...initial });
  const values: unknown[] = [];
  const changes: unknown[] = [];
  let clears = 0;
  const root = element('root');
  const app = renderer.createApp(defineComponent({ setup() {
    if (form) provide('rebornForm', { props: form });
    return () => h(TreeSelect, { ...props,
      'onUpdate:modelValue': (value: unknown) => { values.push(value); props.modelValue = value; },
      onChange: (value: unknown) => changes.push(value), onClear: () => clears++,
    });
  } }));
  app.component('Icon', { render: () => h('i') });
  app.mount(root);
  const find = (type: string) => flatten(root).find(node => node.type === type)!;
  const trigger = () => flatten(root).find(node => node.props['data-state'])!;
  return { props, root, find, values, changes, get clears() { return clears; },
    async open() { trigger().props.onClick(); await nextTick(); }, unmount: () => app.unmount() };
}
// 直接编译真实 Tree，验证图标容器而非替身契约。
await build({
  entryPoints: [resolve('app/components/reborn/ui/reborn-tree/RebornTree.vue')],
  outfile: treeOutput, bundle: true, format: 'esm', platform: 'node', packages: 'external', alias: { '~': resolve('app') },
  plugins: [{ name: 'real-tree', setup(builder) {
    builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
      const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
      return { contents: compileScript(descriptor, { id: 'tree-icon-test', inlineTemplate: true }).content, loader: 'ts' };
    });
  } }],
});
const Tree = (await import(pathToFileURL(treeOutput).href)).default;

const data = [{ key: 'parent', title: '研发', children: [{ key: 0, title: '前端' }, { key: 'locked', title: '归档', disabled: true }] }];

it('单选保留数值 0，回显标题、关闭浮层并触发一次 change', async () => {
  const view = mount({ treeData: data });
  await view.open();
  assert.equal(view.find('Tree').props.selectable, true);
  view.find('Tree').props.onSelect([0]); await nextTick();
  assert.deepEqual(view.values, [0]); assert.deepEqual(view.changes, [0]);
  assert.equal(view.find('SelectTrigger').props.isOpen, false);
  assert.ok(flatten(view.root).some(node => node.text === '前端'));
  view.unmount();
});
it('多选复用树的严格复选，勾选不收起，标签移除只改当前 key', async () => {
  const view = mount({ treeData: data, multiple: true, modelValue: ['parent', 0] });
  await view.open();
  const tree = view.find('Tree');
  assert.equal(tree.props.checkable, true); assert.equal(tree.props.checkStrictly, '');
  tree.props.onCheck({ checked: ['parent', 0, 'other'], halfChecked: [] }); await nextTick();
  assert.deepEqual(view.values[0], ['parent', 0, 'other']);
  assert.equal(view.find('SelectTrigger').props.isOpen, true);
  view.find('Badge').props.onClose({ stopPropagation() {} }); await nextTick();
  assert.deepEqual(view.values[1], [0, 'other']); view.unmount();
});
it('清空分别回写 null 与空数组，并且触发 clear', async () => {
  for (const multiple of [false, true]) {
    const view = mount({ treeData: data, multiple, modelValue: multiple ? [0] : 0, clearable: true });
    view.find('button').props.onClick({ stopPropagation() {} }); await nextTick();
    assert.deepEqual(view.values, [multiple ? [] : null]); assert.equal(view.clears, 1); view.unmount();
  }
});
it('表单禁用优先，禁用节点不展示可关闭标签', async () => {
  const view = mount({ treeData: data, multiple: true, modelValue: ['locked'] });
  assert.equal(view.find('Badge').props.closable, false); view.unmount();
  const disabled = mount({ treeData: data, modelValue: 0, clearable: true }, { disabled: true });
  await disabled.open();
  assert.equal(disabled.find('SelectTrigger').props.isOpen, false);
  assert.equal(disabled.find('button'), undefined); disabled.unmount();
});
it('字段映射与异步回填保留未知 key，更新数据后回显标题', async () => {
  const view = mount({ modelValue: 0, fieldNames: { key: 'id', title: 'name', children: 'items' } });
  assert.ok(flatten(view.root).some(node => node.text === '0'));
  view.props.treeData = [{ id: 1, name: '根', items: [{ id: 0, name: '回填节点' }] }]; await nextTick();
  assert.ok(flatten(view.root).some(node => node.text === '回填节点'));
  assert.deepEqual(view.changes, []); view.unmount();
});
it('展开配置、虚拟滚动和树样式传给树，空数据呈现空态', async () => {
  const view = mount({ treeData: data, expandedKeys: ['parent'], height: 180, virtual: false, treeUi: { title: 'text-sm' } });
  await view.open();
  assert.deepEqual(view.find('Tree').props.expandedKeys, ['parent']);
  assert.equal(view.find('Tree').props.height, 180); assert.equal(view.find('Tree').props.virtual, false);
  assert.deepEqual(view.find('Tree').props.ui, { title: 'text-sm' }); view.unmount();
  const empty = mount({ emptyText: '暂无团队' }); await empty.open();
  assert.ok(flatten(empty.root).some(node => node.text === '暂无团队')); empty.unmount();
});
it('禁用变化关闭已打开的面板', async () => {
  const view = mount({ treeData: data }); await view.open(); view.props.disabled = true; await nextTick();
  assert.equal(view.find('SelectTrigger').props.isOpen, false); view.unmount();
});


it('标签按保留数量折叠，悬浮提示仅包含隐藏项', async () => {
  const view = mount({ treeData: data, multiple: true, modelValue: ['parent', 0, 'locked'], collapseTags: true, collapseTagsTooltip: true, maxCollapseTags: 1 });
  assert.deepEqual(flatten(view.root).filter(node => node.type === 'Badge').map(node => node.props.label), ['研发', '+2']);
  assert.equal(view.find('Tooltip').props.content, '前端、归档');
  view.props.maxCollapseTags = 0; await nextTick();
  assert.deepEqual(flatten(view.root).filter(node => node.type === 'Badge').map(node => node.props.label), ['+3']);
  view.props.collapseTagsTooltip = false; await nextTick();
  assert.equal(view.find('Tooltip'), undefined);
  view.props.collapseTags = false; await nextTick();
  assert.equal(flatten(view.root).filter(node => node.type === 'Badge').length, 3); view.unmount();
});
it('关闭时机与传送位置透传并支持动态切换', async () => {
  const view = mount({ closeOn: 'mousedown', portal: false });
  assert.equal(view.find('SelectTrigger').props.closeOn, 'mousedown');
  assert.equal(view.find('SelectTrigger').props.portal, false);
  view.props.closeOn = 'click'; view.props.portal = true; await nextTick();
  assert.equal(view.find('SelectTrigger').props.closeOn, 'click');
  assert.equal(view.find('SelectTrigger').props.portal, true); view.unmount();
});
it('搜索保留祖先、展开命中路径并在关闭后恢复原树', async () => {
  const searches: string[] = [];
  const view = mount({ treeData: data, allowSearch: true, expandedKeys: [], onSearch: (value: string) => searches.push(value) });
  await view.open();
  view.find('input').props.onInput({ target: { value: '前端' } }); await nextTick();
  assert.equal(view.find('Tree').props.treeData[0].children.length, 1);
  assert.deepEqual(view.find('Tree').props.expandedKeys, ['parent']);
  assert.deepEqual(searches, ['前端']);
  await view.open(); assert.equal(view.find('SelectTrigger').props.isOpen, true);
  view.find('SelectTrigger').props.onClose(); await nextTick(); await view.open();
  assert.equal(view.find('input').props.value, '');
  assert.deepEqual(view.find('Tree').props.expandedKeys, []);
  assert.deepEqual(view.find('Tree').props.treeData, data); view.unmount();
});
it('搜索使用映射标题且不丢失过滤掉的已选值，无匹配显示空态', async () => {
  const view = mount({ treeData: [{ id: 'r', name: '根', items: [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }] }], fieldNames: { key: 'id', title: 'name', children: 'items' }, allowSearch: true, multiple: true, modelValue: ['b'] });
  await view.open(); view.find('input').props.onInput({ target: { value: ' ALPHA ' } }); await nextTick();
  assert.equal(view.find('Tree').props.treeData[0].items[0].id, 'a');
  view.find('Tree').props.onCheck({ checked: ['a'], halfChecked: [] }); await nextTick();
  assert.deepEqual(view.values[0], ['b', 'a']);
  view.find('input').props.onInput({ target: { value: '找不到' } }); await nextTick();
  assert.equal(view.find('Tree'), undefined);
  assert.ok(flatten(view.root).some(node => node.text === '无匹配结果'));
  view.props.allowSearch = false; await nextTick(); assert.deepEqual(view.find('Tree').props.treeData, view.props.treeData); view.unmount();
});

it('树节点没有图标时不渲染占位，有图标与自定义插槽仍正常显示', () => {
  for (const showIcon of [false, true]) {
    const root = element('root');
    const app = renderer.createApp(Tree, { treeData: [{ key: 'a', title: '有图标', icon: 'lucide:folder' }, { key: 'b', title: '无图标' }], showIcon, virtual: false, ui: { iconEle: 'icon-marker' } });
    app.component('Icon', { render: () => h('i') });
    app.component('RebornCheckbox', { render: () => h('input') });
    app.mount(root);
    assert.equal(flatten(root).filter(node => String(node.props.class).includes('icon-marker')).length, showIcon ? 1 : 0);
    app.unmount();
  }
  const root = element('root');
  const app = renderer.createApp({ render: () => h(Tree, { treeData: [{ key: 'a', title: '插槽图标' }], showIcon: true, virtual: false, ui: { iconEle: 'icon-marker' } }, { icon: () => h('svg') }) });
  app.component('Icon', { render: () => h('i') });
  app.component('RebornCheckbox', { render: () => h('input') });
  app.mount(root);
  assert.equal(flatten(root).filter(node => node.type === 'svg').length, 1);
  app.unmount();
});
