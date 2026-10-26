/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, it } from 'node:test';
import { installDom, loadAppModule, wait } from './harness';

const dom = installDom();
const { computed, createApp, defineComponent, h, isReadonly, provide, shallowRef } = await import('vue');
const { FORM_ITEM_KEY, FORM_KEY, useFieldGroup, useFormInject } = await loadAppModule<typeof import('../../app/composables/useFieldGroup')>('app/composables/useFieldGroup.ts');

after(() => dom.window.close());

/** 最小控件：size 默认 md，渲染出 useFormInject 算得的尺寸 */
const Control = defineComponent({
  props: { size: { type: String, default: 'md' } },
  setup(props) {
    const { size, isError } = useFormInject(props);
    return () => h('i', { 'data-size': size.value, 'data-error': String(isError.value) });
  },
});

/** 渲染一棵树，返回控件的尺寸读数 */
async function renderSize(render: () => ReturnType<typeof h>) {
  const container = document.createElement('div');
  const app = createApp(defineComponent({ setup: () => render }));
  app.mount(container);
  await wait();
  const read = () => container.querySelector('i')!.getAttribute('data-size');
  return { read, readError: () => container.querySelector('i')!.getAttribute('data-error'), unmount: () => app.unmount() };
}

/** 以给定键提供表单上下文的父组件 */
function Provider(key: symbol | string, value: unknown) {
  return defineComponent({
    setup(_, { slots }) {
      provide(key as any, value);
      return () => slots.default?.();
    },
  });
}

const formItemContext = { isError: computed(() => false), validate: () => {}, size: computed(() => 'sm') };

it('表单项不在表单内时，控件保持自身默认尺寸，不被表单项的 sm 兜底缩小', async () => {
  const Item = Provider(FORM_ITEM_KEY, formItemContext);
  const { read, unmount } = await renderSize(() => h(Item, null, () => h(Control)));
  assert.equal(read(), 'md');
  unmount();
});

it('表单 size 为空字符串时，表单项内外的控件尺寸一致', async () => {
  const Form = Provider(FORM_KEY, { props: { size: '' } });
  const Item = Provider(FORM_ITEM_KEY, formItemContext);
  const { read, unmount } = await renderSize(() => h(Form, null, () => h(Item, null, () => h(Control))));
  assert.equal(read(), 'md');
  unmount();
});

it('表单 size 下发给控件，控件显式写了 size 时以控件为准；增删 size 属性后跟着切换', async () => {
  const Form = Provider(FORM_KEY, { props: { size: 'lg' } });
  const explicit = shallowRef<string | undefined>('md');
  const { read, unmount } = await renderSize(() => h(Form, null, () => h(Control, explicit.value ? { size: explicit.value } : {})));
  assert.equal(read(), 'md', '显式传入与默认值相同也以显式为准');
  explicit.value = undefined;
  await wait();
  assert.equal(read(), 'lg', '去掉 size 属性后改为跟随表单');
  explicit.value = 'sm';
  await wait();
  assert.equal(read(), 'sm');
  unmount();
});

it('旧字符串表单与表单项键不再被消费', async () => {
  const LegacyForm = Provider('rebornForm', { props: { size: 'lg' } });
  const LegacyItem = Provider('rebornFormItem', { ...formItemContext, isError: computed(() => true) });
  const { read, readError, unmount } = await renderSize(() => h(LegacyForm, null, () => h(LegacyItem, null, () => h(Control))));
  assert.equal(read(), 'md');
  assert.equal(readError(), 'false');
  unmount();
});

it('Symbol 显式 null 阻断外层 Symbol 上下文，避免复合控件内部被表单接管', async () => {
  const Form = Provider(FORM_KEY, { props: { size: 'lg' } });
  const Item = Provider(FORM_ITEM_KEY, { ...formItemContext, isError: computed(() => true) });
  const Barrier = defineComponent({ setup(_, { slots }) { provide(FORM_KEY, null as any); provide(FORM_ITEM_KEY, null as any); return () => slots.default?.(); } });
  const { read, readError, unmount } = await renderSize(() => h(Form, null, () => h(Item, null, () => h(Barrier, null, () => h(Control)))));
  assert.equal(read(), 'md');
  assert.equal(readError(), 'false');
  unmount();
});

it('useFieldGroup 只返回只读状态，getErrors 同步返回，注销保留被接管的字段', () => {
  const group = useFieldGroup();
  assert.ok(isReadonly(group.errors) && isReadonly(group.fields) && isReadonly(group.fieldInstances));

  group.addField({ uid: 1, prop: 'name' });
  group.addField({ uid: 2, prop: 'name' });
  group.addField({ uid: 3, prop: 'age' });
  group.removeField({ uid: 1, prop: 'name' });
  assert.deepEqual([...group.fields.value], ['name', 'age'], '同一路径还有条目在用时保留字段名');
  group.removeField({ uid: 2, prop: 'name' });
  assert.deepEqual([...group.fields.value], ['age']);
  assert.deepEqual(group.fieldInstances.value.map(item => item.uid), [3]);

  group.setError('age', '必填');
  assert.deepEqual(group.getErrors(), [{ field: 'age', message: '必填' }]);
  group.clearValidate('age');
  assert.deepEqual(group.getErrors(), []);
});
