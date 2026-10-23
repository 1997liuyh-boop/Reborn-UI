/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, it } from 'node:test';
import { installDom, loadAppModule, wait } from './harness';

const dom = installDom();
const { defineComponent, h } = await import('vue');
const { useOverlay } = await loadAppModule<typeof import('../../app/composables/useOverlay')>('app/composables/useOverlay.ts');

after(() => dom.window.close());

/** 记录每次渲染收到的 confirmBtn；数组形式声明 props，避免 Boolean 类型把未传值强转为 false */
let lastConfirmBtn: unknown = 'not-rendered';
const DialogStub = defineComponent({
  props: ['confirmBtn', 'modelValue'],
  emits: ['confirm', 'update:modelValue'],
  setup(props, { emit }) {
    return () => {
      lastConfirmBtn = props.confirmBtn;
      return h('button', { 'data-confirm': '', 'onClick': () => emit('confirm') });
    };
  },
});

/** 打开浮层、点击确认，返回确认回调的放行函数与 open() 的结果 */
async function confirmWith(props: Record<string, unknown>) {
  let finish!: () => void;
  const dialog = useOverlay().create(DialogStub, {
    props,
    onConfirm: () => new Promise<void>((resolve) => { finish = resolve; }),
  });
  const result = dialog.open();
  await wait();
  document.querySelector<HTMLButtonElement>('[data-confirm]')!.click();
  await wait();
  return { finish, result };
}

/** 断言确认期间收到的 confirmBtn；无论断言成败都放行回调，让浮层关闭，不影响后续用例 */
async function expectConfirmBtn(props: Record<string, unknown>, expected: unknown) {
  const { finish, result } = await confirmWith(props);
  try {
    assert.deepEqual(lastConfirmBtn, expected);
  }
  finally {
    finish();
    assert.equal(await result, 'confirm');
  }
}

it('未传 confirmBtn 时确认期间也注入 loading', async () => {
  await expectConfirmBtn({}, { loading: true });
});

it('字符串与对象形式的 confirmBtn 保留原配置并补上 loading', async () => {
  await expectConfirmBtn({ confirmBtn: '提交' }, { label: '提交', loading: true });
  await expectConfirmBtn({ confirmBtn: { label: '删除', color: 'error' } }, { label: '删除', color: 'error', loading: true });
});

it('confirmBtn 为 false 时原样透传，按钮保持隐藏', async () => {
  await expectConfirmBtn({ confirmBtn: false }, false);
});
