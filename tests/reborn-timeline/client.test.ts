/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, it } from 'node:test';
import { installDom, loadAppModule, wait } from '../composables/harness';

const dom = installDom();
const { createApp, h, ref } = await import('vue');
const { RebornTimeline: Timeline, RebornTimelineItem: Item } = await loadAppModule<typeof import('../../app/components/reborn/ui/reborn-timeline')>('app/components/reborn/ui/reborn-timeline/index.ts');
after(() => dom.window.close());

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
