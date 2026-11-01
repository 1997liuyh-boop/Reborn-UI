import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

function git(args: string[]) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || `git ${args[0]} 执行失败`);
  return result.stdout.split('\0').filter(Boolean);
}

const base = process.env.DESIGN_LINT_BASE;
const files = base
  ? git(['diff', '--name-only', '--diff-filter=ACMR', '-z', `${base}...HEAD`])
  : [...git(['diff', '--name-only', '--diff-filter=ACMR', '-z', 'HEAD']), ...git(['ls-files', '--others', '--exclude-standard', '-z'])];
// 模板快照由生成器写入，内部的占位表达式是待分发源码，不作为当前脚本规则检查。
const targets = [...new Set(files)].filter(file => file !== 'packages/cli/src/generated/templates.ts' && /\.(?:vue|[cm]?[jt]sx?)$/.test(file) && existsSync(file));
if (!targets.length) console.log('没有需要 lint 的改动源码');
else {
  // 使用本地入口避免 Windows shell 转义差异，并限制检查为本次实际改动。
  for (const entry of ['node_modules/oxlint/bin/oxlint', 'node_modules/eslint/bin/eslint.js']) {
    const result = spawnSync(process.execPath, [resolve(entry), ...targets], { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      process.exitCode = result.status ?? 1;
      break;
    }
  }
}
