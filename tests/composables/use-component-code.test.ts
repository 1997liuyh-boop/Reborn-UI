/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, it } from 'node:test';
import { installDom, loadAppModule, wait } from './harness';

const dom = installDom();
const vue = await import('vue');
const { createApp, defineComponent, h, shallowRef } = vue;

/** 每个文件名对应的加载延迟（ms），用来制造「先发出的请求后返回」 */
const delays: Record<string, number> = {};
const loads: string[] = [];

// Nuxt 自动导入的标识符在测试里按全局变量提供：vue 的响应式 API、源码读取函数与 Nuxt 应用
Object.assign(globalThis, {
  computed: vue.computed,
  onMounted: vue.onMounted,
  readonly: vue.readonly,
  shallowRef: vue.shallowRef,
  toValue: vue.toValue,
  watch: vue.watch,
  useNuxtApp: () => ({ $prettier: null }),
  getComponentCode: ({ fileName, id }: { fileName: string; id?: string }) => async () => {
    loads.push(id ? `${id}/${fileName}` : fileName);
    await new Promise(resolve => setTimeout(resolve, delays[fileName] ?? 0));
    return `// ${fileName}`;
  },
});

const { useComponentCode } = await loadAppModule<typeof import('../../app/composables/useComponentCode')>('app/composables/useComponentCode.ts');

after(() => dom.window.close());

/** 在组件里调用（加载挂在 onMounted 上），返回组合式函数的结果 */
function mountWith<T>(setup: () => T) {
  let result!: T;
  const container = document.createElement('div');
  const app = createApp(defineComponent({
    setup() {
      result = setup();
      return () => h('div');
    },
  }));
  app.mount(container);
  return { result, unmount: () => app.unmount() };
}

it('快速连续切换文件时只保留最后一次请求的结果', async () => {
  delays['slow.css'] = 60;
  delays['fast.vue'] = 0;
  const { result, unmount } = mountWith(() => useComponentCode({ format: 'none' }));
  await wait();

  const slow = result.loadFilesByPath(['slow.css']);
  const fast = result.loadFilesByPath(['fast.vue']);
  await Promise.all([slow, fast]);

  assert.match(result.mdcCode.value, /fast\.vue/);
  assert.doesNotMatch(result.mdcCode.value, /slow\.css/, '先发出、后返回的请求不能覆盖新结果');
  unmount();
});

it('isLoading 在所有并发任务结束后才回到 false', async () => {
  delays['a.vue'] = 10;
  delays['b.vue'] = 50;
  const { result, unmount } = mountWith(() => useComponentCode({ format: 'none' }));
  await wait();

  const first = result.loadFilesByPath(['a.vue']);
  const second = result.loadFilesByPath(['b.vue']);
  assert.equal(result.isLoading.value, true);
  await first;
  assert.equal(result.isLoading.value, true, '较快的任务结束时另一个仍在加载');
  await second;
  assert.equal(result.isLoading.value, false);
  unmount();
});

it('入参传 getter 时，值变化会重新加载', async () => {
  const componentId = shallowRef('reborn-button');
  loads.length = 0;
  const { result, unmount } = mountWith(() => useComponentCode(() => ({
    componentId: componentId.value,
    componentFiles: ['Index.vue'],
  })));
  await wait(10);
  assert.ok(loads.includes('reborn-button/Index.vue'));
  assert.match(result.componentCode.value, /Index\.vue/);

  componentId.value = 'reborn-input';
  await wait(10);
  assert.ok(loads.includes('reborn-input/Index.vue'), '换组件后重新加载');
  unmount();
});
