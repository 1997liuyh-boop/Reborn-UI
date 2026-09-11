/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { it } from 'node:test';
import { transformSync } from 'esbuild';
import { tv } from 'tailwind-variants';
import webTheme from '../../app/components/reborn/ui/reborn-switch/reborn-switch.config';
import { cn } from '../../app/lib/utils';
const uniTheme = createRequire(import.meta.url)('../../packages/uniapp-project/src/components/reborn-switch/reborn-switch.config.ts').default;

for (const [platform, theme, source] of [
  ['web', webTheme, 'app/components/reborn/ui/reborn-switch/RebornSwitch.vue'],
  ['uni', uniTheme, 'packages/uniapp-project/src/components/reborn-switch/RebornSwitch.vue'],
] as const) {
  it(`${platform}：移除旧颜色参数并接入两态轨道样式`, () => {
    const code = readFileSync(source, 'utf8');
    assert.doesNotMatch(code, /activeColor|inactiveColor/);
    assert.match(code, /activeTrack: ClassValue/);
    assert.match(code, /inactiveTrack: ClassValue/);
    assert.match(code, /uiOverrides.value.activeTrack/);
    assert.match(code, /uiOverrides.value.inactiveTrack/);
  });

  it(`${platform}：背景与 ring 支持通用覆盖及状态覆盖`, () => {
    const styles = tv(theme);
    for (const active of [false, true]) {
      const slots = styles({ active, color: 'success' });
      const state = active ? slots.activeTrack() : slots.inactiveTrack();
      assert.ok(state.includes(active ? 'bg-success' : theme.slots.inactiveTrack));
      const common = slots.track({ class: [state, 'bg-white ring-2 ring-black'] });
      assert.ok(common.includes('bg-white'));
      assert.ok(common.includes('ring-2'));
      assert.ok(common.includes('ring-black'));
      assert.ok(!common.includes('peer-checked:bg-'));
      const custom = active ? 'bg-green-500 ring-4 ring-green-700' : 'bg-red-500 ring-0 ring-red-700';
      const track = slots.track({ class: [state, 'bg-white ring-2 ring-black', custom] });
      assert.ok(track.includes(custom));
      assert.ok(!track.includes('bg-white'));
      assert.ok(!track.includes('ring-black'));
    }
  });
  it(`${platform}：实际组件按状态合并 ui，支持运行时更新和清除覆盖`, () => {
    // 直接执行组件内的计算表达式，避免只验证测试中重复实现的合并逻辑。
    const code = readFileSync(source, 'utf8');
    const expression = code.match(/const ui = computed\((\(\) => \{[\s\S]*?\n\})\);?/);
    assert.ok(expression);
    const compiled = transformSync(`const build = ${  expression[1]}`, { loader: 'ts' }).code;
    const isChecked = { value: false };
    const isDisabled = { value: false };
    const uiOverrides = { value: {} as Record<string, string> };
    const props = { size: 'md', color: 'success', type: 'circle', autoWidth: false, loading: false };
    // eslint-disable-next-line no-new-func -- 仅执行仓库内受控的组件表达式，注入隔离测试上下文
    const build = new Function('b', 'cn', 'props', 'isChecked', 'isDisabled', 'isError', 'fieldGroupSize', 'formSize', 'uiOverrides', `${compiled  };return build;`)(
      tv(theme), cn, props, isChecked, isDisabled, { value: false }, {}, {}, uiOverrides,
    );
    for (const active of [false, true, false]) {
      isChecked.value = active;
      uiOverrides.value = { track: 'bg-white ring-2 ring-black' };
      assert.ok(build().track().includes('bg-white'));
      uiOverrides.value.activeTrack = 'bg-green-500 ring-4 ring-green-700';
      uiOverrides.value.inactiveTrack = 'bg-red-500 ring-0 ring-red-700';
      const track = build().track();
      assert.ok(track.includes(active ? 'bg-green-500' : 'bg-red-500'));
      assert.ok(track.includes(active ? 'ring-4' : 'ring-0'));
      assert.ok(track.includes(active ? 'ring-green-700' : 'ring-red-700'));
      assert.ok(!track.includes('bg-white'));
      uiOverrides.value = {};
      assert.ok(build().track().includes(active ? 'bg-success' : theme.slots.inactiveTrack));
      if (platform === 'web') {
        isDisabled.value = true;
        assert.ok(build().track().includes('bg-gray-2'));
        uiOverrides.value.track = 'bg-white ring-0';
        assert.ok(build().track().includes('bg-white'));
        isDisabled.value = false;
      }
    }
  });

}
