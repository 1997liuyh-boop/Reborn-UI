/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { it } from 'node:test';
import theme, { buttonColors } from '../../app/components/reborn/ui/reborn-button/reborn-button.config';
import { tv } from '../../app/lib/tv';

const button = tv(theme);
const disabledBackgrounds = {
  primary: 'bg-primary-3',
  secondary: 'bg-secondary-3',
  success: 'bg-green-3',
  info: 'bg-blue-3',
  warning: 'bg-orange-3',
  error: 'bg-red-3',
  neutral: 'bg-gray-3',
};

for (const color of buttonColors) {
  for (const variant of ['filled', 'round', 'outlined', 'circle', 'text']) {
    it(`${color} ${variant} 禁用态使用指定色阶且不响应悬停`, () => {
      const classes = button({ color, variant, disabled: true }).base().split(/\s+/);
      assert.ok(classes.includes('cursor-not-allowed'));
      assert.ok(!classes.includes('opacity-70'));
      assert.ok(!classes.some((value: string) => /^hover:/.test(value)));
      if (variant === 'filled' || variant === 'round') {
        assert.ok(classes.includes(disabledBackgrounds[color]));
        assert.ok(!classes.some((value: string) => /^dark:bg-/.test(value)));
      }
      if (variant === 'outlined' || variant === 'circle') {
        for (const expected of ['bg-gray-2', 'border', 'border-gray-4', 'text-gray-5']) {
          assert.ok(classes.includes(expected), `缺少 ${expected}`);
        }
        assert.ok(!classes.some((value: string) => /^(?:dark:bg-|disabled:(?:bg|border|text)-)/.test(value)));
      }
      if (variant === 'text') {
        assert.ok(classes.includes('bg-transparent'));
        assert.ok(classes.includes('text-gray-5'));
      }
    });

    it(`${color} ${variant} 非禁用态保留悬停反馈与形状`, () => {
      const classes = button({ color, variant, disabled: false }).base().split(/\s+/);
      assert.ok(classes.includes('cursor-pointer'));
      assert.ok(!classes.includes('cursor-not-allowed'));
      assert.ok(classes.some((value: string) => /^enabled:hover:/.test(value)));
      if (variant === 'round' || variant === 'circle') assert.ok(classes.includes('!rounded-full'));
      if (variant === 'circle') assert.ok(classes.includes('!aspect-square'));
    });
  }
}

// 主色禁用阶跟随主题色选择，明暗规则均不能退回默认品牌色。
const baseCss = readFileSync(new URL('../../app/assets/theme/base.css', import.meta.url), 'utf8');
for (const palette of ['brand', 'orange', 'green', 'red']) {
  it(`主色 ${palette} 的明暗主题都映射至第 3 阶`, () => {
    const blocks = baseCss.split('}').filter(block => block.includes(`[data-theme-color="${palette}"]`));
    assert.equal(blocks.length, 2);
    for (const block of blocks) assert.ok(block.includes(`--color-primary-3: var(--color-${palette}-3);`));
  });
}

for (const color of buttonColors) {
  for (const variant of ['filled', 'outlined', 'text']) {
    it(`${color} ${variant} 禁用文字统一为灰阶 5，暗色模式不另行覆盖`, () => {
      const classes = button({ color, variant, disabled: true }).base().split(/\s+/);
      assert.ok(classes.includes('text-gray-5'));
      assert.ok(!classes.some((value: string) => /^(?:dark:)?text-(?:white|gray-(?:4|6))/.test(value)));
    });
  }
}

for (const color of buttonColors) {
  it(`${color} 其余变体保留原有禁用文字样式`, () => {
    assert.ok(button({ color, variant: 'round', disabled: true }).base().split(/\s+/).includes('text-white/50'));
    assert.ok(button({ color, variant: 'circle', disabled: true }).base().split(/\s+/).includes('text-gray-5'));
    for (const variant of ['soft', 'subtle']) {
      const classes = button({ color, variant, disabled: true }).base().split(/\s+/);
      assert.ok(classes.includes(color === 'neutral' ? 'text-gray-10' : `text-${color}`));
      assert.ok(!classes.includes('text-gray-5'));
    }
  });
}
