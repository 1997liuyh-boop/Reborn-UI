/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, it } from 'node:test';
import { installDom, loadAppModule, wait } from './harness';

const dom = installDom();
const { useLoading } = await loadAppModule<typeof import('../../app/composables/useLoading')>('app/composables/useLoading.ts');
const { LOADING_MASK_DURATION } = await import('../../app/components/reborn/ui/reborn-loading/reborn-loading-mask.config');

after(() => dom.window.close());

/** 关闭后等待淡出与兜底销毁都结束 */
const settle = () => wait(LOADING_MASK_DURATION + 200);
const bodyText = () => document.body.textContent ?? '';

it('关闭后淡出期间再次打开全屏遮罩，得到可用的新实例', async () => {
  const first = useLoading({ text: '第一次加载' });
  await wait();
  assert.ok(bodyText().includes('第一次加载'));

  first.close();
  const second = useLoading({ text: '第二次加载' });
  await settle();
  assert.ok(bodyText().includes('第二次加载'), '新遮罩应在旧遮罩淡出后继续显示');
  assert.ok(!bodyText().includes('第一次加载'), '旧遮罩淡出后应卸载');

  // 旧实例的 close 不能波及新实例
  first.close();
  await settle();
  assert.ok(bodyText().includes('第二次加载'));

  second.close();
  await settle();
  assert.ok(!bodyText().includes('第二次加载'));
});

it('未关闭时重复调用复用同一个全屏实例，新选项不生效', async () => {
  const first = useLoading({ text: '进行中' });
  const second = useLoading({ text: '被忽略' });
  assert.equal(second, first);
  await wait();
  assert.ok(bodyText().includes('进行中'));
  assert.ok(!bodyText().includes('被忽略'));
  second.close();
  await settle();
  assert.ok(!bodyText().includes('进行中'));
});
