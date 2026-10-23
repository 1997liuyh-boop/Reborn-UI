/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, it } from 'node:test';
import { installDom, loadAppModule, wait } from './harness';

const dom = installDom();
const { createApp, defineComponent, h, inject } = await import('vue');

// 剪贴板与 Nuxt 自动导入的依赖都用桩替代，只验证调用次数与上下文
const writes: string[] = [];
Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { writes.push(text); } } });
const toasts: unknown[] = [];
const toastProbe = Symbol('toast-probe');
let nuxtAppCalls = 0;
const nuxtVueApp = createApp({});
Object.assign(globalThis, {
  // 与 Nuxt UI 的 useToast 一样在内部调用 inject，缺少上下文时 Vue 会告警
  useToast: () => {
    inject(toastProbe, null);
    return { add: (toast: unknown) => toasts.push(toast) };
  },
  useNuxtApp: () => {
    nuxtAppCalls++;
    return { vueApp: nuxtVueApp };
  },
});

const { useCopyToClipboard } = await loadAppModule<typeof import('../../app/composables/useCopyToClipboard')>('app/composables/useCopyToClipboard.ts');

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
  useCopyToClipboard('第一次');
  useCopyToClipboard('第二次');
  useCopyToClipboard('第三次');
  await wait();
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
      useCopyToClipboard('setup 内');
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
