/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, it } from 'node:test';
import { installDom, loadAppModule, wait } from './harness';

const dom = installDom();
const { createApp, defineComponent, h, inject } = await import('vue');

// 剪贴板与 Nuxt 自动导入的依赖都用桩替代，只验证调用次数、上下文与结果
const writes: string[] = [];
/** 置为 true 时模拟写入被拒绝（未聚焦、权限被拒） */
let rejectWrite = false;
const clipboard = {
  writeText: async (text: string) => {
    if (rejectWrite) throw new Error('NotAllowedError');
    writes.push(text);
  },
};
Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
const toasts: Array<{ color?: string }> = [];
const toastProbe = Symbol('toast-probe');
let nuxtAppCalls = 0;
const nuxtVueApp = createApp({});
Object.assign(globalThis, {
  // 与 Nuxt UI 的 useToast 一样在内部调用 inject，缺少上下文时 Vue 会告警
  useToast: () => {
    inject(toastProbe, null);
    return { add: (toast: { color?: string }) => toasts.push(toast) };
  },
  useNuxtApp: () => {
    nuxtAppCalls++;
    return { vueApp: nuxtVueApp };
  },
});

const { copyToClipboard } = await loadAppModule<typeof import('../../app/utils/copyToClipboard')>('app/utils/copyToClipboard.ts');

const warnings: string[] = [];
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => warnings.push(args.join(' '));
after(() => {
  console.warn = originalWarn;
  dom.window.close();
});

it('在点击回调中连续调用，每次都写入剪贴板并提示', async () => {
  writes.length = 0;
  toasts.length = 0;
  warnings.length = 0;
  const results = await Promise.all([copyToClipboard('第一次'), copyToClipboard('第二次'), copyToClipboard('第三次')]);
  assert.deepEqual(results, [true, true, true]);
  assert.deepEqual(writes, ['第一次', '第二次', '第三次']);
  assert.equal(toasts.length, 3);
  assert.deepEqual(warnings.filter(text => text.includes('inject()')), [], 'setup 之外调用不应触发 inject 告警');
});

it('在组件 setup 中调用时直接使用组件上下文', async () => {
  writes.length = 0;
  const callsBefore = nuxtAppCalls;
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp(defineComponent({
    setup() {
      void copyToClipboard('setup 内');
      return () => h('span');
    },
  }));
  app.mount(container);
  await wait();
  assert.deepEqual(writes, ['setup 内']);
  assert.equal(nuxtAppCalls, callsBefore, '有注入上下文时不借用 Nuxt 应用上下文');
  app.unmount();
  container.remove();
});

it('写入被拒绝时解析为 false 并提示失败，不产生未捕获的拒绝', async () => {
  toasts.length = 0;
  rejectWrite = true;
  try {
    assert.equal(await copyToClipboard('被拒绝'), false);
  }
  finally {
    rejectWrite = false;
  }
  assert.deepEqual(toasts.map(toast => toast.color), ['error']);
});

it('非安全上下文没有 navigator.clipboard 时解析为 false 并提示失败', async () => {
  toasts.length = 0;
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
  try {
    assert.equal(await copyToClipboard('无剪贴板'), false);
  }
  finally {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
  }
  assert.deepEqual(toasts.map(toast => toast.color), ['error']);
});
