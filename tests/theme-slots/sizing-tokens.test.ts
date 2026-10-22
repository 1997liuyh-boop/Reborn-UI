/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { it } from 'node:test';
import { tv } from '../../app/lib/tv';
import { cn } from '../../app/lib/utils';

const mergers = {
  cn: (base: string, override: string) => cn(base, override),
  tv: (base: string, override: string) => tv({ base })({ class: override }),
};

const sizingPairs = [
  ['h-6', 'h-10'],
  ['h-8', 'h-[42px]'],
  ['h-4', 'h-(--separator-height)'],
  ['size-3', 'size-5'],
  ['size-6', 'size-[42px]'],
  ['h-6', 'h-(--track-height)'],
  ['w-11', 'w-20'],
  ['min-h-8', 'min-h-0'],
  ['max-h-60', 'max-h-screen'],
  ['min-w-6', 'min-w-[20px]'],
  ['max-w-80', 'max-w-full'],
  ['h-time-picker-panel-item', 'h-8'],
  ['size-radio-dot-md', 'size-2'],
] as const;

for (const [name, merge] of Object.entries(mergers)) {
  for (const [named, other] of sizingPairs) {
    it(`${name} 中 ${named} 与 ${other} 按后写顺序互相覆盖`, () => {
      assert.equal(merge(named, other), other);
      assert.equal(merge(other, named), named);
    });
  }

  it(`${name} 中 size 同时覆盖宽高，单独宽高保留另一维度`, () => {
    assert.equal(merge('h-8 w-8', 'size-6'), 'size-6');
    assert.equal(merge('size-6', 'h-8'), 'size-6 h-8');
    assert.equal(merge('size-6', 'w-8'), 'size-6 w-8');
    assert.equal(merge('min-h-8 max-h-60', 'h-8'), 'min-h-8 max-h-60 h-8');
  });

  it(`${name} 中尺寸变体独立合并且保留条件修饰符`, () => {
    assert.equal(merge('hover:h-6 h-6', 'hover:h-10'), 'h-6 hover:h-10');
    assert.equal(merge('dark:size-3', 'dark:size-6'), 'dark:size-6');
    assert.equal(merge('h-8!', 'h-12!'), 'h-12!');
  });

  it(`${name} 中尺寸不影响颜色、字号及已有间距覆盖`, () => {
    assert.equal(merge('h-8 text-base text-gray-8 bg-primary-6', 'h-10'), 'text-base text-gray-8 bg-primary-6 h-10');
    assert.equal(merge('text-base text-gray-8', 'text-lg text-gray-10'), 'text-lg text-gray-10');
    assert.equal(merge('px-3', 'px-0'), 'px-0');
    assert.equal(merge('px-0', 'px-3'), 'px-3');
  });
}

it('tv 的 slot 覆盖使用相同尺寸规则且保留主题标记', () => {
  const styles = tv({ slots: { root: 'h-6', icon: 'size-3' } })();
  assert.match(styles.root({ class: 'h-10' }), /^h-10 Component-root-/);
  assert.match(styles.icon({ class: 'size-6' }), /^size-6 Component-icon-/);
});
