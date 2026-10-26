/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, it } from 'node:test';
import { installDom, loadAppModule, wait } from '../composables/harness';

const dom = installDom();
const { createApp, createSSRApp, defineComponent, Fragment, h, ref } = await import('vue');
const { renderToString } = await import('vue/server-renderer');
const { RebornTabs: Tabs, RebornTabPane: Pane } = await loadAppModule<typeof import('../../app/components/reborn/ui/reborn-tabs')>('app/components/reborn/ui/reborn-tabs/index.ts');
after(() => dom.window.close());

it('SSR 首屏包含声明式标题、标题插槽、选中态与懒加载内容', async () => {
  const app = createSSRApp({ render: () => h(Tabs, { lazyLoad: true }, { default: () => h(Fragment, [
    h(Pane, { paneKey: 'first', key: 'first', title: '第一项' }, () => '首项内容'),
    h(Pane, { paneKey: 'second', key: 'second', title: '第二项' }, { title: () => h('strong', '插槽标题'), default: () => '隐藏内容' }),
  ]) }) });
  app.component('Icon', { render: () => h('i') });
  const html = await renderToString(app);
  assert.equal((html.match(/role="tab"/g) ?? []).length, 2);
  assert.match(html, /第一项/);
  assert.match(html, /<strong>插槽标题<\/strong>/);
  assert.match(html, /aria-selected="true"/);
  assert.match(html, /首项内容/);
  assert.doesNotMatch(html, /隐藏内容/);
});

it('默认插槽闭包替换与条件标题增删会更新，独立实例保持隔离', async () => {
  const title = ref('旧标题');
  const extra = ref(false);
  const container = document.createElement('div');
  const app = createApp(defineComponent({ setup: () => () => h('main', [
    h(Tabs, { type: 'text' }, { default: () => [h(Pane, { paneKey: 'first', key: 'first', title: title.value }, extra.value ? { title: () => h('strong', '动态标题') } : {}), extra.value && h(Pane, { paneKey: 'extra', key: 'extra', title: '新增' })] }),
    h(Tabs, { type: 'text' }, () => h(Pane, { title: '独立实例' })),
  ]) }));
  app.component('Icon', { render: () => h('i') });
  app.mount(container);
  try {
    title.value = '新标题';
    await wait();
    assert.match(container.textContent!, /新标题/);
    assert.doesNotMatch(container.textContent!, /旧标题/);
    extra.value = true;
    await wait();
    assert.equal(container.querySelectorAll('[role="tab"]').length, 3);
    assert.match(container.textContent!, /动态标题.*新增.*独立实例/);
    extra.value = false;
    await wait();
    assert.equal(container.querySelectorAll('[role="tab"]').length, 2);
    assert.doesNotMatch(container.textContent!, /动态标题|新增/);
  } finally { app.unmount(); }
});

it('指示条与液体滑块的动画不触发宿主逐帧更新', async () => {
  const prototype = dom.window.HTMLElement.prototype;
  const originalRect = prototype.getBoundingClientRect;
  const widthDescriptor = Object.getOwnPropertyDescriptor(prototype, 'clientWidth');
  Object.defineProperty(prototype, 'clientWidth', { configurable: true, get: () => 400 });
  prototype.scrollTo = () => {};
  prototype.getBoundingClientRect = function () {
    const tab = this.closest('[role="tab"]');
    const left = tab?.textContent?.includes('第二项') ? 100 : 0;
    const width = tab ? 40 : 400;
    return { x: left, y: 0, left, right: left + width, top: 0, bottom: 30, width, height: 30, toJSON: () => ({}) };
  };
  try {
    for (const type of ['line', 'capsule']) {
      const active = ref('first');
      let updates = 0;
      const container = document.createElement('div');
      const app = createApp({ render: () => h(Tabs, { type, activeKey: active.value }, () => [h(Pane, { paneKey: 'first', key: 'first', title: '第一项' }), h(Pane, { paneKey: 'second', key: 'second', title: '第二项' })]) });
      app.component('Icon', { render: () => h('i') });
      app.mixin({ updated() { if (this.$options.name === 'RebornTabs') updates++; } });
      app.mount(container);
      await wait(50);
      updates = 0;
      active.value = 'second';
      await wait(900);
      assert.ok(updates <= 4, `${type} 切换期间宿主更新 ${updates} 次`);
      const overlay = container.querySelector<HTMLElement>('[role="tablist"] > span[aria-hidden="true"]')!;
      assert.equal(overlay.style.left, '100px');
      app.unmount();
    }
  } finally {
    prototype.getBoundingClientRect = originalRect;
    if (widthDescriptor) Object.defineProperty(prototype, 'clientWidth', widthDescriptor);
    else Reflect.deleteProperty(prototype, 'clientWidth');
  }
});

