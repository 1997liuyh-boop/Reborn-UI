/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { it } from 'node:test';
import { computed, createSSRApp, defineComponent, getCurrentInstance, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { loadAppModule } from './harness';

it('服务端调用 useOverlay 不在模块级缓存请求上下文，也不登记浮层', async () => {
  const { useOverlay } = await loadAppModule<typeof import('../../app/composables/useOverlay')>('app/composables/useOverlay.ts');
  let overlayContextReads = 0;
  for (let request = 0; request < 2; request++) {
    const app = createSSRApp(defineComponent({
      setup() {
        const instance = getCurrentInstance()!;
        const context = instance.appContext;
        let contextReads = 0;
        // Vue 的 computed 自身读取应用配置，先记录框架开销，再排除它对回归断言的干扰。
        Object.defineProperty(instance, 'appContext', { configurable: true, get: () => { contextReads++; return context; } });
        computed(() => 0);
        const frameworkReads = contextReads;
        contextReads = 0;
        const overlay = useOverlay();
        const dialog = overlay.create(defineComponent({ render: () => h('div') }));
        overlayContextReads += contextReads - frameworkReads;
        assert.equal(overlay.overlays.value.length, 0);
        void dialog.open();
        return () => h('div', String(request));
      },
    }));
    await renderToString(app);
  }
  assert.equal(overlayContextReads, 0);
});
