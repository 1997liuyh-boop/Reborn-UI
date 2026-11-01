import { checkDesign } from './rules';

const violations = checkDesign(process.cwd());
for (const item of violations) console.error(`${item.file}: [${item.rule}] ${item.detail}`);
console.log(`设计规范检查：${violations.length} 项违规`);
if (violations.length) process.exitCode = 1;
