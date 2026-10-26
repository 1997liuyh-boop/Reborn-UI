/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { it } from 'node:test'

// UniApp 端要兼容 iOS 15.4 以下的小程序 / WebView：构建只做语法转换、不补内置方法，
// ES2022 及以后新增的内置方法一旦进入源码，组件 setup 会在这些系统上直接抛 TypeError。
const root = path.resolve('packages/uniapp-project/src')
const forbidden = [
  ['Object.hasOwn', /\bObject\.hasOwn\(/],
  ['Array.prototype.at / String.prototype.at', /\.at\(/],
  ['findLast / findLastIndex', /\.findLast(?:Index)?\(/],
  ['structuredClone', /\bstructuredClone\(/],
  ['toSorted / toReversed / toSpliced', /\.to(?:Sorted|Reversed|Spliced)\(/],
  ['Object.groupBy / Map.groupBy', /\b(?:Object|Map)\.groupBy\(/],
  ['Array.fromAsync', /\bArray\.fromAsync\(/],
  ['Promise.withResolvers', /\bPromise\.withResolvers\(/],
]

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(file)
    return /\.(?:vue|ts|js)$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [file] : []
  })
}

it('UniApp 源码不使用 ES2022 及以后新增的内置方法', () => {
  const hits = []
  for (const file of sourceFiles(root)) {
    readFileSync(file, 'utf8').split('\n').forEach((line, index) => {
      for (const [name, pattern] of forbidden) {
        if (pattern.test(line)) hits.push(`${path.relative(root, file)}:${index + 1} ${name}`)
      }
    })
  }
  assert.deepEqual(hits, [])
})
