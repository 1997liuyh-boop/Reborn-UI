/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, readFile, rmdir, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { after, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { createRenderer, h, nextTick } from 'vue';

/** 只替换演示框架壳；表格、按钮、输入、选择、文本及滚动条均编译真实源码。 */
const folder = await mkdtemp(resolve('tests/reborn-table/.demo-runtime-'));
const output = resolve(folder, 'demo.mjs');
after(async () => { await unlink(output); await rmdir(folder); });
await build({
  entryPoints: [resolve('app/components/reborn/examples/reborn-table/RebornTableDemo.vue')],
  outfile: output, bundle: true, format: 'esm', platform: 'node', packages: 'external', alias: { '~': resolve('app') },
  plugins: [{ name: 'table-demo-test', setup(builder) {
    builder.onResolve({ filter: /^#components$/ }, () => ({ path: 'demo-shell', namespace: 'demo-shell' }));
    builder.onLoad({ filter: /.*/, namespace: 'demo-shell' }, () => ({ contents: `
      import {defineComponent,h,inject} from 'vue';
      export const DemoSection = defineComponent({props:['title'],setup(props,{slots}) {
        const section = inject('demo-section');
        return () => (Array.isArray(section) ? section.includes(props.title) : section === props.title) ? h('section',{'data-section':props.title},[slots.description?.(),slots.default?.()]) : null;
      }});
      export const DemoBlock = defineComponent({setup:(_, {slots})=>()=>h('div',slots.default?.())});
      export const DemoNote = defineComponent({setup:(_, {slots})=>()=>h('p',slots.default?.())});
      export const Icon = defineComponent({setup:()=>()=>h('svg')});
      export const Playground = defineComponent({setup:(_, {slots})=> {
        const section = inject('demo-section');
        return ()=>section === 'Playground' ? h('div',[slots.tag?.(),slots.default?.()]) : null;
      }});
    `, loader: 'js', resolveDir: resolve('.') }));
    builder.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'js' }));
    builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
      // 补齐 Nuxt 自动导入，仍使用真实实现，不改变业务代码。
      let source = await readFile(path, 'utf8');
      if (path.endsWith('RebornSwitch.vue')) source = source.replace('<script setup lang="ts">', '<script setup lang="ts">\nimport { useFormInject } from "~/composables/useFieldGroup";');
      const { descriptor } = parse(source, { filename: path });
      return { contents: compileScript(descriptor, { id: 'table-demo-test', inlineTemplate: true, fs: {
        fileExists: existsSync, readFile: file => readFileSync(file, 'utf8'),
      } }).content, loader: 'ts' };
    });
  } }],
});
const Demo = (await import(pathToFileURL(output).href)).default;

