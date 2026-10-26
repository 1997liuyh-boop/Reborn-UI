/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { it } from 'node:test';
import { loadAppModule } from '../composables/harness';

// 不安装 DOM：按服务端环境渲染，断言首屏 HTML 里的遮罩属性名
const { createSSRApp, h } = await import('vue');
const { renderToString } = await import('vue/server-renderer');
const { RebornCoupon: Coupon } = await loadAppModule<typeof import('../../app/components/reborn/ui/reborn-coupon')>('app/components/reborn/ui/reborn-coupon/index.ts');

async function render(props: Record<string, unknown>) {
  return renderToString(createSSRApp({ render: () => h(Coupon, props, { left: () => '左', right: () => '右' }) }));
}

it('服务端首屏输出带短横线前缀的 -webkit-mask-* 属性，每种缺口类型都生效', async () => {
  for (const type of ['notch', 'perforated', 'ticket', 'stamp', 'combined']) {
    const html = await render({ type });
    const style = html.match(/style="([^"]*)"/)?.[1] ?? '';
    assert.match(style, /(?:^|;)-webkit-mask-image:/, `${type} 缺少 -webkit-mask-image`);
    assert.doesNotMatch(style, /(?:^|;)webkit-mask/, `${type} 输出了缺少前缀短横线的非法属性名`);
  }
  const combined = await render({ type: 'combined' });
  assert.match(combined, /-webkit-mask-size:/);
  assert.match(combined, /-webkit-mask-composite:source-out, destination-over/);
  assert.match(combined, /mask-composite:subtract, add/);
});
