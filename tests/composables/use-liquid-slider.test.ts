/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, it } from 'node:test';
import { installDom, loadAppModule, wait } from './harness';

const dom = installDom();
const { createApp, defineComponent, effectScope, h, useTemplateRef } = await import('vue');
const { useLiquidSlider } = await loadAppModule<typeof import('../../app/composables/useLiquidSlider')>('app/composables/useLiquidSlider.ts');

after(() => dom.window.close());

/** 宿主：可选把滑块元素交给组合式函数，记录整组件渲染次数 */
function mountHost(passElement: boolean) {
  let renders = 0;
  let slider!: ReturnType<typeof useLiquidSlider>;
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp(defineComponent({
    setup() {
      const sliderEl = useTemplateRef<HTMLElement>('sliderEl');
      slider = useLiquidSlider(passElement ? sliderEl : undefined);
      return () => {
        renders++;
        return h('div', [h('span', { ref: 'sliderEl', style: slider.style.value })]);
      };
    },
  }));
  app.mount(container);
  const element = () => container.querySelector('span')!;
  return { slider, element, renders: () => renders, unmount: () => { app.unmount(); container.remove(); } };
}

const first = { left: 0, top: 0, width: 40, height: 20 };
const second = { left: 200, top: 0, width: 40, height: 20 };

it('传入滑块元素时，动画途中不触发宿主逐帧重渲染，落位后同步最终样式', async () => {
  const host = mountHost(true);
  host.slider.move(first, { switching: false, liquid: false, vertical: false });
  await wait();
  const before = host.renders();
  host.slider.move(second, { switching: true, liquid: true, vertical: false });
  await wait(1500);
  assert.ok(host.renders() - before <= 2, `动画期间只在落位时重渲染，实际 ${host.renders() - before} 次`);
  assert.equal(host.element().style.left, '200px');
  assert.equal(host.slider.style.value.left, '200px');
  host.unmount();
});

it('不传滑块元素时仍逐帧更新响应式样式（兼容旧用法）', async () => {
  const host = mountHost(false);
  host.slider.move(first, { switching: false, liquid: false, vertical: false });
  await wait();
  const before = host.renders();
  host.slider.move(second, { switching: true, liquid: true, vertical: false });
  await wait(1500);
  assert.ok(host.renders() - before > 2);
  assert.equal(host.element().style.left, '200px');
  host.unmount();
});

it('在 effectScope 中使用时，停止作用域会结束动画', async () => {
  const scope = effectScope();
  const slider = scope.run(() => useLiquidSlider())!;
  slider.move(first, { switching: false, liquid: false, vertical: false });
  slider.move(second, { switching: true, liquid: false, vertical: false });
  scope.stop();
  const left = slider.style.value.left;
  await wait(600);
  assert.equal(slider.style.value.left, left, '作用域停止后不再推进');
});
