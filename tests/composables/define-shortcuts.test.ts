/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, it } from 'node:test';
import { installDom, loadAppModule } from './harness';

const dom = installDom();
const { effectScope } = await import('vue');
const { defineShortcuts } = await loadAppModule<typeof import('../../app/composables/defineShortcuts')>('app/composables/defineShortcuts.ts');

after(() => dom.window.close());

const press = (key: string, init: KeyboardEventInit = {}) =>
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));

it('四个方向键都严格匹配 Shift 状态', () => {
  const calls: string[] = [];
  const scope = effectScope();
  scope.run(() => {
    const config: Record<string, () => void> = {};
    for (const direction of ['up', 'down', 'left', 'right']) {
      config[`arrow${direction}`] = () => calls.push(direction);
      config[`shift_arrow${direction}`] = () => calls.push(`shift+${direction}`);
    }
    defineShortcuts(config);
  });

  for (const direction of ['Up', 'Down', 'Left', 'Right']) {
    press(`Arrow${direction}`);
    press(`Arrow${direction}`, { shiftKey: true });
  }
  scope.stop();

  assert.deepEqual(calls, ['up', 'shift+up', 'down', 'shift+down', 'left', 'shift+left', 'right', 'shift+right']);
});
