/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { it } from 'node:test';
import { tv } from 'tailwind-variants';
import webTheme from '../../app/components/reborn/ui/reborn-switch/reborn-switch.config';
// UniApp 子包使用 CommonJS，显式读取默认导出以避免测试运行器的双层封装。
const uniTheme = createRequire(import.meta.url)('../../packages/uniapp-project/src/components/reborn-switch/reborn-switch.config.ts').default;

for (const [platform, theme] of Object.entries({ web: webTheme, uni: uniTheme })) {
  it(`${platform}：滑块仅通过左右边界滑动，不叠加横向位移`, () => {
    const transition = theme.slots.thumb.match(/transition-\[([^\]]+)\]/)?.[1].split(',');
    assert.ok(transition);
    assert.deepEqual(transition, ['left', 'right']);
    for (const property of ['left', 'right']) {
      assert.ok(transition.includes(property), `缺少 ${property} 过渡会导致切换时位置跳变`);
    }
    assert.ok(theme.slots.thumb.includes('motion-reduce:transition-none'));
    assert.ok(theme.slots.thumb.includes('duration-200'));
    assert.ok(theme.slots.thumb.includes('ease-[ease-in-out]'));
  });

  it(`${platform}：所有尺寸和形态保留滑块端点与细线垂直居中`, () => {
    const styles = tv(theme);
    for (const size of ['sm', 'md', 'lg'] as const) {
      for (const type of ['circle', 'round', 'line'] as const) {
        for (const autoWidth of [false, true]) {
          const off = styles({ size, type, autoWidth, active: false }).thumb();
          const on = styles({ size, type, autoWidth, active: true }).thumb();
          assert.ok(off.includes('left-[2px]'));
          assert.ok(on.includes('right-[2px]'));
          assert.ok(on.includes('left-[max(2px,calc(100%_-_var(--re-switch-thumb-size)_-_2px))]'));
          assert.ok(!on.includes('-translate-x-full'));
          assert.ok(!on.includes('-ml-0.5'));
          assert.ok(off.includes('w-auto'));
          assert.ok(on.includes('w-auto'));
          if (type === 'line') {
            assert.ok(off.includes('-translate-y-1/2'));
            assert.ok(on.includes('-translate-y-1/2'));
          }
        }
      }
    }
  });
}



for (const [platform, theme] of Object.entries({ web: webTheme, uni: uniTheme })) {
  it(`${platform}：按压向内拉伸，禁用和减弱动效时不拉伸`, () => {
    assert.ok(theme.slots.wrapper.includes('group/switch'));
    const press = platform === 'web' ? ':active' : '.re-switch-pressed';
    for (const [size, diameter] of [['sm', 12], ['md', 20], ['lg', 28]] as const) {
      const thumb = theme.variants.size[size].thumb;
      assert.ok(thumb.includes(`[--re-switch-thumb-size:${diameter}px]`));
      for (const active of [false, true]) {
        const classes = tv(theme)({ size, active }).thumb();
        const edge = active ? "left" : "right";
        assert.ok(classes.includes(`motion-safe:group-[${press}:not([data-disabled=true])]/switch:${edge}-[max(2px,calc(100%_-_var(--re-switch-thumb-size)*1.3_-_2px))]`));
      }
    }
  });
}

for (const [platform, theme] of Object.entries({ web: webTheme, uni: uniTheme })) {
  it(`${platform  }：像素留白不随根字号变化`, () => {
    assert.ok(theme.slots.thumb.includes('top-[2px]'));
    assert.ok(!/\b(?:left|right|top)-0\.5\b/.test(JSON.stringify(theme)));
  });
  it(`${platform  }：两态文案保留在同一网格内并水平滑动`, () => {
    const source = readFileSync(platform === 'web'
      ? 'app/components/reborn/ui/reborn-switch/RebornSwitch.vue'
      : 'packages/uniapp-project/src/components/reborn-switch/RebornSwitch.vue', 'utf8');
    assert.ok(!source.includes('v-if="isChecked &&'));
    assert.ok(!source.includes('v-else-if="!isChecked &&'));
    assert.ok(source.includes('grid-cols-1'));
    const on = tv(theme)({ active: true });
    const off = tv(theme)({ active: false });
    assert.ok(on.inlineActive().includes('translate-x-0'));
    assert.ok(on.inlineInactive().includes('translate-x-full'));
    assert.ok(off.inlineActive().includes('-translate-x-full'));
    assert.ok(off.inlineInactive().includes('translate-x-0'));
    for (const key of ['inlineActive', 'inlineInactive']) {
      assert.ok(theme.slots[key].includes('transition-transform'));
      assert.ok(theme.slots[key].includes('duration-200'));
      assert.ok(theme.slots[key].includes('motion-reduce:transition-none'));
    }
  });
}
