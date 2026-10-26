/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, it } from 'node:test';
import { installDom, loadAppModule, wait } from '../composables/harness';

const dom = installDom();
const { createApp, h, shallowRef } = await import('vue');
const { RebornChip: Chip } = await loadAppModule<typeof import('../../app/components/reborn/ui/reborn-chip')>('app/components/reborn/ui/reborn-chip/index.ts');
after(() => dom.window.close());

it('Chip 未传 show 时可见，显式 undefined / null 隐藏，撤掉绑定后恢复可见', async () => {
  const props = shallowRef<Record<string, unknown>>({});
  const root = document.createElement('div');
  const app = createApp({ render: () => h(Chip, { text: '9', ...props.value }, () => h('span', '宿主')) });
  app.mount(root);
  const visible = () => root.textContent!.includes('9');
  try {
    assert.equal(visible(), true);
    for (const show of [undefined, null, false]) {
      props.value = { show };
      await wait();
      assert.equal(visible(), false, `显式 ${String(show)} 应隐藏`);
    }
    props.value = { show: true };
    await wait();
    assert.equal(visible(), true);
    props.value = {};
    await wait();
    assert.equal(visible(), true, '撤掉绑定后回到缺省可见');
  } finally { app.unmount(); }
});
