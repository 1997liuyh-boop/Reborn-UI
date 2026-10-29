/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { Slots } from 'vue';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rmdir, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { after, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { createRenderer, defineComponent, h, nextTick, provide, reactive } from 'vue';
import { FORM_KEY } from '../../app/composables/useFieldGroup';

/** 真实运行选择器逻辑，仅将子组件替换为可记录契约的测试替身。 */
const folder = await mkdtemp(resolve('tests/reborn-tree-select/.runtime-'));
const output = resolve(folder, 'component.mjs');
const treeOutput = resolve(folder, 'tree.mjs');
after(async () => { await unlink(output); await unlink(treeOutput); await rmdir(folder); });
await build({
  entryPoints: [resolve('app/components/reborn/ui/reborn-tree-select/RebornTreeSelect.vue')],
  outfile: output, bundle: true, format: 'esm', platform: 'node', packages: 'external',
  alias: { '~': resolve('app'), '@': resolve('app') },
  plugins: [{ name: 'vue-test', setup(builder) {
    builder.onResolve({ filter: /^~\/composables\/useFieldGroup$/ }, () => ({ path: pathToFileURL(resolve('app/composables/useFieldGroup.ts')).href, external: true }));
    builder.onLoad({ filter: /Reborn(Tree|SelectTrigger|Badge|Tooltip)\.vue$/ }, ({ path }) => {
      const name = path.match(/Reborn(\w+)\.vue$/)![1];
      return { contents: `import { defineComponent, h } from 'vue';
        export default defineComponent({ name: '${name}', inheritAttrs: false,
          setup(_, {attrs, slots}) { return () => h('${name}', Object.fromEntries(Object.entries(attrs).map(([key, value]) => [key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), value])),
            ${name === 'SelectTrigger' ? "[slots.trigger?.(), ...(attrs['is-open'] ? [slots.content?.()] : [])]" : name === 'Tree' ? "slots.title?.({node: attrs['tree-data'][0], selected: true, expanded: false})" : "slots.default?.()"}); }
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
function mount(initial: Record<string, unknown> = {}, form?: Record<string, unknown>, slots?: Slots) {
  const props = reactive({ ...initial });
  const values: unknown[] = [];
  const changes: unknown[] = [];
  let clears = 0;
  const root = element('root');
  const app = renderer.createApp(defineComponent({ setup() {
    if (form) provide(FORM_KEY, { props: form } as any);
    return () => h(TreeSelect, { ...props,
      'onUpdate:modelValue': (value: unknown) => { values.push(value); props.modelValue = value; },
      onChange: (value: unknown) => changes.push(value), onClear: () => clears++,
    }, slots);
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
  outfile: treeOutput, bundle: true, format: 'esm', platform: 'node', packages: 'external', alias: { '~': resolve('app'), '@': resolve('app') },
  plugins: [{ name: 'real-tree', setup(builder) {
    builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
      const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
      return { contents: compileScript(descriptor, { id: 'tree-icon-test', inlineTemplate: true }).content, loader: 'ts' };
    });
  } }],
});
const Tree = (await import(pathToFileURL(treeOutput).href)).default;

const data = [{ key: 'parent', title: '研发', children: [{ key: 0, title: '前端' }, { key: 'locked', title: '归档', disabled: true }] }];

it('item 插槽收到节点与状态，同时提供 title 时优先使用 item', async () => {
  let received: unknown;
  const view = mount({ treeData: data }, undefined, {
    item: (scope) => { received = scope; return [h('strong', scope.node.title)]; },
    title: () => [h('em', '旧标题')],
  });
  await view.open();
  assert.deepEqual(received, { node: data[0], selected: true, expanded: false });
  assert.equal(view.find('strong').text, '研发');
  assert.equal(view.find('em'), undefined);
  view.unmount();
});

it('未使用 item 时不消费旧 title 插槽', async () => {
  const view = mount({ treeData: data }, undefined, {
    title: ({ node, selected, expanded }) => [h('strong', `${node.title}/${selected}/${expanded}`)],
  });
  await view.open();
  assert.equal(view.find('strong'), undefined);
  view.unmount();
});

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
it('checkStrictly 下各节点独立勾选，勾选不收起，标签移除只改当前 key', async () => {
  const view = mount({ treeData: data, multiple: true, checkStrictly: true, modelValue: ['parent', 0] });
  await view.open();
  const tree = view.find('Tree');
  assert.equal(tree.props.checkable, true); assert.equal(tree.props.checkStrictly, '');
  assert.deepEqual(tree.props.checkedKeys, ['parent', 0]);
  tree.props.onCheck({ checked: ['parent', 0, 'other'], halfChecked: [] }); await nextTick();
  assert.deepEqual(view.values[0], ['parent', 0, 'other']);
  assert.equal(view.find('SelectTrigger').props.isOpen, true);
  view.find('Badge').props.onClose({ stopPropagation() {} }); await nextTick();
  assert.deepEqual(view.values[1], [0, 'other']); view.unmount();
});
/** 联动用例：两个可勾选子级才能区分全选与半选，禁用子级验证阻断。 */
const team = [{ key: 'dept', title: '研发', children: [{ key: 'fe', title: '前端' }, { key: 'be', title: '后端' }, { key: 'arch', title: '归档', disabled: true }] }];
it('多选默认父子联动：部分勾选时父级半选，勾选父级按树序补齐可勾选后代', async () => {
  const view = mount({ treeData: team, multiple: true, modelValue: ['fe'] });
  await view.open();
  assert.deepEqual(view.find('Tree').props.checkedKeys, { checked: ['fe'], halfChecked: ['dept'] });
  view.find('Tree').props.onCheck({ checked: ['fe', 'dept'], halfChecked: [] }, { checked: true, node: team[0] }); await nextTick();
  assert.deepEqual(view.values[0], ['fe', 'dept', 'be']);
  assert.deepEqual(view.find('Tree').props.checkedKeys, { checked: ['fe', 'dept', 'be'], halfChecked: [] });
  view.unmount();
});
it('联动模式下取消子级会摘掉祖先，移除父级标签连带后代', async () => {
  const view = mount({ treeData: team, multiple: true, modelValue: ['dept'] });
  assert.deepEqual(flatten(view.root).filter(node => node.type === 'Badge').map(node => node.props.label), ['研发', '前端', '后端']);
  assert.deepEqual(view.values, [], '程序化赋值只归一展示，不回写绑定值');
  await view.open();
  view.find('Tree').props.onCheck({ checked: ['dept', 'fe'], halfChecked: [] }, { checked: false, node: team[0].children[1] }); await nextTick();
  assert.deepEqual(view.values[0], ['fe']);
  view.props.modelValue = ['dept']; await nextTick();
  view.find('Badge').props.onClose({ stopPropagation() {} }); await nextTick();
  assert.deepEqual(view.values[1], []); view.unmount();
});
it('联动模式下搜索时勾选父级，被搜索隐藏的后代一并勾选', async () => {
  const view = mount({ treeData: team, multiple: true, allowSearch: true, modelValue: [] });
  await view.open(); view.find('input').props.onInput({ target: { value: '前端' } }); await nextTick();
  const shown = view.find('Tree').props.treeData[0];
  assert.deepEqual(shown.children.map((node: { key: string }) => node.key), ['fe']);
  view.find('Tree').props.onCheck({ checked: ['dept'], halfChecked: [] }, { checked: true, node: shown }); await nextTick();
  assert.deepEqual(view.values[0], ['dept', 'fe', 'be']); view.unmount();
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
it('独立勾选时搜索使用映射标题且不丢失过滤掉的已选值，无匹配显示空态', async () => {
  const view = mount({ treeData: [{ id: 'r', name: '根', items: [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }] }], fieldNames: { key: 'id', title: 'name', children: 'items' }, allowSearch: true, multiple: true, checkStrictly: true, modelValue: ['b'] });
  await view.open(); view.find('input').props.onInput({ target: { value: ' ALPHA ' } }); await nextTick();
  assert.equal(view.find('Tree').props.treeData[0].items[0].id, 'a');
  view.find('Tree').props.onCheck({ checked: ['a'], halfChecked: [] }); await nextTick();
  assert.deepEqual(view.values[0], ['b', 'a']);
  view.find('input').props.onInput({ target: { value: '找不到' } }); await nextTick();
  assert.equal(view.find('Tree'), undefined);
  assert.ok(flatten(view.root).some(node => node.text === '无匹配结果'));
  view.props.allowSearch = false; await nextTick(); assert.deepEqual(view.find('Tree').props.treeData, view.props.treeData); view.unmount();
});
it('fieldNames.key 指定绑定值字段，回显、搜索与内部树共用该字段，未配置的字段沿用默认名', async () => {
  const regions = [{ code: '33', title: '浙江', children: [{ code: '3301', title: '杭州' }] }];
  const view = mount({ treeData: regions, fieldNames: { key: 'code' }, allowSearch: true, modelValue: '3301' });
  assert.ok(flatten(view.root).some(node => node.text === '杭州'));
  await view.open();
  assert.deepEqual(view.find('Tree').props.fieldNames, { title: 'title', key: 'code', children: 'children' });
  view.find('input').props.onInput({ target: { value: '杭州' } }); await nextTick();
  assert.deepEqual(view.find('Tree').props.expandedKeys, ['33']);
  view.find('Tree').props.onSelect(['33']); await nextTick();
  assert.deepEqual(view.values, ['33']); view.unmount();
});
it('搜索默认关闭，配置异步回调也不会隐式开启或发请求', async () => {
  let calls = 0;
  const view = mount({ treeData: data, searchData: async () => { calls++; } });
  await view.open();
  assert.equal(view.find('input'), undefined);
  assert.equal(calls, 0);
  assert.deepEqual(view.find('Tree').props.treeData, data);
  view.unmount();
});

it('本地搜索同时匹配映射后的 key 和 label，支持数值零与忽略大小写', async () => {
  const view = mount({ treeData: [{ id: 'ROOT', label: '部门', items: [{ id: 'WEB-A', label: '前端' }, { id: 0, label: '后端' }] }],
    fieldNames: { key: 'id', title: 'label', children: 'items' }, allowSearch: true });
  await view.open();
  for (const [value, key] of [[' web-a ', 'WEB-A'], ['前端', 'WEB-A'], ['0', 0]]) {
    view.find('input').props.onInput({ target: { value } }); await nextTick();
    assert.deepEqual(view.find('Tree').props.treeData[0].items.map((node: { id: string | number }) => node.id), [key]);
    assert.deepEqual(view.find('Tree').props.expandedKeys, ['ROOT']);
  }
  view.unmount();
});

/** 手动完成请求，验证不同返回顺序与取消分支。 */
function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

it('异步搜索由调用方回填 treeData，显示加载状态且不二次筛选服务端结果', async () => {
  const request = deferred();
  const searches: string[] = [];
  let query: string | undefined;
  const view = mount({ treeData: data, allowSearch: true, onSearch: (value: string) => searches.push(value),
    searchData: async (value: string, { signal }: { signal: AbortSignal }) => {
      query = value;
      await request.promise;
      if (!signal.aborted) view.props.treeData = [{ key: 'remote', title: '服务端语义匹配', children: [{ key: 'child', title: '检索结果' }] }];
    } });
  await view.open();
  view.find('input').props.onInput({ target: { value: ' AbC ' } }); await nextTick();
  assert.equal(query, 'AbC');
  assert.deepEqual(searches, [' AbC ']);
  assert.equal(view.find('Tree'), undefined);
  assert.ok(flatten(view.root).some(node => node.text.trim() === '搜索中…'));
  request.resolve(); await request.promise; await nextTick(); await nextTick();
  assert.equal(view.find('Tree').props.treeData[0].title, '服务端语义匹配');
  assert.deepEqual(view.find('Tree').props.expandedKeys, ['remote']);
  assert.deepEqual(view.values, []);
  view.unmount();
});

it('关键词变化取消旧请求，旧请求完成不会覆盖结果或结束新请求的加载状态', async () => {
  const requests: { query: string; signal: AbortSignal; task: ReturnType<typeof deferred> }[] = [];
  const view = mount({ treeData: data, allowSearch: true,
    searchData: async (query: string, { signal }: { signal: AbortSignal }) => {
      const task = deferred(); requests.push({ query, signal, task });
      await task.promise;
      if (!signal.aborted) view.props.treeData = [{ key: query, title: query }];
    } });
  await view.open();
  view.find('input').props.onInput({ target: { value: '旧请求' } });
  view.find('input').props.onInput({ target: { value: '新请求' } }); await nextTick();
  assert.equal(requests[0].signal.aborted, true);
  requests[0].task.resolve(); await requests[0].task.promise; await nextTick();
  assert.equal(view.find('Tree'), undefined);
  assert.ok(flatten(view.root).some(node => node.text.trim() === '搜索中…'));
  requests[1].task.resolve(); await requests[1].task.promise; await nextTick(); await nextTick();
  assert.equal(view.find('Tree').props.treeData[0].key, '新请求');
  view.unmount();
});

it('清空搜索通知空关键词，关闭、关闭搜索和卸载都会取消请求', async () => {
  const requests: { query: string; signal: AbortSignal }[] = [];
  const view = mount({ treeData: data, allowSearch: true,
    searchData: (query: string, { signal }: { signal: AbortSignal }) => {
      requests.push({ query, signal }); return new Promise(() => {});
    } });
  await view.open();
  view.find('input').props.onInput({ target: { value: 'a' } });
  view.find('input').props.onInput({ target: { value: '' } }); await nextTick();
  assert.deepEqual(requests.map(item => item.query), ['a', '']);
  assert.equal(requests[0].signal.aborted, true);
  assert.equal(requests[1].signal.aborted, false);
  view.find('SelectTrigger').props.onClose(); await nextTick();
  assert.equal(requests[1].signal.aborted, true);
  await view.open();
  view.find('input').props.onInput({ target: { value: 'b' } });
  view.props.allowSearch = false; await nextTick();
  assert.equal(requests[2].signal.aborted, true);
  view.props.allowSearch = true; await nextTick();
  view.find('input').props.onInput({ target: { value: 'c' } });
  view.unmount();
  assert.equal(requests[3].signal.aborted, true);
});

it('异步搜索失败显示可重试提示，再次输入可恢复，空结果使用 empty 插槽', async () => {
  const request = deferred();
  let calls = 0;
  const view = mount({ treeData: data, allowSearch: true, searchData: async () => {
    calls++;
    if (calls === 1) await request.promise;
    else view.props.treeData = [];
  } }, undefined, { empty: () => [h('strong', '未找到相关部门')] });
  await view.open();
  view.find('input').props.onInput({ target: { value: '服务端' } }); await nextTick();
  request.reject(new Error('网络失败')); await request.promise.catch(() => {}); await nextTick();
  assert.ok(flatten(view.root).some(node => node.text.trim() === '搜索失败，请重新输入'));
  view.find('input').props.onInput({ target: { value: '服务端' } }); await nextTick(); await nextTick();
  assert.equal(calls, 2);
  assert.equal(view.find('strong').text, '未找到相关部门');
  view.unmount();
});

it('异步搜索可与 loadData 配合，懒加载收到映射后的源节点并更新搜索结果', async () => {
  const view = mount({ treeData: [], allowSearch: true, fieldNames: { key: 'id', title: 'label', children: 'items' },
    searchData: async () => { view.props.treeData = [{ id: 'remote', label: '远程部门' }]; },
    loadData: async (node: { items?: unknown[] }) => { node.items = [{ id: 0, label: '异步子级', isLeaf: true }]; } });
  await view.open();
  view.find('input').props.onInput({ target: { value: '部门查询' } }); await nextTick(); await nextTick();
  const displayed = view.find('Tree').props.treeData[0];
  await view.find('Tree').props.loadData(displayed); await nextTick();
  const source = view.props.treeData as { id: string; items: { id: number }[] }[];
  assert.equal(source[0].items[0].id, 0);
  assert.deepEqual(view.find('Tree').props.loadedKeys, ['remote']);
  assert.equal(view.find('Tree').props.treeData[0].items[0].label, '异步子级');
  view.unmount();
});

it('懒加载由选择器记录已加载 key，收起后重建的树仍拿到记录，重复加载不重复写入', async () => {
  const requested: unknown[] = [];
  const updates: unknown[] = [];
  const view = mount({ treeData: [{ key: 'root', title: '根' }], loadData: async (node: { key: string }) => { requested.push(node.key); },
    'onUpdate:loadedKeys': (keys: unknown) => updates.push(keys) });
  await view.open();
  assert.equal(view.find('Tree').props.loadedKeys, undefined);
  await view.find('Tree').props.loadData({ key: 'root', title: '根' }); await nextTick();
  assert.deepEqual(view.find('Tree').props.loadedKeys, ['root']);
  view.find('SelectTrigger').props.onClose(); await nextTick(); await view.open();
  assert.deepEqual(view.find('Tree').props.loadedKeys, ['root']);
  await view.find('Tree').props.loadData({ key: 'root', title: '根' }); await nextTick();
  assert.deepEqual(requested, ['root', 'root']); assert.deepEqual(updates, [['root']]); view.unmount();
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
