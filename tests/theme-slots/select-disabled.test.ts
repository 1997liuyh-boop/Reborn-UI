/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { it } from 'node:test';
import selectTheme from '../../app/components/reborn/ui/reborn-select/reborn-select.config';
import treeSelectTheme from '../../app/components/reborn/ui/reborn-tree-select/reborn-tree-select.config';
import { tv } from '../../app/lib/tv';

for (const [name, theme] of [['Select', selectTheme], ['TreeSelect', treeSelectTheme]] as const) {
  it(`${name} 禁用时保留鼠标命中并显示禁止光标，子元素不接收指针事件`, () => {
    const classes = tv(theme)({ disabled: true }).trigger().split(/\s+/);
    assert.ok(classes.includes('cursor-not-allowed'));
    assert.ok(!classes.includes('pointer-events-none'));
    assert.ok(classes.includes('[&_*]:pointer-events-none'));
  });

  it(`${name} 非禁用时保持可点击光标`, () => {
    const classes = tv(theme)({ disabled: false }).trigger().split(/\s+/);
    assert.ok(classes.includes('cursor-pointer'));
    assert.ok(!classes.includes('cursor-not-allowed'));
    assert.ok(!classes.includes('[&_*]:pointer-events-none'));
  });
}
