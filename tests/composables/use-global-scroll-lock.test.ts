/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, afterEach, it } from 'node:test';
import { installDom, loadAppModule, wait } from './harness';

const dom = installDom();
const { createApp, defineComponent, h, onUnmounted, watch } = await import('vue');
const { useGlobalScrollLock } = await loadAppModule<typeof import('../../app/composables/useGlobalScrollLock')>('app/composables/useGlobalScrollLock.ts');

/** 每个用例结束后卸载残留组件，断言失败也不会把锁带到下一个用例 */
const mounted = new Set<() => void>();
afterEach(() => {
  for (const unmount of mounted) unmount();
});
after(() => dom.window.close());

/** 与 RebornOverlay 相同的用法：immediate watch 在 setup 同步执行期间上锁，卸载时释放 */
const Locker = defineComponent({
  setup() {
    const { acquire, release } = useGlobalScrollLock();
    watch(() => true, value => value && acquire(), { immediate: true });
    onUnmounted(release);
    return () => h('div');
  },
});

function mountLocker() {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp(Locker);
  app.mount(container);
  const unmount = () => {
    if (!mounted.delete(unmount)) return;
    app.unmount();
    container.remove();
  };
  mounted.add(unmount);
  return unmount;
}

const lockedElement = () => (document.scrollingElement ?? document.documentElement) as HTMLElement;

it('先上锁的组件卸载后，其他持锁方仍让页面保持锁定', async () => {
  const unmountFirst = mountLocker();
  const unmountSecond = mountLocker();
  await wait();
  assert.equal(lockedElement().style.overflow, 'hidden');

  unmountFirst();
  await wait();
  assert.equal(lockedElement().style.overflow, 'hidden', '第二个组件仍持锁，页面不应解锁');

  unmountSecond();
  await wait();
  assert.notEqual(lockedElement().style.overflow, 'hidden', '计数归零后解锁');
});

it('解锁后再次上锁仍然生效', async () => {
  const unmount = mountLocker();
  await wait();
  assert.equal(lockedElement().style.overflow, 'hidden');
  unmount();
  await wait();
  assert.notEqual(lockedElement().style.overflow, 'hidden');
});
