/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, it } from 'node:test';
import { installDom, loadAppModule, wait } from './harness';

const dom = installDom();
const { computed, createApp, defineComponent, effectScope, h, inject, nextTick, useId, watch } = await import('vue');
const { RebornOverlayHost, useOverlay } = await loadAppModule<typeof import('../../app/composables/useOverlay')>('app/composables/useOverlay.ts');

after(() => dom.window.close());

/**
 * 模拟 RebornDialog 的最小契约：modelValue 为 true 时渲染，转为 false 后下一拍发出 closed（代表离场过渡结束）。
 * 数组形式声明 props，避免 Boolean 类型把未传值强转为 false
 */
let lastConfirmBtn: unknown = 'not-rendered';
let stubSetups = 0;
const DialogStub = defineComponent({
  props: ['confirmBtn', 'modelValue', 'title'],
  emits: ['confirm', 'closed', 'update:modelValue'],
  setup(props, { emit }) {
    stubSetups++;
    watch(() => props.modelValue, (value) => {
      if (!value) void nextTick(() => emit('closed'));
    });
    return () => {
      lastConfirmBtn = props.confirmBtn;
      if (!props.modelValue) return null;
      return h('button', { 'data-confirm': '', 'onClick': () => emit('confirm') }, props.title);
    };
  },
});