/** 内存 DOM 只提供组件所需的宿主行为，不替换组件状态或事件逻辑。 */
interface Element {
  type: string; text: string; props: Record<string, any>; children: Element[]; parent?: Element;
  style: Record<string, unknown>; scrollTop: number; scrollLeft: number;
  clientWidth: number; clientHeight: number; scrollWidth: number; scrollHeight: number;
  textContent: string; querySelector: (selector: string) => Element | undefined; focus: () => void;
}
let focused: Element | undefined;
function element(type: string, text = ''): Element {
  return {
    type, text, props: {}, children: [], style: {}, scrollTop: 0, scrollLeft: 0,
    clientWidth: 400, clientHeight: 220, scrollWidth: 1800, scrollHeight: 900,
    get textContent() { return content(this); },
    querySelector(selector) { return flatten(this).find(node => selector === '[role="radio"]' && node.props.role === 'radio'); },
    focus() { focused = this; },
  };
}
function flatten(node: Element): Element[] { return [node, ...node.children.flatMap(flatten)]; }
function content(node: Element): string { return node.type === '#comment' ? '' : node.text + node.children.map(content).join(''); }
const teleportRoot = element('body');
const renderer = createRenderer<Element, Element>({
  querySelector: () => teleportRoot,
  createElement: type => element(type), createText: text => element('#text', text), createComment: text => element('#comment', text),
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
const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
Object.defineProperty(globalThis, 'document', { configurable: true, value: { fonts: undefined, removeEventListener() {}, body: { style: {} } } });
after(() => {
  if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
  else Reflect.deleteProperty(globalThis, 'document');
});
function mount(section: string | string[]) {
  const root = element('root');
  const app = renderer.createApp({ render: () => h(Demo) });
  app.provide('demo-section', section);
  app.component('Icon', { render: () => h('svg') });
  app.mount(root);
  return { root, nodes: () => flatten(root), stop: () => app.unmount() };
}
function find(root: Element, predicate: (node: Element) => boolean, message: string) {
  const node = flatten(root).find(predicate);
  assert.ok(node, message);
  return node;
}
function table(root: Element, label: string) { return find(root, node => node.type === 'table' && node.props['aria-label'] === label, `缺少表格：${label}`); }
function row(root: Element, key: number | string) { return find(root, node => node.props['data-row-key'] === key, `缺少记录：${key}`); }
function button(root: Element, label: string) { return find(root, node => node.type === 'button' && content(node).includes(label), `缺少按钮：${label}`); }
function keys(root: Element) { return flatten(root).filter(node => node.props['data-row-key'] !== undefined).map(node => node.props['data-row-key']); }
/** 逐级冒泡，用来捕获行内按钮缺少 stop 时误触发行点击的回归。 */
async function dispatch(target: Element, name = 'onClick', extra: Record<string, unknown> = {}) {
  let stopped = false;
  const event = { target, currentTarget: target, preventDefault() {}, stopPropagation() { stopped = true; }, ...extra };
  for (let node: Element | undefined = target; node; node = node.parent) {
    event.currentTarget = node;
    const handlers = node.props[name];
    for (const handler of Array.isArray(handlers) ? handlers : handlers ? [handlers] : []) await handler(event);
    if (stopped) break;
  }
  await nextTick();
}
function radio(root: Element, key: number) { return find(row(root, key), node => node.props.role === 'radio', '缺少真实单选按钮'); }
function checkbox(root: Element) { return find(root, node => node.type === 'input' && node.props.type === 'checkbox', '缺少真实复选框'); }
function switchLabel(root: Element, label: string) { return find(root, node => node.type === 'label' && content(node).includes(label), `缺少开关：${label}`); }

it('状态类只标记一条警告与一条成功，其余行保留默认底色', () => {
  const t = mount('带状态表格');
  try {
    const status = table(t.root, '报销审核状态');
    assert.match(row(status, 102).props.class, /bg-warning-2/);
    assert.match(row(status, 103).props.class, /bg-success-2/);
    for (const key of [101, 104]) assert.doesNotMatch(row(status, key).props.class, /bg-(success|warning)-2/);
    assert.match(content(status), /待审核/);
  } finally { t.stop(); }
});

it('单选点击和整行点击共用当前键，品牌色高亮与单选同步', async () => {
  const t = mount('单选');
  try {
    const single = table(t.root, '单选与当前报销行');
    await dispatch(radio(single, 101));
    assert.equal(radio(single, 101).props['aria-checked'], true);
    assert.match(row(single, 101).props.class, /bg-brand-2/);
    await dispatch(row(single, 102).children.find(node => node.type === 'td')!);
    assert.equal(radio(single, 102).props['aria-checked'], true);
    assert.equal(radio(single, 101).props['aria-checked'], false);
    assert.match(row(single, 102).props.class, /bg-brand-2/);
  } finally { t.stop(); }
});

it('隐藏单选列后仍可外部设置、点击与清空，重现列时同步选中且键盘联动', async () => {
  const t = mount('单选');
  try {
    const single = table(t.root, '单选与当前报销行');
    await dispatch(button(t.root, '选中林晓'));
    await dispatch(switchLabel(t.root, '显示单选列'));
    assert.equal(flatten(single).filter(node => node.props.role === 'radio').length, 0);
    assert.match(row(single, 101).props.class, /bg-brand-2/);
    await dispatch(row(single, 102).children.find(node => node.type === 'td')!);
    await dispatch(switchLabel(t.root, '显示单选列'));
    assert.equal(radio(single, 102).props['aria-checked'], true);
    await dispatch(radio(single, 102), 'onKeydown', { key: 'ArrowDown' });
    assert.equal(radio(single, 103).props['aria-checked'], true);
    assert.match(row(single, 103).props.class, /bg-brand-2/);
    assert.equal(focused, radio(single, 103));
    await dispatch(button(t.root, '清空单选'));
    for (const key of [101, 102, 103]) {
      assert.equal(radio(single, key).props['aria-checked'], false);
      assert.doesNotMatch(row(single, key).props.class, /bg-brand-2/);
    }
  } finally { t.stop(); }
});

it('多选每批至少八行，禁选、跨批保留和全清空均真实生效', async () => {
  const t = mount('多选');
  try {
    const multi = table(t.root, '跨批次多选报销明细');
    assert.ok(keys(multi).length >= 8);
    const firstKey = keys(multi)[0];
    await dispatch(checkbox(row(multi, firstKey)), 'onChange', { target: { checked: true } });
    const disabled = flatten(multi).find(node => node.type === 'input' && node.props.disabled);
    assert.ok(disabled, '待审核行必须禁选');
    await dispatch(disabled, 'onChange', { target: { checked: true } });
    await dispatch(button(t.root, '切换到第 2 批'));
    assert.ok(keys(multi).length >= 8);
    assert.ok(!keys(multi).includes(firstKey));
    await dispatch(checkbox(row(multi, keys(multi)[0])), 'onChange', { target: { checked: true } });
    await dispatch(button(t.root, '读取已选行'));
    assert.match(content(t.root), /getSelectionRows：.+、.+/);
    await dispatch(button(t.root, '切换到第 1 批'));
    assert.equal(checkbox(row(multi, firstKey)).props.checked, true);
    assert.equal(flatten(multi).find(node => node.type === 'input' && node.props.disabled)!.props.checked, false);
    await dispatch(button(t.root, '清空全部选择'));
    assert.ok(flatten(multi).filter(node => node.type === 'input').every(node => !node.props.checked));
  } finally { t.stop(); }
});

it('金额使用真实 Text 格式化与阈值配色，查看及删除只影响当前示例并阻止冒泡', async () => {
  const t = mount(['自定义列模板', '带斑马纹表格']);
  try {
    const custom = table(t.root, '自定义报销单元格');
    const amount = (key: number) => row(custom, key).children.filter(node => node.type === 'td')[3]!;
    assert.match(content(amount(101)), /¥1280\.00/);
    assert.ok(flatten(amount(101)).some(node => /text-error/.test(node.props.class ?? '')));
    assert.ok(flatten(amount(102)).some(node => /text-primary/.test(node.props.class ?? '')));
    await dispatch(button(row(custom, 101), '查看'));
    assert.match(content(t.root), /查看详情：林晓，lin@example.com/);
    await dispatch(button(row(custom, 102), '删除'));
    assert.deepEqual(keys(custom), [101, 103]);
    assert.match(content(t.root), /已删除：陈晨/);
    assert.doesNotMatch(content(t.root), /点击整行：陈晨/);
    assert.deepEqual(keys(table(t.root, '斑马纹报销明细')), [101, 102, 103, 104, 105]);
  } finally { t.stop(); }
});

it('两种表头的数字输入共享真实最小金额筛选，清空后恢复全部记录', async () => {
  const t = mount('自定义表头');
  try {
    const configured = table(t.root, '自定义数据列表头');
    const declared = table(t.root, '自定义声明列表头');
    const input = (root: Element) => find(root, node => node.props.role === 'spinbutton', '金额表头必须使用数字输入框');
    const total = keys(configured).length;
    await dispatch(input(configured), 'onInput', { target: { value: '1500' } });
    await dispatch(input(configured), 'onBlur');
    assert.deepEqual(keys(configured), [103, 105]);
    assert.deepEqual(keys(declared), [103, 105]);
    assert.equal(input(declared).props.value, '1500');
    assert.match(content(t.root), /1500.*2/);
    await dispatch(input(declared), 'onInput', { target: { value: '' } });
    await dispatch(input(declared), 'onBlur');
    assert.equal(keys(configured).length, total);
    assert.equal(keys(declared).length, total);
  } finally { t.stop(); }
});

it('展开每个父行渲染对应子表，两个边框开关独立生效', async () => {
  const t = mount('展开行');
  try {
    const parent = table(t.root, '带详情的报销明细');
    await dispatch(find(row(parent, 101), node => node.props['aria-label'] === '展开第 1 行', '缺少展开入口'));
    const first = table(t.root, '林晓的报销明细');
    assert.ok(keys(first).length >= 2);
    await dispatch(find(row(parent, 102), node => node.props['aria-label'] === '展开第 2 行', '缺少第二行展开入口'));
    const second = table(t.root, '陈晨的报销明细');
    assert.notEqual(content(first), content(second));
    assert.ok(keys(second).every(key => !keys(first).includes(key)));
    const header = (root: Element) => find(root, node => node.type === 'th', '缺少表头');
    const childClass = header(first).props.class;
    const parentClass = header(parent).props.class;
    await dispatch(switchLabel(t.root, '父表边框'));
    assert.notEqual(header(parent).props.class, parentClass);
    assert.equal(header(first).props.class, childClass);
    const updatedParentClass = header(parent).props.class;
    await dispatch(switchLabel(t.root, '子表边框'));
    assert.notEqual(header(first).props.class, childClass);
    assert.equal(header(parent).props.class, updatedParentClass);
  } finally { t.stop(); }
});

it('固定列演示提供十列真实内容，同时保留左右固定', () => {
  for (const [section, label] of [['固定列', '仅固定列的报销明细'], ['固定列和表头', '固定表头和列的报销明细']]) {
    const t = mount(section!);
    try {
      const fixed = table(t.root, label!);
      const cells = row(fixed, 101).children.filter(node => node.type === 'td');
      assert.equal(cells.length, 10);
      assert.ok(cells.every(cell => content(cell).trim().length > 0));
      assert.equal(cells[0]!.props.style.left, '0px');
      assert.equal(cells.at(-1)!.props.style.right, '0px');
    } finally { t.stop(); }
  }
});
