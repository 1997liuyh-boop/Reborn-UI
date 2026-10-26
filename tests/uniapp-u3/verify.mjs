import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { ESLint } from 'eslint'

// 保留 HEAD 基线，以规则和消息逐项比较，避免行号变化掩盖新增问题。
const evidenceDir = '.superpowers/sdd/FIX-METHOD/U3'
mkdirSync(evidenceDir, { recursive: true })
const baseline = JSON.parse(readFileSync(`${evidenceDir}/lint-baseline.json`, 'utf8'))
async function verify() {
const eslint = new ESLint()
const results = await eslint.lintFiles(baseline.map(item => item.file))
const after = results.map((result, index) => {
  const before = baseline[index]
  const remaining = new Map()
  for (const item of before.messages) {
    const key = `${item.ruleId}:${item.message}`
    remaining.set(key, (remaining.get(key) || 0) + 1)
  }
  const extra = result.messages.filter(item => {
    const key = `${item.ruleId}:${item.message}`
    const count = remaining.get(key) || 0
    remaining.set(key, count - 1)
    return count <= 0
  })
  return { file: before.file, messages: result.messages, errorCount: result.errorCount, warningCount: result.warningCount, baselineErrors: before.errorCount, baselineWarnings: before.warningCount, extra }
})
writeFileSync(`${evidenceDir}/lint-after.json`, `${JSON.stringify(after, null, 2)}\n`)
const summary = after.map(({ file, errorCount, warningCount, baselineErrors, baselineWarnings, extra }) => ({ file, before: [baselineErrors, baselineWarnings], after: [errorCount, warningCount], extra: extra.length }))
writeFileSync(`${evidenceDir}/lint-summary.json`, `${JSON.stringify(summary, null, 2)}\n`)
process.stdout.write(`${JSON.stringify(summary)}\n`)
const result = spawnSync(process.execPath, ['--test', 'tests/uniapp-u3/components.test.mjs'], { encoding: 'utf8' })
writeFileSync(`${evidenceDir}/final.tap`, result.stdout + result.stderr)
process.stdout.write(result.stdout)
if (after.some(item => item.extra.length || item.errorCount > item.baselineErrors || item.warningCount > item.baselineWarnings) || result.status !== 0) process.exitCode = 1

}
verify().catch(error => { process.stderr.write(`${error.stack || error}\n`); process.exitCode = 1 })