/** 不发 closed 的组件：二次封装组件常见，离场靠兜底定时器收尾 */
const SilentStub = defineComponent({
  props: ['modelValue'],
  setup(props) {
    return () => (props.modelValue ? h('div', { 'data-silent': '' }) : h('div', { 'data-silent-leaving': '' }));
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
    await wait();
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

it('在作用域内创建的浮层随作用域销毁：Promise 以 undefined 解析、节点与登记一并移除', async () => {
  const overlay = useOverlay();
  const scope = effectScope();
  const dialog = scope.run(() => overlay.create(DialogStub, { props: { title: '作用域内' } }))!;
  const result = dialog.open();
  await wait();
  assert.ok(overlay.overlays.value.some(item => item.id === dialog.id));
  assert.match(document.body.textContent ?? '', /作用域内/);

  scope.stop();
  assert.equal(await result, undefined);
  await wait();
  assert.doesNotMatch(document.body.textContent ?? '', /作用域内/);
  assert.ok(!overlay.overlays.value.some(item => item.id === dialog.id));
  await assert.rejects(dialog.open(), /not found/);
});

it('persistent 实例不随作用域销毁', async () => {
  const overlay = useOverlay();
  const scope = effectScope();
  const dialog = scope.run(() => overlay.create(DialogStub, { persistent: true }))!;
  scope.stop();
  assert.ok(overlay.overlays.value.some(item => item.id === dialog.id));
  overlay.unmount(dialog.id);
  assert.ok(!overlay.overlays.value.some(item => item.id === dialog.id));
});

it('打开状态下 patch 只更新 props，不重建组件', async () => {
  const overlay = useOverlay();
  const dialog = overlay.create(DialogStub, { props: { title: '旧标题' } });
  const setupsBefore = stubSetups;
  const result = dialog.open();
  await wait();
  dialog.patch({ title: '新标题' });
  await wait();
  assert.match(document.body.textContent ?? '', /新标题/);
  assert.equal(stubSetups - setupsBefore, 1, '只创建过一次组件实例');
  dialog.close('done');
  assert.equal(await result, 'done');
  overlay.unmount(dialog.id);
});

it('已打开时再次 open：上一次的 Promise 以 undefined 解析，新 props 生效', async () => {
  const overlay = useOverlay();
  const dialog = overlay.create(DialogStub, { props: { title: '第一次' } });
  const first = dialog.open();
  await wait();
  const second = dialog.open({ title: '第二次' });
  assert.equal(await first, undefined);
  await wait();
  assert.match(document.body.textContent ?? '', /第二次/);
  dialog.close('second');
  assert.equal(await second, 'second');
  overlay.unmount(dialog.id);
});

for (const reopen of ['close-open', 'open'] as const) {
  for (const outcome of ['resolve', 'reject'] as const) {
    it(`旧确认${outcome}不影响新一轮浮层与确认：${reopen}`, async () => {
      const overlay = useOverlay();
      const pending: { resolve: () => void; reject: (error: Error) => void }[] = [];
      const dialog = overlay.create(DialogStub, {
        onConfirm: () => new Promise<void>((resolve, reject) => { pending.push({ resolve, reject }); }),
      });
      try {
        const first = dialog.open();
        await wait();
        document.querySelector<HTMLButtonElement>('[data-confirm]')!.click();
        await wait();
        assert.equal(pending.length, 1);
        if (reopen === 'close-open') dialog.close();
        const second = dialog.open();
        let secondSettled = false;
        void second.then(() => { secondSettled = true; });
        assert.equal(await first, undefined);
        await wait();
        assert.deepEqual(lastConfirmBtn, { loading: false });
        document.querySelector<HTMLButtonElement>('[data-confirm]')!.click();
        await wait();
        assert.equal(pending.length, 2, '新一轮允许独立发起确认');
        if (outcome === 'resolve') pending[0]!.resolve();
        else pending[0]!.reject(new Error('旧确认失败'));
        await wait();
        assert.equal(overlay.isOpen(dialog.id), true);
        assert.equal(secondSettled, false);
        assert.deepEqual(lastConfirmBtn, { loading: true }, '旧完成不能清除当前确认的 loading');
        document.querySelector<HTMLButtonElement>('[data-confirm]')!.click();
        await wait();
        assert.equal(pending.length, 2, '当前确认仍阻止重复提交');
        pending[1]!.resolve();
        assert.equal(await second, 'confirm');
        await wait();
        assert.equal(overlay.isOpen(dialog.id), false);
      }
      finally {
        overlay.unmount(dialog.id);
        pending.forEach(item => item.resolve());
        await wait();
      }
    });
  }
}

it('卸载后旧确认完成不会影响其它浮层', async () => {
  const overlay = useOverlay();
  let finish!: () => void;
  const stale = overlay.create(DialogStub, { onConfirm: () => new Promise<void>((resolve) => { finish = resolve; }) });
  const result = stale.open();
  await wait();
  document.querySelector<HTMLButtonElement>('[data-confirm]')!.click();
  await wait();
  overlay.unmount(stale.id);
  assert.equal(await result, undefined);
  const fresh = overlay.create(DialogStub);
  void fresh.open();
  await wait();
  finish();
  await wait();
  assert.equal(overlay.isOpen(fresh.id), true);
  assert.ok(!overlay.overlays.value.some(item => item.id === stale.id));
  overlay.unmount(fresh.id);
});

it('关闭即解析 Promise，组件保留到离场结束：发出 closed 时移出，未发出时由兜底定时器移出', async () => {
  const overlay = useOverlay();
  const dialog = overlay.create(DialogStub, { props: { title: '离场' } });
  const result = dialog.open();
  await wait();
  dialog.close('bye');
  assert.equal(await result, 'bye');
  assert.equal(overlay.isOpen(dialog.id), false);
  await wait();
  assert.doesNotMatch(document.body.textContent ?? '', /离场/);

  const silent = overlay.create(SilentStub, { props: { closeDelay: 0 } });
  void silent.open();
  await wait();
  silent.close();
  await wait();
  assert.ok(document.querySelector('[data-silent-leaving]'), '离场期间仍在渲染，组件有机会播放离场过渡');
  await wait(1050);
  assert.equal(document.querySelector('[data-silent-leaving]'), null);
  overlay.unmount(dialog.id);
  overlay.unmount(silent.id);
});

it('destroyOnClose 关闭后不能再打开', async () => {
  const overlay = useOverlay();
  const dialog = overlay.create(DialogStub, { destroyOnClose: true });
  void dialog.open();
  await wait();
  dialog.close();
  await assert.rejects(dialog.open(), /not found/);
  await wait();
  assert.ok(!overlay.overlays.value.some(item => item.id === dialog.id));
});

it('isOpen 与 overlays 是响应式的', async () => {
  const overlay = useOverlay();
  const dialog = overlay.create(DialogStub);
  const opened = computed(() => overlay.isOpen(dialog.id));
  const listed = computed(() => overlay.overlays.value.find(item => item.id === dialog.id)?.isOpen);
  assert.equal(opened.value, false);
  assert.equal(listed.value, false);
  void dialog.open();
  assert.equal(opened.value, true);
  assert.equal(listed.value, true);
  dialog.close();
  assert.equal(opened.value, false);
  overlay.unmount(dialog.id);
  assert.equal(listed.value, undefined);
});

it('放置 RebornOverlayHost 后浮层在主应用里渲染：继承 provide，两个浮层的 useId 不重复', async () => {
  const ids: string[] = [];
  const IdStub = defineComponent({
    props: ['modelValue'],
    setup(props) {
      const id = useId();
      const injected = inject<string>('app-level', 'missing');
      ids.push(id!);
      return () => (props.modelValue ? h('span', { 'data-id-stub': id }, injected) : null);
    },
  });

  let overlay!: ReturnType<typeof useOverlay>;
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp(defineComponent({
    setup() {
      overlay = useOverlay();
      // 主应用自己也生成 id，验证浮层不会与之撞号
      const mainId = useId();
      ids.push(mainId!);
      return () => h('main', [h('p', mainId), h(RebornOverlayHost)]);
    },
  }));
  app.provide('app-level', '来自主应用');
  app.mount(container);
  await wait();

  const first = overlay.create(IdStub);
  const second = overlay.create(IdStub);
  void first.open();
  void second.open();
  await wait();

  const rendered = [...document.querySelectorAll<HTMLElement>('[data-id-stub]')];
  assert.equal(rendered.length, 2);
  assert.ok(rendered.every(node => node.textContent === '来自主应用'), '浮层拿到主应用的 provide');
  assert.equal(ids.length, 3);
  assert.equal(new Set(ids).size, ids.length, 'useId 不重复');

  overlay.unmount(first.id);
  overlay.unmount(second.id);
  app.unmount();
  container.remove();
});
