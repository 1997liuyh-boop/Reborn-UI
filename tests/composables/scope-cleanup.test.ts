/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, it } from 'node:test';
import { installDom, loadAppModule, wait } from './harness';

const dom = installDom();
const { computed, effectScope, getCurrentScope, onScopeDispose, ref, watch } = await import('vue');
after(() => dom.window.close());

it('独立作用域停止会结束列表动画，完成回调只执行一次', async () => {
  const { useMotionList } = await loadAppModule<typeof import('../../app/composables/useMotionList')>('app/composables/useMotionList.ts');
  const scope = effectScope();
  const motion = scope.run(() => useMotionList({ duration: 10 }))!;
  const element = document.createElement('div');
  element.style.opacity = '0.5';
  let completed = 0;
  motion.enter(element, () => { completed++; });
  assert.equal(completed, 0);
  scope.stop();
  assert.equal(completed, 1);
  assert.equal(element.style.opacity, '0.5');
  motion.cancel(element);
  await wait(30);
  assert.equal(completed, 1);
});

it('独立作用域注册的移动端演示会自动注销，手动清理保持幂等', async () => {
  const state = new Map<string, ReturnType<typeof ref>>();
  const globals = {
    computed, getCurrentScope, onScopeDispose,
    useState: (key: string, initialize: () => unknown) => {
      if (!state.has(key)) state.set(key, ref(initialize()));
      return state.get(key);
    },
    useRuntimeConfig: () => ({ app: { baseURL: '/docs/' } }),
    useDocsPlatform: () => ({ isUniapp: ref(true) }),
  };
  const descriptors = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, value });
  try {
    const { useUniDemoPanel } = await loadAppModule<typeof import('../../app/composables/useUniDemoPanel')>('app/composables/useUniDemoPanel.ts');
    const scope = effectScope();
    const panel = useUniDemoPanel();
    const cleanup = scope.run(() => panel.register({ url: '/uni/#pages/demo' }))!;
    assert.equal(panel.activeUrl.value, '/docs/uni/#/pages/demo');
    assert.equal(panel.isPanelVisible.value, true);
    scope.stop();
    assert.equal(panel.entries.value.length, 0);
    assert.equal(panel.activeId.value, null);
    assert.equal(panel.isPanelVisible.value, false);
    cleanup();
    assert.equal(panel.entries.value.length, 0);
  } finally {
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});

it('独立作用域停止会取消 iframe 主题的延迟补发', async () => {
  const colorMode = ref('dark');
  const globals = { watch, useColorMode: () => colorMode };
  const descriptors = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, value });
  try {
    const { useDemoFrameTheme } = await loadAppModule<typeof import('../../app/composables/useDemoFrameTheme')>('app/composables/useDemoFrameTheme.ts');
    const sent: unknown[] = [];
    const frame = ref({ contentWindow: { postMessage: (message: unknown) => sent.push(message) } });
    const scope = effectScope();
    const { onFrameLoad } = scope.run(() => useDemoFrameTheme(frame as unknown as Parameters<typeof useDemoFrameTheme>[0]))!;
    onFrameLoad();
    assert.equal(sent.length, 1);
    scope.stop();
    await wait(650);
    // 作用域停止后：600ms 的补发被取消，主题切换也不再推送
    colorMode.value = 'light';
    await wait();
    assert.equal(sent.length, 1);
  }
  finally {
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
