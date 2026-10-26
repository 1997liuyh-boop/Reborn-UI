/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, it } from 'node:test';
import { installDom, loadAppModule, wait } from '../composables/harness';

const dom = installDom();
const { createApp, h, reactive, ref } = await import('vue');
const { default: Pagination } = await loadAppModule<typeof import('../../app/components/reborn/ui/reborn-pagination/RebornPagination.vue')>('app/components/reborn/ui/reborn-pagination/RebornPagination.vue');
after(() => dom.window.close());

it('pager-item select 同步模型与事件，直接调用也不能绕过禁用', async () => {
  const props = reactive({ total: 120, disabled: false });
  const page = ref(1);
  const changes: number[] = [];
  const actions = new Map<number, () => void>();
  const app = createApp({ render: () => h(Pagination, {
    ...props, layout: 'pager', modelValue: page.value,
    'onUpdate:modelValue': (value: number) => { page.value = value; },
    onCurrentChange: (value: number) => changes.push(value),
  }, { 'pager-item': (scope: { page: number; select: () => void; disabled: boolean }) => {
    actions.set(scope.page, scope.select);
    return h('button', { disabled: scope.disabled, onClick: scope.select }, String(scope.page));
  } }) });
  app.component('Icon', { render: () => h('i') });
  app.component('RebornSelect', { render: () => null });
  app.component('RebornInputNumber', { render: () => null });
  const container = document.createElement('div');
  app.mount(container);
  try {
    actions.get(2)!();
    await wait();
    assert.equal(page.value, 2);
    assert.deepEqual(changes, [2]);
    actions.get(2)!();
    await wait();
    assert.deepEqual(changes, [2]);
    props.disabled = true;
    await wait();
    actions.get(1)!();
    await wait();
    assert.equal(page.value, 2);
    assert.deepEqual(changes, [2]);
    props.disabled = false;
    props.total = 0;
    await wait();
    assert.equal(page.value, 2);
    assert.deepEqual(changes, [2]);
    actions.get(2)!();
    await wait();
    assert.equal(page.value, 2);
    assert.deepEqual(changes, [2]);
  } finally { app.unmount(); }
});

for (const sizeBound of [true, false]) {
  it(`改每页条数导致越界时只钳制一次（page-size ${sizeBound ? '受控' : '非受控'}）`, async () => {
    const page = ref(8);
    const pageSize = ref(10);
    const total = ref(100);
    const changes: number[] = [];
    const modelUpdates: number[] = [];
    let change: ((size: number) => void) | undefined;
    const app = createApp({ render: () => h(Pagination, {
      total: total.value, layout: 'pager, sizes', modelValue: page.value,
      'onUpdate:modelValue': (value: number) => { modelUpdates.push(value); page.value = value; },
      onCurrentChange: (value: number) => changes.push(value),
      ...(sizeBound ? { 'pageSize': pageSize.value, 'onUpdate:pageSize': (value: number) => { pageSize.value = value; } } : {}),
    }, { sizes: (scope: { change: (size: number) => void }) => { change = scope.change; return h('span'); } }) });
    app.component('Icon', { render: () => h('i') });
    app.component('RebornSelect', { render: () => null });
    app.component('RebornInputNumber', { render: () => null });
    const container = document.createElement('div');
    app.mount(container);
    try {
      change!(50);
      await wait();
      assert.equal(page.value, 2);
      assert.deepEqual(changes, [2], 'current-change 只派发一次');
      assert.deepEqual(modelUpdates, [2], 'update:modelValue 只派发一次');
      // total 变小越界：同样只回写一次
      total.value = 30;
      await wait();
      assert.equal(page.value, 1);
      assert.deepEqual(changes, [2, 1]);
      assert.deepEqual(modelUpdates, [2, 1]);
    } finally { app.unmount(); }
  });
}
