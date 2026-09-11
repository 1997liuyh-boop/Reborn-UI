/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { it } from 'node:test';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, defineComponent, h } from 'vue';
import { fingerprintThemeSlots, tv } from '../../app/lib/tv';

const slots = { root: 'flex text-red-500', label: 'font-bold' };
const themeId = fingerprintThemeSlots(slots);
const shared = tv({ slots, variants: { active: { true: { root: 'text-blue-500' } } } });

it('模块级共享主题按实际组件名称、键和指纹标记，SSR 结果稳定', async () => {
  const component = (name: string) => defineComponent({ name, setup: () => () => h('div', { class: shared({ active: true }).root() }) });
  const first = component('RebornButton');
  const second = component('RebornProgress');
  const render = () => renderToString(createSSRApp({ render: () => h('main', [h(first), h(second)]) }));
  const html = await render();
  assert.match(html, new RegExp(`RebornButton-root-${themeId}`));
  assert.match(html, new RegExp(`RebornProgress-root-${themeId}`));
  assert.doesNotMatch(html, /rb-tv-/);
  assert.equal(html, await render());
});

it('setup 内创建的主题离开组件上下文后仍保留组件名', async () => {
  let root: (() => string) | undefined;
  await renderToString(createSSRApp(defineComponent({ name: 'RebornInput', setup() {
    root = tv({ slots })().root;
    return () => h('input', { class: root!() });
  } })));
  assert.match(root!(), new RegExp(`RebornInput-root-${themeId}`));
});

it('无 slots 的主题保持字符串，变体与样式覆盖保持生效', () => {
  const plain = tv({ base: 'flex', variants: { active: { true: 'font-bold' } } });
  assert.equal(plain({ active: true }), 'flex font-bold');
  const classes = shared({ active: true }).root({ class: 'text-green-500' });
  assert.match(classes, /text-green-500/);
  assert.doesNotMatch(classes, /text-red-500|text-blue-500/);
  assert.match(classes, new RegExp(`Component-root-${themeId}`));
});

it('面板选择器匹配完整的键和主题指纹，不依赖主体或子组件名', async () => {
  const { getThemeSlotSelector } = await import('../../app/lib/tv');
  assert.equal(getThemeSlotSelector('root', themeId), `[class$="-root-${themeId}"], [class*="-root-${themeId} "]`);
});

it('组件名可由单文件组件名称推导，非安全字符不会生成额外类名', async () => {
  const component = defineComponent({ __name: 'RebornBadge', setup: () => () => h('span', { class: shared().label() }) });
  const html = await renderToString(createSSRApp(component));
  assert.match(html, new RegExp(`RebornBadge-label-${themeId}`));
  const named = defineComponent({ name: 'Custom.Button', setup: () => () => h('span', { class: shared().label() }) });
  assert.match(await renderToString(createSSRApp(named)), new RegExp(`Custom-Button-label-${themeId}`));
});
