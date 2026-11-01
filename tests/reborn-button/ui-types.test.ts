/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict'
import { it } from 'node:test'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

it('公共 UI 类型接受条件类名并拒绝错误节点和 Symbol 值', () => {
  const program = ts.createProgram([fileURLToPath(new URL('./ui-types.ts', import.meta.url))], {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    types: [],
  })
  const errors = ts.getPreEmitDiagnostics(program)
  assert.equal(errors.length, 0, ts.formatDiagnosticsWithColorAndContext(errors, {
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getCanonicalFileName: file => file,
    getNewLine: () => '\n',
  }))
})
