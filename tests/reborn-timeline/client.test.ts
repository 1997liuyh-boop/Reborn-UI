import type { TimelineSize, TimelineVariant } from '../../app/components/reborn/ui/reborn-timeline/reborn-timeline.config';
/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, it } from 'node:test';
import { installDom, loadAppModule, wait } from '../composables/harness';

const dom = installDom();
const { createApp, h, ref } = await import('vue');
const { RebornTimeline: Timeline, RebornTimelineItem: Item } = await loadAppModule<typeof import('../../app/components/reborn/ui/reborn-timeline')>('app/components/reborn/ui/reborn-timeline/index.ts');
after(() => dom.window.close());

it('尺寸与形态响应父级变化，节点可覆盖或恢复继承，sm 不渲染图标', async () => {
  for (const itemsMode of [false, true]) {
    const size = ref<TimelineSize>('sm');
    const variant = ref<TimelineVariant>('outlined');
    const ownSize = ref<TimelineSize | undefined>('lg');
    const ownVariant = ref<TimelineVariant | undefined>('solid');
    const container = document.createElement('div');
    const app = createApp({ render: () => {
      const items = [
        { key: 'inherited', content: '继承节点', loading: true },
        { key: 'own', content: '覆盖节点', size: ownSize.value, variant: ownVariant.value, icon: 'lucide:check' },
      ];
      const props = { size: size.value, variant: variant.value, ui: { dot: 'test-dot', icon: 'test-icon' } };
      return itemsMode ? h(Timeline, { ...props, items }) : h(Timeline, props, () => items.map(item => h(Item, item)));
    } });
    app.component('Icon', { render: () => h('i') });
    app.mount(container);
    const dots = () => [...container.querySelectorAll('.test-dot')];
    try {
      assert.equal(dots()[0]!.children.length, 0, 'sm 即使 loading 也不渲染图标');
      assert.equal(dots()[1]!.querySelectorAll('.test-icon').length, 1, '单节点 lg 覆盖父级 sm');
      assert.ok(dots()[0]!.classList.contains('border-primary'));
      assert.ok(dots()[1]!.classList.contains('bg-primary'));
      size.value = 'md';
      variant.value = 'solid';
      await wait();
      assert.ok(dots()[0]!.querySelector('.test-icon')!.classList.contains('size-1.5'));
      assert.ok(dots()[1]!.querySelector('.test-icon')!.classList.contains('size-2'));
      assert.ok(dots()[0]!.classList.contains('bg-primary'));
      ownSize.value = undefined;
      ownVariant.value = undefined;
      await wait();
      assert.ok(dots()[1]!.querySelector('.test-icon')!.classList.contains('size-1.5'), '清除单节点配置后恢复继承');
      size.value = 'sm';
      await wait();
      assert.ok(dots().every(dot => !dot.children.length));
      assert.ok([...container.querySelectorAll('li')].every(li => !li.hasAttribute('size') && !li.hasAttribute('variant')));
    } finally { app.unmount(); }
  }
});

it('sm 跳过自定义图标插槽，切到 lg 后提供正确尺寸的插槽类名', async () => {
  const size = ref<TimelineSize>('sm');
  const container = document.createElement('div');
  const app = createApp({ render: () => h(Timeline, { size: size.value }, () => h(Item, {}, {
    icon: (scope: { class: string }) => h('i', { class: scope.class, 'data-custom-icon': '' }),
    default: () => '自定义节点',
  })) });
  app.component('Icon', { render: () => h('i') });
  app.mount(container);
  try {
    assert.equal(container.querySelector('[data-custom-icon]'), null);
    size.value = 'lg';
    await wait();
    assert.ok(container.querySelector('[data-custom-icon]')!.classList.contains('size-2'));
    size.value = 'sm';
    await wait();
    assert.equal(container.querySelector('[data-custom-icon]'), null);
  } finally { app.unmount(); }
});

it('插槽闭包和时间戳、图标、内容插槽条件增删跟随更新', async () => {
  const enabled = ref(false);
  const label = ref('旧正文');
  const container = document.createElement('div');
  const app = createApp({ render: () => h(Timeline, {}, () => h(Item, { timestamp: '默认时间', content: label.value }, enabled.value ? {
    timestamp: () => h('b', '动态时间'), icon: () => h('i', '动态图标'), default: () => h('strong', '动态正文'),
  } : {})) });
  app.component('Icon', { render: () => h('i') });
  app.mount(container);
  try {
    assert.match(container.textContent!, /默认时间/);
    assert.match(container.textContent!, /旧正文/);
    enabled.value = true;
    await wait();
    assert.match(container.textContent!, /动态时间/);
    assert.match(container.textContent!, /动态图标/);
    assert.match(container.textContent!, /动态正文/);
    assert.doesNotMatch(container.textContent!, /默认时间|旧正文/);
    enabled.value = false;
    label.value = '新正文';
    await wait();
    assert.match(container.textContent!, /默认时间/);
    assert.match(container.textContent!, /新正文/);
    assert.doesNotMatch(container.textContent!, /动态时间|动态图标|动态正文|旧正文/);
  } finally { app.unmount(); }
});

it('items 模式只传声明过的字段，业务字段不会落成 DOM 属性；根节点是单个 ol', async () => {
  const container = document.createElement('div');
  const timelineRef = ref<{ $el: Element } | null>(null);
  const items = [
    { key: 'a', content: '第一项', id: 1, userId: 'u-1', meta: { level: 2 } },
    { key: 'b', content: '第二项', id: 2, color: 'success' },
  ];
  const app = createApp({ render: () => h(Timeline, { ref: timelineRef, items, 'data-root': 'timeline' }) });
  app.component('Icon', { render: () => h('i') });
  app.mount(container);
  try {
    await wait();
    const lis = [...container.querySelectorAll('li')];
    assert.equal(lis.length, 2);
    for (const li of lis) {
      assert.equal(li.hasAttribute('id'), false);
      assert.equal(li.hasAttribute('userid'), false);
      assert.equal(li.hasAttribute('meta'), false);
    }
    assert.match(container.textContent!, /第一项.*第二项/);
    const el = timelineRef.value!.$el;
    assert.equal(el.tagName, 'OL');
    assert.equal(el.getAttribute('data-root'), 'timeline');
    assert.equal(container.children.length, 1);
  } finally { app.unmount(); }
});
