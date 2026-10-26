/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, it } from 'node:test';
import { installDom, loadAppModule, wait } from '../composables/harness';

const dom = installDom();
Object.assign(globalThis, { ResizeObserver: class { observe() {} unobserve() {} disconnect() {} } });
const { createApp, h, ref } = await import('vue');
const { default: Popover } = await loadAppModule<typeof import('../../app/components/reborn/ui/reborn-popover/RebornPopover.vue')>('app/components/reborn/ui/reborn-popover/RebornPopover.vue');
const { default: Popconfirm } = await loadAppModule<typeof import('../../app/components/reborn/ui/reborn-popconfirm/RebornPopconfirm.vue')>('app/components/reborn/ui/reborn-popconfirm/RebornPopconfirm.vue');
after(() => dom.window.close());

/** 挂载后返回「触发器上显示的显隐状态」与点击触发器的方法 */
function mount(render: () => ReturnType<typeof h>) {
  const app = createApp({ render });
  app.component('Icon', { render: () => h('i') });
  app.component('RebornButton', { setup: (_: unknown, { slots }: { slots: any }) => () => h('button', slots.default?.()) });
  const container = document.createElement('div');
  document.body.append(container);
  app.mount(container);
  const trigger = () => container.querySelector('[data-state]') as HTMLElement;
  return {
    state: () => trigger().dataset.state,
    click: async () => { trigger().click(); await wait(); },
    stop: () => { app.unmount(); container.remove(); },
  };
}
const triggerSlot = { default: ({ open }: { open: boolean }) => h('span', { 'data-state': String(open) }, '触发') };

it('Web Popover 传入 open 后严格受控：只派发 update:open，父级不回写（只传值或拒收）就保持父值', async () => {
  const updates: boolean[] = [];
  // 只传值、不接更新事件
  const readonly = mount(() => h(Popover, { open: false, portal: false }, triggerSlot));
  // 接了更新事件但拒收
  const rejected = mount(() => h(Popover, { 'open': false, 'portal': false, 'onUpdate:open': (value: boolean) => updates.push(value) }, triggerSlot));
  // 正常 v-model
  const model = ref(false);
  const bound = mount(() => h(Popover, { 'open': model.value, 'portal': false, 'onUpdate:open': (value: boolean) => { model.value = value; } }, triggerSlot));
  // 未绑定：组件自管
  const local = mount(() => h(Popover, { portal: false }, triggerSlot));
  try {
    for (const t of [readonly, rejected, bound, local]) await t.click();
    assert.equal(readonly.state(), 'false');
    assert.equal(rejected.state(), 'false');
    assert.deepEqual(updates, [true]);
    assert.equal(bound.state(), 'true');
    assert.equal(model.value, true);
    assert.equal(local.state(), 'true');
  } finally { for (const t of [readonly, rejected, bound, local]) t.stop(); }
});

it('Popconfirm 经内部 :open 透传：非受控可开合，defaultOpen 首帧打开', async () => {
  const plain = mount(() => h(Popconfirm, { title: '确认？', portal: false }, triggerSlot));
  const initial = mount(() => h(Popconfirm, { title: '确认？', portal: false, defaultOpen: true }, triggerSlot));
  try {
    await wait();
    assert.equal(plain.state(), 'false');
    await plain.click();
    assert.equal(plain.state(), 'true');
    assert.equal(initial.state(), 'true');
    await initial.click();
    assert.equal(initial.state(), 'false');
  } finally { plain.stop(); initial.stop(); }
});
