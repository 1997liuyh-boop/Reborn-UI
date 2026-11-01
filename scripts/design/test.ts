import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const executablePath = process.env.GUIDE_BROWSER_PATH || chromium.executablePath();
if (!existsSync(executablePath)) throw new Error('设计回归需要真实 Chromium，请先运行 pnpm exec playwright-core install chromium');
// 编译真实公开组件类型，确保非法枚举与 UI 键位不会静默通过。
const typecheck = spawnSync(process.execPath, ['node_modules/vue-tsc/bin/vue-tsc.js', '--project', 'tests/reborn-chip/tsconfig.json', '--noEmit'], { stdio: 'inherit' });
if (typecheck.error) throw typecheck.error;
if (typecheck.status !== 0) process.exit(typecheck.status ?? 1);
const tests = ['tests/theme-slots', 'tests/design-system'].flatMap(directory => readdirSync(directory).filter(file => /\.test\.(?:ts|mjs)$/.test(file)).map(file => join(directory, file)));
tests.push(
  'tests/reborn-button/production-attrs.test.mjs',
  'tests/reborn-button/loading.browser.test.ts',
  'tests/reborn-button/color-roles.test.ts',
  'tests/reborn-button/ui-types.test.ts',
  'tests/reborn-checkbox/component.test.mjs',
  'tests/reborn-checkbox/tokens.browser.test.ts',
  'tests/reborn-chip/model.test.ts',
);
const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', '--test-reporter=tap', ...tests], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
process.stdout.write(result.stdout ?? '');
process.stderr.write(result.stderr ?? '');
if (result.error) throw result.error;
// 浏览器不可用或测试被跳过时，不能用绿色结果掩盖验证缺口。
if (/^# skipped [1-9]\d*/m.test(result.stdout ?? '')) {
  console.error('设计回归存在跳过测试，请补齐运行环境后重试');
  process.exitCode = 1;
}
else process.exitCode = result.status ?? 1;
