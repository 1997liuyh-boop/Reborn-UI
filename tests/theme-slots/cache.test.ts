/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { it } from 'node:test';
import { createSSRApp, defineComponent, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { tv } from '../../app/lib/tv';

const theme = { slots: { root: 'h-8 text-base' } };

it('相同静态主题与组件复用函数，不同组件和配置保持隔离', async () => {
  const collected: unknown[] = [];
  function component(name: string) {
    return defineComponent({ name, setup() {
      const styles = tv(theme);
      collected.push(styles);
      return () => h('div', { class: styles().root() });
    } });
  }
  const first = component('First');
  const second = component('Second');
  const html = await renderToString(createSSRApp({ render: () => h('main', [h(first), h(first), h(second)]) }));
  assert.equal(collected[0], collected[1]);
  assert.notEqual(collected[0], collected[2]);
  assert.match(html, /First-root-/);
  assert.match(html, /Second-root-/);
  assert.equal(tv(theme), tv(theme));
  const config = { twMerge: false };
  assert.equal(tv(theme, config), tv(theme, config));
  assert.notEqual(tv(theme), tv(theme, config));
  assert.notEqual(tv(theme, config), tv(theme, { twMerge: false }));
});
