/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, afterEach, it } from 'node:test';
import { installDom, loadAppModule, wait } from '../composables/harness';

const dom = installDom();
Object.defineProperty(globalThis, 'MutationObserver', { configurable: true, value: dom.window.MutationObserver });
const { createApp, createSSRApp, h, ref } = await import('vue');
const { renderToString } = await import('vue/server-renderer');
const { RebornRadio: Radio, RebornRadioGroup: Group } = await loadAppModule<typeof import('../../app/components/reborn/ui/reborn-radio')>('app/components/reborn/ui/reborn-radio/index.ts');
const cleanup: Array<() => void> = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
after(() => dom.window.close());

/** 直接挂载真实组件，绑定值由父级接收更新 */
function mount(initial: Record<string, any>, children?: () => any) {
  const props = ref(initial);
  const root = document.createElement('div');
  document.body.append(root);
  const changes: unknown[] = [];
  const app = createApp({ render: () => h(Group, {
    ...props.value,
    'onUpdate:modelValue': value => props.value.modelValue = value,
    onChange: value => changes.push(value),
  }, children) });
  app.mount(root);
  cleanup.push(() => { app.unmount(); root.remove(); });
  return { root, props, changes };
}

it('新版形态与填充方式保留旧 type/variant 组合的外观', async () => {
  for (const variant of ['radio', 'button', 'pure-button']) {
    for (const appearance of ['outlined', 'filled']) {
      const modern = mount({ variant, appearance, options: ['A', 'B'], modelValue: 'A' });
      const legacy = mount({ type: variant, variant: appearance, options: ['A', 'B'], modelValue: 'A' });
      await wait();
      assert.equal(modern.root.innerHTML, legacy.root.innerHTML, `${variant}/${appearance}`);
    }
  }
});

it('切换形态保留绑定值，重复选择与禁用项不派发事件', async () => {
  const p = mount({ variant: 'pure-button', appearance: 'filled', options: ['A', 'B', { label: 'C', value: 'C', disabled: true }], modelValue: 'A' });
  const radios = () => [...p.root.querySelectorAll<HTMLElement>('[role="radio"]')];
  radios()[1]!.click();
  await wait();
  assert.equal(p.props.value.modelValue, 'B');
  radios()[1]!.click();
  radios()[2]!.click();
  await wait();
  assert.deepEqual(p.changes, ['B']);
  p.props.value.variant = 'button';
  await wait();
  assert.equal(radios()[1]!.getAttribute('aria-checked'), 'true');
  assert.equal(p.root.querySelectorAll('[aria-hidden="true"]').length, 1);
  p.props.value.variant = 'pure-button';
  await wait();
  assert.equal(radios()[1]!.getAttribute('aria-checked'), 'true');
  assert.equal(p.root.querySelectorAll('[aria-hidden="true"]').length, 0);
});

it('组级形态优先，单项颜色和填充方式可覆盖', async () => {
  const p = mount({ variant: 'pure-button', appearance: 'filled', color: 'primary', modelValue: 'A' }, () => [
    h(Radio, { value: 'A', variant: 'radio', color: 'error' }, () => 'A'),
    h(Radio, { value: 'B', appearance: 'filled' }, () => 'B'),
  ]);
  assert.ok(p.root.querySelector('button')!.classList.contains('bg-error'));
  p.props.value.variant = 'radio';
  p.props.value.modelValue = 'B';
  await wait();
  const second = p.root.querySelectorAll('[role="radio"]')[1]!;
  assert.equal(second.getAttribute('data-appearance'), 'filled');
  assert.ok(second.querySelector('span')!.classList.contains('bg-primary'));
});

it('新版 variant 优先于旧 type，显式 appearance 优先于旧填充值', () => {
  const modern = mount({ type: 'radio', variant: 'pure-button', appearance: 'filled', options: ['A'], modelValue: 'A' });
  assert.equal(modern.root.querySelectorAll('button').length, 1);
  const legacy = mount({ type: 'button', variant: 'filled', appearance: 'outlined', options: ['A'], modelValue: 'A' });
  assert.equal(legacy.root.querySelector('[role="radio"]')!.getAttribute('data-appearance'), 'outlined');
});

it('独立 Radio 与 SSR 可使用实体按钮的实底外观', async () => {
  const app = createSSRApp({ render: () => h(Radio, { variant: 'pure-button', appearance: 'filled', color: 'success', value: 'A', modelValue: 'A' }, () => '选项') });
  const html = await renderToString(app);
  assert.match(html, /bg-success/);
  assert.match(html, /aria-checked="true"/);
  assert.match(html, /<button/);
});
