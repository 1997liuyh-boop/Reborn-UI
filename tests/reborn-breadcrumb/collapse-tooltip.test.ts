/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, it } from 'node:test';
import { installDom, loadAppModule, wait } from '../composables/harness';

const dom = installDom();
const { createApp, h, ref } = await import('vue');
const { RebornBreadcrumb: Breadcrumb, RebornBreadcrumbItem: Item } = await loadAppModule<typeof import('../../app/components/reborn/ui/reborn-breadcrumb')>('app/components/reborn/ui/reborn-breadcrumb/index.ts');
after(() => dom.window.close());

/** 挂载真实组件，保留提示层和事件处理，仅替换站点全局组件。 */
function mount(render: () => any) {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp({ render });
  app.component('Icon', { props: ['name'], render() { return h('i', { 'data-icon': this.name }); } });
  app.component('NuxtLink', { props: ['to'], setup: (props, { slots }) => () => h('a', { href: props.to }, slots.default?.()) });
  const warnings: string[] = [];
  app.config.warnHandler = message => warnings.push(message);
  app.mount(container);
  return { container, warnings, destroy() { app.unmount(); container.remove(); } };
}

/** 从省略号向上找到接收 hover 的提示触发容器。 */
function hover(container: HTMLElement) {
  const more = container.querySelector('[aria-label="查看完整面包屑"]');
  assert.ok(more, '折叠后应有提示触发器');
  more.parentElement!.parentElement!.dispatchEvent(new MouseEvent('mouseenter'));
}

const labels = (root: ParentNode) => [...root.querySelectorAll('.reborn-breadcrumb-item__link')].map(node => node.textContent);

it('routes 折叠提示展示完整路径、自定义内容与分隔符，并随数据变化更新', async () => {
  const routes = ref(['首页', '频道', '分类', '当前页'].map(label => ({ label })));
  const fixture = mount(() => h(Breadcrumb, { routes: routes.value, maxCount: 2 }, {
    'item-render': ({ route }: any) => h('strong', route.label),
    separator: () => h('b', '>'),
  }));
  try {
    await wait();
    hover(fixture.container);
    await wait(180);
    const preview = document.querySelector('[aria-label="完整面包屑"]')!;
    assert.ok(preview);
    assert.deepEqual(labels(preview), ['首页', '频道', '分类', '当前页']);
    assert.equal(preview.querySelectorAll('strong').length, 4);
    assert.equal(preview.querySelector('.reborn-breadcrumb-item > span[aria-hidden]')?.textContent, '>');
    assert.equal(preview.querySelector('.hidden'), null);
    routes.value = [{ label: '新首页' }, { label: '新频道' }, { label: '新分类' }, { label: '新页面' }, { label: '详情' }];
    await wait();
    assert.deepEqual(labels(document.querySelector('[aria-label="完整面包屑"]')!), routes.value.map(route => route.label));
    assert.deepEqual(fixture.warnings, []);
  } finally { fixture.destroy(); }
});

it('插槽提示保留显式排序、图标及自定义省略号，并沿用默认 hover 触发', async () => {
  const fixture = mount(() => h(Breadcrumb, { maxCount: 2, separatorIcon: 'lucide:chevron-right' }, {
    default: () => [2, 0, 1].map(order => h(Item, { key: order, order }, () => [h('i', { 'data-custom-icon': order }), String(order)])),
    'more-icon': () => h('b', '更多层级'),
  }));
  try {
    const more = fixture.container.querySelector<HTMLElement>('[aria-label="查看完整面包屑"]')!;
    assert.equal(more.textContent, '更多层级');
    await wait();
    more.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    await wait(180);
    assert.equal(document.querySelector('[role="tooltip"]'), null, '默认 Tooltip 不因聚焦打开');
    hover(fixture.container);
    await wait(180);
    const preview = document.querySelector('[aria-label="完整面包屑"]')!;
    assert.deepEqual(labels(preview), ['0', '1', '2']);
    assert.equal(preview.querySelectorAll('[data-custom-icon]').length, 3);
    assert.equal(preview.querySelectorAll('[data-icon="lucide:chevron-right"]').length, 3);
    assert.deepEqual(fixture.warnings, []);
  } finally { fixture.destroy(); }
});

it('collapseTooltip 可动态关闭并移除已打开提示，取消折叠后不保留触发器', async () => {
  const enabled = ref(true);
  const maxCount = ref(2);
  const routes = ['首页', '频道', '分类', '当前页'].map(label => ({ label }));
  const fixture = mount(() => h(Breadcrumb, { routes, maxCount: maxCount.value, collapseTooltip: enabled.value }));
  try {
    await wait();
    hover(fixture.container);
    await wait(180);
    assert.ok(document.querySelector('[role="tooltip"]'));
    enabled.value = false;
    await wait();
    assert.equal(document.querySelector('[role="tooltip"]'), null);
    assert.equal(fixture.container.querySelector('[aria-label="查看完整面包屑"]'), null);
    assert.ok(fixture.container.querySelector('[class*="more"]'), '关闭提示仍应保留省略号');
    enabled.value = true;
    await wait();
    assert.ok(fixture.container.querySelector('[aria-label="查看完整面包屑"]'));
    maxCount.value = 0;
    await wait();
    assert.equal(fixture.container.querySelector('[aria-label="查看完整面包屑"]'), null);
    assert.equal(fixture.container.querySelector('.hidden'), null);
    assert.deepEqual(fixture.warnings, []);
  } finally { fixture.destroy(); }
});

it('完整路径预览不覆盖原条目及自定义插槽元素的 ref', async () => {
  const itemRef = ref();
  const elementRef = ref();
  const fixture = mount(() => h(Breadcrumb, { maxCount: 2 }, () => [
    h(Item, { ref: itemRef }, () => h('strong', { ref: elementRef }, '首页')),
    h(Item, null, () => '频道'),
    h(Item, null, () => '当前页'),
  ]));
  try {
    await wait();
    const originalItem = itemRef.value;
    const originalElement = elementRef.value;
    hover(fixture.container);
    await wait(180);
    assert.ok(document.querySelector('[aria-label="完整面包屑"]'));
    assert.equal(itemRef.value, originalItem);
    assert.equal(elementRef.value, originalElement);
    assert.ok(fixture.container.contains(elementRef.value));
    assert.deepEqual(fixture.warnings, []);
  } finally { fixture.destroy(); }
});
