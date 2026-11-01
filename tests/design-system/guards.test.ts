/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { it } from 'node:test';
import { checkDesign, sourceViolations, themeViolations } from '../../scripts/design/rules';

it('组件实际类名、变量与公开 ui 类型遵循设计契约', () => {
  assert.deepEqual(checkDesign(process.cwd()), []);
});

it('守卫忽略注释与模板正文，但识别动态 class 和 SFC 中的真实违规', () => {
  const allowed = `<script setup lang="ts">// text-xs var(--text-size-sm) ui?: any
    const classes = 'text-sm';</script><template><!-- text-xs --><div :class="classes">text-xs</div></template>`;
  assert.deepEqual(sourceViolations(allowed, 'RebornFixture.vue'), []);
  const invalid = `<script setup lang="ts">interface Props { ui?: any }; const classes = 'hover:text-xs var(--text-size-sm)';</script>
    <template><div class="rounded-ui-sm" :class="{ 'text-xs': true }" /></template>`;
  const violations = sourceViolations(invalid, 'RebornFixture.vue');
  assert.equal(violations.filter(item => item.rule === '字号令牌').length, 2);
  assert.equal(violations.filter(item => item.rule === '公共类型').length, 1);
  assert.equal(violations.filter(item => item.rule === '未定义变量').length, 1);
  assert.equal(violations.filter(item => item.rule === '圆角令牌').length, 1);
});

it('守卫识别描边角色误用与语义实底搭配固定前景', () => {
  const invalid = `export default {
    menu: { menuItem: 'hover:bg-primary-border' },
    tree: { content: 'text-success-border ring-success' },
    fab: { trigger: 'bg-neutral text-white' },
    pressed: { base: 'enabled:active:bg-error-active enabled:active:text-gray-1' },
  }`;
  const violations = sourceViolations(invalid, 'fixture.config.ts');
  assert.equal(violations.filter(item => item.rule === '角色误用').length, 2);
  assert.equal(violations.filter(item => item.rule === '实底前景').length, 2);
  // 描边类工具、半透明浅底、配对前景与变量声明都是合法用法。
  const allowed = `export default {
    input: { wrapper: 'border-primary-border hover:ring-error-border focus-visible:outline-info-border' },
    soft: { root: 'bg-primary/10 text-white' },
    paired: { trigger: 'bg-warning text-warning-foreground' },
    variable: { item: '[--x:var(--color-primary-border)]' },
  }`;
  assert.deepEqual(sourceViolations(allowed, 'fixture.config.ts'), []);
});

it('主题守卫能阻止断开的颜色角色与被修改的字号行高', () => {
  const base = readFileSync('app/assets/theme/base.css', 'utf8');
  const typography = readFileSync('app/assets/theme/typography.css', 'utf8');
  assert.ok(themeViolations(`${base}\n:root { --color-fixture: var(--color-missing); }`, typography).some(item => item.detail.includes('--color-missing')));
  assert.ok(themeViolations(base, typography.replace('--text-base--line-height: 22px', '--text-base--line-height: 23px')).some(item => item.detail.includes('--text-base--line-height')));
});