it('条件标签移除后释放观察目标，卸载时清空全部目标', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver');
  const targets = new Set<Element>();
  const removed: Element[] = [];
  class Observer {
    observe(target: Element) { targets.add(target); }
    unobserve(target: Element) { targets.delete(target); removed.push(target); }
    disconnect() { targets.clear(); }
  }
  Object.defineProperty(globalThis, 'ResizeObserver', { configurable: true, writable: true, value: Observer });
  const extra = ref(true);
  const container = document.createElement('div');
  const app = createApp({ render: () => h(Tabs, { type: 'text' }, () => [
    h(Pane, { paneKey: 'first', key: 'first', title: '常驻' }), extra.value && h(Pane, { paneKey: 'extra', key: 'extra', title: '临时' }),
  ]) });
  app.component('Icon', { render: () => h('i') });
  try {
    app.mount(container);
    await wait();
    const oldTab = container.querySelectorAll('[role="tab"]')[1]!;
    assert.ok(targets.has(oldTab));
    extra.value = false;
    await wait();
    assert.ok(removed.includes(oldTab));
    assert.ok(!targets.has(oldTab));
    assert.equal([...targets].filter(target => target.getAttribute('role') === 'tab').length, 1);
  } finally {
    app.unmount();
    assert.equal(targets.size, 0);
    if (descriptor) Object.defineProperty(globalThis, 'ResizeObserver', descriptor);
    else Reflect.deleteProperty(globalThis, 'ResizeObserver');
  }
});

it('显式 order 不覆盖本地拖拽，父级改写后接管，选中业务值保持', async () => {
  const order = ref(['a', 'b', 'c']);
  const title = ref('');
  const events: unknown[] = [];
  const container = document.createElement('div');
  const app = createApp({ render: () => h(Tabs, { type: 'text', draggable: true, activeKey: 'c', onSort: (keys: unknown) => events.push(keys) }, () => order.value.map((key, index) => h(Pane, { key, paneKey: key, order: index, title: key + title.value }))) });
  app.component('Icon', { render: () => h('i') });
  app.mount(container);
  const labels = () => [...container.querySelectorAll('[role="tab"]')].map(node => node.textContent);
  try {
    await wait();
    const tabs = container.querySelectorAll('[role="tab"]');
    tabs[0]!.dispatchEvent(new dom.window.Event('dragstart', { bubbles: true }));
    const over = new dom.window.Event('dragover', { bubbles: true, cancelable: true });
    Object.defineProperty(over, 'clientX', { value: 100 });
    tabs[2]!.dispatchEvent(over);
    await wait();
    tabs[0]!.dispatchEvent(new dom.window.Event('dragend', { bubbles: true }));
    assert.deepEqual(labels(), ['b', 'c', 'a']);
    assert.deepEqual(events, [['b', 'c', 'a']]);
    title.value = '!';
    await wait();
    assert.deepEqual(labels(), ['b!', 'c!', 'a!']);
    order.value = ['c', 'a', 'b'];
    await wait();
    assert.deepEqual(labels(), ['c!', 'a!', 'b!']);
    assert.equal(container.querySelector('[aria-selected="true"]')?.textContent, 'c!');
  } finally { app.unmount(); }
});

it('数字与同字面字符串业务值不会令拖拽误判为父级改写 order', async () => {
  const container = document.createElement('div');
  const events: unknown[] = [];
  const keys = [1, '1', 2];
  const app = createApp({ render: () => h(Tabs, { type: 'text', draggable: true, onSort: (value: unknown) => events.push(value) }, () => keys.map((key, index) => h(Pane, { key, paneKey: key, order: index, title: `${typeof key}:${key}` }))) });
  app.component('Icon', { render: () => h('i') });
  app.mount(container);
  try {
    await wait();
    const tabs = container.querySelectorAll('[role="tab"]');
    tabs[0]!.dispatchEvent(new dom.window.Event('dragstart', { bubbles: true }));
    const over = new dom.window.Event('dragover', { bubbles: true, cancelable: true });
    Object.defineProperty(over, 'clientX', { value: 100 });
    tabs[2]!.dispatchEvent(over);
    await wait();
    tabs[0]!.dispatchEvent(new dom.window.Event('dragend', { bubbles: true }));
    assert.deepEqual([...container.querySelectorAll('[role="tab"]')].map(node => node.textContent), ['string:1', 'number:2', 'number:1']);
    assert.deepEqual(events, [['1', 2, 1]]);
  } finally { app.unmount(); }
});

