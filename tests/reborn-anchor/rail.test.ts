/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { after, it } from 'node:test';
import { installDom, loadAppModule, wait } from '../composables/harness';

/**
 * 锚点轨道线回归测试
 *
 * 曾经的问题：default 的轨道线用 bg-gray-2，而浅色主题的 --color-elevated 也是 gray-2，
 * 锚点放进填充面板时轨道线与底色重合，default 与 underline 在页面上看不出任何区别。
 */

const dom = installDom();
const { createApp, h, nextTick, shallowRef } = await import('vue');
const anchorModule = await loadAppModule<typeof import('../../app/components/reborn/ui/reborn-anchor')>('app/components/reborn/ui/reborn-anchor/index.ts');
const { RebornAnchor, RebornAnchorItems, RebornAnchorLink, rebornAnchorConfig } = anchorModule;
after(() => dom.window.close());

/** 取出 base.css 里某个选择器块的正文 */
function cssBlock(css: string, selector: string) {
  const start = css.indexOf(`${selector} {`);
  assert.ok(start >= 0, `base.css 里找不到 ${selector} 块`);
  return css.slice(start, css.indexOf('\n}', start));
}

/** 在一个主题块里把令牌解析成十六进制色值，var() 引用逐层展开 */
function resolveToken(block: string, name: string): string {
  const match = block.match(new RegExp(`${name}:\\s*([^;]+);`));
  assert.ok(match, `主题块里没有 ${name}`);
  const value = match[1]!.trim();
  const ref = value.match(/^var\((--[\w-]+)\)$/);
  return ref ? resolveToken(block, ref[1]!) : value;
}

/** WCAG 相对亮度 */
function luminance(hex: string) {
  const channels = hex.replace('#', '').match(/../g)!.map(part => Number.parseInt(part, 16) / 255);
  const [r, g, b] = channels.map(c => (c <= 0.039_28 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** 从 list 的类名里取出轨道线用的色阶，如 before:bg-gray-3 → --color-gray-3 */
function railToken(listClass: string) {
  const match = listClass.match(/(?:^|\s)before:bg-(gray-\d+)(?:\s|$)/);
  return match ? `--color-${match[1]}` : undefined;
}

const directions = ['vertical', 'horizontal'] as const;

it('default 画轨道线、underline 不画，两个方向都成立', () => {
  for (const direction of directions) {
    const railed = rebornAnchorConfig({ type: 'default', direction }).list();
    const bare = rebornAnchorConfig({ type: 'underline', direction }).list();
    assert.match(railed, /before:content-\[''\]/, `${direction} 的 default 缺少轨道线伪元素`);
    assert.ok(railToken(railed), `${direction} 的 default 轨道线没有底色`);
    assert.doesNotMatch(bare, /(?:^|\s)before:/, `${direction} 的 underline 不应带任何轨道线类名`);
  }
});

it('轨道线在明暗两套主题下都与填充面板底色拉开对比，不会重合', () => {
  const css = readFileSync(path.resolve('app/assets/theme/base.css'), 'utf8');
  const light = cssBlock(css, '@theme');
  // 暗色块只覆盖色阶，--color-elevated 仍沿用 @theme 里的 var(--color-gray-2)，要拼在一起解析
  const dark = `${cssBlock(css, '.dark')}\n${light}`;
  for (const direction of directions) {
    const token = railToken(rebornAnchorConfig({ type: 'default', direction }).list())!;
    for (const [theme, block] of [['浅色', light], ['暗色', dark]] as const) {
      const rail = resolveToken(block, token);
      const panel = resolveToken(block, '--color-elevated');
      const ratio = contrast(rail, panel);
      // gray-2 对 gray-2 是 1.00；gray-3 在浅色下约 1.13、暗色下约 1.48，取 1.1 作为可辨识的下限
      assert.ok(ratio >= 1.1, `${theme}主题下 ${direction} 轨道线 ${rail} 与面板底色 ${panel} 对比度只有 ${ratio.toFixed(2)}`);
    }
  }
});

it('切换 type 时列表节点的轨道线随之出现与消失', async () => {
  const type = shallowRef<'default' | 'underline'>('default');
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({
    render: () => h(RebornAnchor, { type: type.value }, () => [
      h(RebornAnchorLink, { href: '#a', title: '甲' }),
      h(RebornAnchorLink, { href: '#b', title: '乙' }),
    ]),
  });
  // 站点里两者由 Nuxt 全局注册，RebornAnchor 模板按名字解析，这里照样注册以免解析告警
  app.component('RebornAnchorItems', RebornAnchorItems);
  app.component('RebornAnchorLink', RebornAnchorLink);
  app.mount(root);
  try {
    await nextTick();
    const list = () => root.querySelector('[data-reborn-anchor] > div')!;
    assert.equal(railToken(list().className), '--color-gray-3');

    type.value = 'underline';
    await wait();
    assert.equal(railToken(list().className), undefined);
    assert.doesNotMatch(list().className, /(?:^|\s)before:/);

    type.value = 'default';
    await wait();
    assert.equal(railToken(list().className), '--color-gray-3');
  }
  finally {
    app.unmount();
    root.remove();
  }
});
