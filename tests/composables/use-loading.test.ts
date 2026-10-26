/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, it } from 'node:test';
import { installDom, loadAppModule, wait } from './harness';

const dom = installDom();
const { createApp, defineComponent, h } = await import('vue');
const { showLoading } = await loadAppModule<typeof import('../../app/composables/useLoading')>('app/composables/useLoading.ts');
const { LOADING_MASK_DURATION } = await import('../../app/components/reborn/ui/reborn-loading/reborn-loading-mask.config');

after(() => dom.window.close());

/** 关闭后等待淡出与兜底销毁都结束 */
const settle = () => wait(LOADING_MASK_DURATION + 200);
const bodyText = () => document.body.textContent ?? '';

it('关闭后淡出期间再次打开全屏遮罩，得到可用的新实例', async () => {
  const first = showLoading({ text: '第一次加载' });
  await wait();
  assert.ok(bodyText().includes('第一次加载'));

  first.close();
  const second = showLoading({ text: '第二次加载' });
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
  const first = showLoading({ text: '进行中' });
  const second = showLoading({ text: '被忽略' });
  assert.equal(second, first);
  await wait();
  assert.ok(bodyText().includes('进行中'));
  assert.ok(!bodyText().includes('被忽略'));
  second.close();
  await settle();
  assert.ok(!bodyText().includes('进行中'));
});

it('在组件 setup 里创建的全屏遮罩不随组件卸载释放滚动锁，关闭后才释放', async () => {
  const lockedElement = () => (document.scrollingElement ?? document.documentElement) as HTMLElement;
  let loading!: ReturnType<typeof showLoading>;
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp(defineComponent({
    setup() {
      loading = showLoading({ text: '提交中', lock: true });
      return () => h('div');
    },
  }));
  app.mount(container);
  await wait();
  assert.equal(lockedElement().style.overflow, 'hidden');

  app.unmount();
  container.remove();
  await wait();
  assert.equal(lockedElement().style.overflow, 'hidden', '遮罩仍在，页面应保持锁定');

  loading.close();
  await settle();
  assert.notEqual(lockedElement().style.overflow, 'hidden');
});
