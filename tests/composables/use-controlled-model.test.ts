/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, it } from 'node:test';
import { installDom, loadAppModule, wait } from './harness';

const dom = installDom();
const { createApp, defineComponent, h, shallowRef } = await import('vue');
const { useBooleanModel, useControlledModel } = await loadAppModule<typeof import('../../app/composables/useControlledModel')>('app/composables/useControlledModel.ts');
const { useRawProp } = await loadAppModule<typeof import('../../app/composables/useRawProp')>('app/composables/useRawProp.ts');

after(() => dom.window.close());

/** 最小受控组件：声明 modelValue 与对应事件，读写走 useControlledModel，按钮点击写入 next */
const Counter = defineComponent({
  props: { modelValue: { type: Number, default: undefined }, initial: { type: Number, default: 1 }, next: { type: Number, default: 2 } },
  emits: ['update:modelValue'],
  setup(props) {
    const value = useControlledModel<number>('modelValue', { initial: props.initial, resolve: raw => (raw as number | null | undefined) ?? -1 });
    return () => h('button', { onClick: () => { value.value = props.next; } }, String(value.value));
  },
});

/** 布尔模型 + 原始属性探针，渲染出展示值与「是否传了 show」 */
const Toggle = defineComponent({
  props: { show: { type: Boolean, default: undefined } },
  emits: ['update:show'],
  setup() {
    const show = useBooleanModel('show', true);
    const { present } = useRawProp('show');
    return () => h('i', { 'data-show': String(show.value), 'data-bound': String(present.value), onClick: () => { show.value = !show.value; } });
  },
});

function mount(render: () => ReturnType<typeof h>) {
  const container = document.createElement('div');
  const app = createApp(defineComponent({ setup: () => render }));
  app.mount(container);
  return { container, unmount: () => app.unmount() };
}

it('非受控：读内部值，写入只改内部值并派发事件，同值不重复派发', async () => {
  const events: number[] = [];
  const { container, unmount } = mount(() => h(Counter, { 'onUpdate:modelValue': (value: number) => events.push(value) }));
  const button = container.querySelector('button')!;
  assert.equal(button.textContent, '1');
  button.click(); await wait();
  assert.equal(button.textContent, '2');
  button.click(); await wait();
  assert.deepEqual(events, [2]);
  unmount();
});

it('受控：只认父级值，父级拒收时保持父值，同值的下一次写入仍会派发', async () => {
  const events: number[] = [];
  const { container, unmount } = mount(() => h(Counter, { modelValue: 5, 'onUpdate:modelValue': (value: number) => events.push(value) }));
  const button = container.querySelector('button')!;
  button.click(); await wait();
  assert.equal(button.textContent, '5');
  button.click(); await wait();
  assert.deepEqual(events, [2, 2]);
  unmount();
});

it('显式传 undefined 也算受控，展示值交给 resolve；非受控交互后切到受控空值不回显旧值', async () => {
  const bound = shallowRef(false);
  const { container, unmount } = mount(() => h(Counter, bound.value ? { modelValue: undefined } : {}));
  const button = container.querySelector('button')!;
  button.click(); await wait();
  assert.equal(button.textContent, '2');
  bound.value = true; await wait();
  assert.equal(button.textContent, '-1');
  bound.value = false; await wait();
  assert.equal(button.textContent, '2');
  unmount();
});

it('useBooleanModel：未传按初值显示，显式空值按隐藏，useRawProp 认连字符写法', async () => {
  const props = shallowRef<Record<string, unknown>>({});
  const { container, unmount } = mount(() => h(Toggle, props.value));
  const node = () => container.querySelector('i')!;
  assert.equal(node().dataset.show, 'true');
  assert.equal(node().dataset.bound, 'false');
  node().click(); await wait();
  assert.equal(node().dataset.show, 'false');
  props.value = { show: null }; await wait();
  assert.equal(node().dataset.show, 'false');
  assert.equal(node().dataset.bound, 'true');
  props.value = { show: true }; await wait();
  assert.equal(node().dataset.show, 'true');
  unmount();
});

it('useRawProp 认连字符键（模板里写 model-value 时 vnode.props 保留连字符）', async () => {
  let seen: boolean | undefined;
  const Probe = defineComponent({
    props: { modelValue: { type: Number, default: undefined } },
    setup() {
      const { present } = useRawProp('modelValue');
      seen = present.value;
      return () => null;
    },
  });
  const { unmount } = mount(() => h(Probe, { 'model-value': 3 }));
  assert.equal(seen, true);
  unmount();
});