it('前面的面板被 v-if 隐藏或 v-for 增删后，后面面板的组件实例与状态保持不变', async () => {
  const { onBeforeUnmount } = await import('vue');
  const mounted: string[] = [];
  const unmounted: string[] = [];
  // 每个面板里放一个有状态的子组件，挂载 / 卸载都记账，用来判断实例是否被错位复用或重挂
  const Probe = defineComponent({
    props: { name: { type: String, required: true } },
    setup(probe) {
      mounted.push(probe.name);
      onBeforeUnmount(() => unmounted.push(probe.name));
      return () => h('input', { 'data-probe': probe.name });
    },
  });
  const showB = ref(true);
  const list = ref(['x', 'y']);
  const container = document.createElement('div');
  // 用模板字符串在运行时编译，覆盖真实模板里 v-if 注释占位与 v-for Fragment 的结构
  const app = createApp({
    components: { RebornTabs: Tabs, RebornTabPane: Pane, Probe },
    setup: () => ({ showB, list }),
    template: `
      <RebornTabs type="text">
        <RebornTabPane pane-key="a" title="A"><Probe name="a" /></RebornTabPane>
        <RebornTabPane v-if="showB" pane-key="b" title="B"><Probe name="b" /></RebornTabPane>
        <RebornTabPane pane-key="c" title="C"><Probe name="c" /></RebornTabPane>
      </RebornTabs>
      <RebornTabs type="text">
        <RebornTabPane v-for="item in list" :key="item" :pane-key="item" :title="item"><Probe :name="item" /></RebornTabPane>
        <RebornTabPane pane-key="tail" title="尾部"><Probe name="tail" /></RebornTabPane>
      </RebornTabs>`,
  });
  app.component('Icon', { render: () => h('i') });
  app.mount(container);
  try {
    await wait();
    assert.deepEqual(mounted, ['a', 'b', 'c', 'x', 'y', 'tail']);
    const inputC = container.querySelector<HTMLInputElement>('[data-probe="c"]')!;
    inputC.value = '已填写';
    const inputTail = container.querySelector<HTMLInputElement>('[data-probe="tail"]')!;
    inputTail.value = '尾部已填写';

    showB.value = false;
    await wait();
    assert.deepEqual(unmounted, ['b'], '只卸载被隐藏的面板，后面的面板不被复用或重挂');
    assert.equal(container.querySelector('[data-probe="c"]'), inputC);
    assert.equal(inputC.value, '已填写');
    assert.deepEqual([...container.querySelectorAll('[role="tab"]')].slice(0, 2).map(tab => tab.textContent), ['A', 'C']);

    list.value = ['x', 'y', 'z'];
    await wait();
    assert.deepEqual(mounted, ['a', 'b', 'c', 'x', 'y', 'tail', 'z'], '列表增项只挂载新项，后面的静态面板不重挂');
    assert.deepEqual(unmounted, ['b']);
    assert.equal(container.querySelector('[data-probe="tail"]'), inputTail);
    assert.equal(inputTail.value, '尾部已填写');
  } finally { app.unmount(); }
});

it('缺省 paneKey 按书写位置编号：前面的 v-if 面板隐藏后选中项不漂移，普通节点不会多出 panekey 属性', async () => {
  const showB = ref(true);
  const container = document.createElement('div');
  const app = createApp({
    components: { RebornTabs: Tabs, RebornTabPane: Pane },
    setup: () => ({ showB }),
    template: `
      <RebornTabs type="text">
        <RebornTabPane title="A">A 内容</RebornTabPane>
        <RebornTabPane v-if="showB" title="B">B 内容</RebornTabPane>
        <RebornTabPane title="C">C 内容</RebornTabPane>
        <span class="plain">普通节点</span>
      </RebornTabs>`,
  });
  app.component('Icon', { render: () => h('i') });
  app.mount(container);
  try {
    await wait();
    const tabs = () => [...container.querySelectorAll<HTMLElement>('[role="tab"]')];
    tabs()[2]!.click();
    await wait();
    assert.equal(container.querySelector('[aria-selected="true"]')?.textContent, 'C');
    showB.value = false;
    await wait();
    assert.deepEqual(tabs().map(tab => tab.textContent), ['A', 'C']);
    assert.equal(container.querySelector('[aria-selected="true"]')?.textContent, 'C');
    const visible = [...container.querySelectorAll<HTMLElement>('[role="tabpanel"]')].filter(panel => panel.style.display !== 'none');
    assert.deepEqual(visible.map(panel => panel.textContent), ['C 内容']);
    const plain = container.querySelector('.plain')!;
    assert.equal(plain.hasAttribute('panekey'), false);
    assert.equal(plain.hasAttribute('pane-key'), false);
  } finally { app.unmount(); }
});

it('根节点是单个元素：$el 指向根元素，透传属性落在根上', async () => {
  const container = document.createElement('div');
  const tabsRef = ref<{ $el: Element } | null>(null);
  const app = createApp({ render: () => h(Tabs, { ref: tabsRef, id: 'tabs-root', type: 'text' }, () => [h(Pane, { paneKey: 'a', title: 'A' })]) });
  app.component('Icon', { render: () => h('i') });
  app.mount(container);
  try {
    await wait();
    const el = tabsRef.value!.$el;
    assert.equal(el.nodeType, 1);
    assert.equal(el.getAttribute('id'), 'tabs-root');
    assert.equal(container.children.length, 1);
  } finally { app.unmount(); }
});
