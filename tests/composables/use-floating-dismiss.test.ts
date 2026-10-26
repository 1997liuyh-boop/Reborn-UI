/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, it } from 'node:test';
import { installDom, loadAppModule } from './harness';

const dom = installDom();
const { createApp, defineComponent, h, nextTick, shallowRef } = await import('vue');
const { useFloatingDismiss } = await loadAppModule<typeof import('../../app/composables/useFloatingDismiss')>('app/composables/useFloatingDismiss.ts');
after(() => dom.window.close());

it('点击时机、滚动意图与关闭后的监听清理保持独立', async () => {
  const open = shallowRef(true);
  const closeOn = shallowRef<'mousedown' | 'click'>('click');
  const reasons: string[] = [];
  const element = document.createElement('div');
  document.body.append(element);
  const app = createApp(defineComponent({
    setup() {
      useFloatingDismiss({ open: () => open.value, elements: () => [element], anchor: () => element,
        closeOn, closeOnClickOutside: true, closeOnScroll: true, closeOnScrollIntent: true,
        onDismiss: reason => reasons.push(reason) });
      return () => h('div');
    },
  }));
  app.mount(element);
  const fire = (target: Element, type: string) => target.dispatchEvent(new dom.window.Event(type, { bubbles: true }));
  fire(document.body, 'pointerdown');
  assert.deepEqual(reasons, []);
  fire(document.body, 'click');
  fire(element, 'wheel');
  fire(document.body, 'wheel');
  fire(document.body, 'touchstart');
  assert.deepEqual(reasons, ['click-outside', 'scroll', 'scroll']);
  closeOn.value = 'mousedown';
  await nextTick();
  fire(document.body, 'click');
  fire(document.body, 'pointerdown');
  assert.equal(reasons.length, 4);
  open.value = false;
  await nextTick();
  fire(document.body, 'wheel');
  fire(document.body, 'pointerdown');
  assert.equal(reasons.length, 4);
  app.unmount();
  element.remove();
});
