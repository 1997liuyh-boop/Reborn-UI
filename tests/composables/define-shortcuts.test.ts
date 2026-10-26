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

it('链式快捷键不区分大小写：大写锁定或按住 Shift 时同样匹配', () => {
  const calls: string[] = [];
  const scope = effectScope();
  scope.run(() => defineShortcuts({ 'g-h': () => calls.push('g-h') }));
  press('G', { shiftKey: true });
  press('H', { shiftKey: true });
  press('g');
  press('h');
  scope.stop();
  assert.deepEqual(calls, ['g-h', 'g-h']);
});

it('焦点变化不触发整表重新解析，输入框聚焦时按当时的焦点判断是否启用', async () => {
  const calls: string[] = [];
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => warnings.push(args.join(' '));
  const input = document.createElement('input');
  input.name = 'search';
  document.body.append(input);
  const scope = effectScope();
  try {
    scope.run(() => defineShortcuts({
      'k': () => calls.push('k'),
      'escape': { handler: () => calls.push('escape'), usingInput: 'search' },
      // 非法键名：解析时告警一次
      '-x': () => {},
    }));
    press('k');
    input.focus();
    await new Promise(resolve => setTimeout(resolve, 0));
    press('k');
    press('Escape');
    input.blur();
    await new Promise(resolve => setTimeout(resolve, 0));
    press('k');
    press('Escape');
  }
  finally {
    scope.stop();
    input.remove();
    console.warn = originalWarn;
  }
  assert.deepEqual(calls, ['k', 'escape', 'k'], '输入框聚焦时 k 被禁用、只在 name=search 的输入框里 escape 生效');
  assert.equal(warnings.filter(text => text.includes('-x')).length, 1, '焦点切换不会重新解析配置');
});
