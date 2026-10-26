/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { it } from 'node:test';
import { isReadonly } from 'vue';
import { installDom, loadAppModule } from './harness';

it('外部主题设置与切换共用只读状态，并同步存储和 H5 根节点', async () => {
  const dom = installDom();
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'uni');
  let saved = true;
  Object.defineProperty(globalThis, 'uni', { configurable: true, value: {
    getStorageSync: () => saved,
    setStorageSync: (_key: string, value: boolean) => { saved = value; },
  } });
  try {
    const { useDarkMode } = await loadAppModule<typeof import('../../packages/uniapp-project/src/composables/useDarkMode')>('packages/uniapp-project/src/composables/useDarkMode.ts');
    const first = useDarkMode();
    const second = useDarkMode();
    assert.ok(isReadonly(first.isDark));
    assert.equal(first.isDark.value, true);
    assert.ok(document.documentElement.classList.contains('dark'));
    second.setDarkMode(false);
    assert.equal(first.isDark.value, false);
    assert.equal(saved, false);
    assert.ok(!document.documentElement.classList.contains('dark'));
    first.toggleDarkMode();
    assert.equal(second.isDark.value, true);
    assert.equal(saved, true);
    assert.ok(document.documentElement.classList.contains('dark'));
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'uni', descriptor);
    else Reflect.deleteProperty(globalThis, 'uni');
    dom.window.close();
  }
});

it('存储里没有主题记录时按宿主主题取初值，不写存储、不改 <html> 的类名', async () => {
  const dom = installDom();
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'uni');
  const writes: unknown[] = [];
  Object.defineProperty(globalThis, 'uni', { configurable: true, value: {
    getStorageSync: () => '',
    setStorageSync: (_key: string, value: unknown) => { writes.push(value); },
    // 测试打包不做条件编译，APP 分支也会执行，一并提供系统主题
    getAppBaseInfo: () => ({ hostTheme: 'dark', appTheme: 'auto' }),
    getSystemInfoSync: () => ({ osTheme: 'light' }),
  } });
  document.documentElement.classList.add('dark');
  try {
    const { useDarkMode } = await loadAppModule<typeof import('../../packages/uniapp-project/src/composables/useDarkMode')>('packages/uniapp-project/src/composables/useDarkMode.ts');
    const { isDark } = useDarkMode();
    assert.equal(isDark.value, true);
    assert.deepEqual(writes, []);
    // 使用方自己加上的 dark 类原样保留
    assert.ok(document.documentElement.classList.contains('dark'));
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'uni', descriptor);
    else Reflect.deleteProperty(globalThis, 'uni');
    dom.window.close();
  }
});
