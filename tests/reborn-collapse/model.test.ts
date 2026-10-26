/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, it } from 'node:test';
import { installDom, loadAppModule, wait } from '../composables/harness';

const dom = installDom();
const { createApp, h, ref, shallowRef } = await import('vue');
const { RebornCollapse: Collapse } = await loadAppModule<typeof import('../../app/components/reborn/ui/reborn-collapse')>('app/components/reborn/ui/reborn-collapse/index.ts');
after(() => dom.window.close());

it('Collapse 受控时已处于目标状态再调用 show / hide 不重复派发 update:modelValue', async () => {
  const value = shallowRef<boolean | undefined>(true);
  const updates: boolean[] = [];
  const exposed = ref<{ show: () => void; hide: () => void }>();
  const root = document.createElement('div');
  const app = createApp({ render: () => h(Collapse, { ref: exposed, 'modelValue': value.value, 'onUpdate:modelValue': (next: boolean) => { updates.push(next); value.value = next; } }, {
    default: ({ open }: { open: boolean }) => h('button', String(open)), content: () => h('p', '内容'),
  }) });
  app.mount(root);
  try {
    exposed.value!.show();
    await wait();
    assert.deepEqual(updates, [], '已展开时 show() 不派发');
    exposed.value!.hide();
    await wait();
    assert.deepEqual(updates, [false]);
    exposed.value!.hide();
    await wait();
    assert.deepEqual(updates, [false], '已收起时 hide() 不派发');
    value.value = undefined;
    await wait();
    exposed.value!.show();
    await wait();
    assert.deepEqual(updates, [false, true], '显式 undefined 按收起处理，show() 正常派发');
    assert.equal(root.querySelector('button')!.textContent, 'true');
  } finally { app.unmount(); }
});
