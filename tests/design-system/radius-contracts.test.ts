/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { it } from 'node:test';
import datePicker from '../../app/components/reborn/ui/reborn-date-picker/reborn-date-picker.config';
import dialog from '../../app/components/reborn/ui/reborn-dialog/reborn-dialog.config';
import fieldTrigger from '../../app/components/reborn/ui/reborn-field-trigger/reborn-field-trigger.config';
import inputNumber from '../../app/components/reborn/ui/reborn-input-number/reborn-input-number.config';
import input from '../../app/components/reborn/ui/reborn-input/reborn-input.config';
import { inputTheme } from '../../app/components/reborn/ui/reborn-search-box/reborn-search-box.config';
import select from '../../app/components/reborn/ui/reborn-select/reborn-select.config';
import { tv } from '../../app/lib/tv';

for (const size of ['sm', 'md', 'lg'] as const) {
  it(`${size} 下划线默认压平圆角，普通 ui 可以覆盖`, () => {
    for (const [config, slot] of [[input, 'wrapper'], [inputNumber, 'wrapper'], [fieldTrigger, 'trigger'], [select, 'trigger'], [datePicker, 'trigger']] as const) {
      const styles = tv(config as typeof input)({ size, variant: 'underlined', shape: 'square' });
      const node = styles[slot as 'wrapper'];
      assert.ok(node().split(/\s+/).includes('rounded-none'), `${slot} 的尺寸圆角不应覆盖下划线形态`);
      const overridden = node({ class: 'rounded-xl' }).split(/\s+/);
      assert.ok(overridden.includes('rounded-xl'));
      assert.ok(!overridden.some(value => value.startsWith('rounded-') && value !== 'rounded-xl'));
    }
  });

  it(`${size} 输入框连体边缘在尺寸规则后压平，并允许最后覆盖`, () => {
    const styles = tv(input)({ size, shape: 'square', hasPrepend: true, hasAppend: true });
    const defaults = styles.wrapper().split(/\s+/);
    assert.ok(defaults.includes('rounded-s-none'));
    assert.ok(defaults.includes('rounded-e-none'));
    const overridden = styles.wrapper({ class: 'rounded-full' }).split(/\s+/);
    assert.ok(overridden.includes('rounded-full'));
    assert.ok(!overridden.includes('rounded-s-none'));
    assert.ok(!overridden.includes('rounded-e-none'));
  });
}

it('选择标签、搜索内框和全屏弹窗保留默认形状，并允许普通覆盖', () => {
  for (const config of [select, datePicker]) {
    const node = tv(config)().tag;
    const styles = node({ class: 'rounded-xl' }).split(/\s+/);
    assert.ok(styles.includes('rounded-xl'));
    assert.ok(!styles.some(value => value.endsWith('!') && value.startsWith('rounded')));
  }
  assert.ok(tv(inputTheme)({ shape: 'square' }).wrapper({ class: 'rounded-xl' }).includes('rounded-xl'));
  const panel = tv(dialog)({ fullscreen: true }).panel;
  assert.ok(panel().split(/\s+/).includes('rounded-none'));
  assert.ok(!panel({ class: 'rounded-xl' }).split(/\s+/).includes('rounded-none'));
});
