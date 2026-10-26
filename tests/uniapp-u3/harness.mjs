import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { runInThisContext } from 'node:vm'
import { compileScript, parse } from '@vue/compiler-sfc'
import { build } from 'esbuild'

/** 按目标端保留条件编译分支，不改动生产源码。 */
function preprocess(source, target = 'H5') {
  const flags = target === 'H5' ? ['H5', 'VUE3'] : ['MP', 'MP-WEIXIN', 'VUE3']
  const stack = []
  return source.split('\n').filter(line => {
    const directive = line.match(/(?:\/\/|<!--) #(?<kind>ifdef|ifndef) (?<names>[^<]+?)(?: -->)?$/)
    if (directive) {
      const match = directive.groups.names.trim().split(/\s*\|\|\s*/).some(name => flags.includes(name))
      stack.push(directive.groups.kind === 'ifdef' ? match : !match)
      return false
    }
    if (/(?:\/\/|<!--) #endif/.test(line)) { stack.pop(); return false }
    return stack.every(Boolean)
  }).join('\n').replace(/<script module=[\s\S]*?<\/script>/g, '')
}

export async function loadComponent(component, capture = true, target = 'H5') {
  const entry = path.resolve('packages/uniapp-project/src/components', component)
  const fixture = globalThis.__u3
  const result = await build({
    entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
    alias: { '@': path.resolve('packages/uniapp-project/src') },
    plugins: [{ name: 'uniapp-u3-fixture', setup(builder) {
      builder.onResolve({ filter: /^@dcloudio\/uni-app$/ }, () => ({ path: 'platform', namespace: 'u3-mock' }))
      builder.onResolve({ filter: /^@\/composables\/useFieldGroup$/ }, () => ({ path: 'form', namespace: 'u3-mock' }))
      builder.onLoad({ filter: /.*/, namespace: 'u3-mock' }, args => ({ contents: args.path === 'form'
        ? "const {shallowRef}=require('vue');export function useFormInject(){return {disabled:globalThis.__u3.disabled,size:shallowRef(),isError:shallowRef(false),validate:kind=>globalThis.__u3.validations.push(kind)}}"
        : "const {getCurrentInstance}=require('vue');export const onPageScroll=()=>{};export const onShow=fn=>{globalThis.__u3.pageShows.push({instance:getCurrentInstance(),fn})};", loader: 'js', resolveDir: path.resolve('.') }))
      builder.onLoad({ filter: /\.ts$/ }, args => ({ contents: preprocess(readFileSync(args.path, 'utf8'), target), loader: 'ts', resolveDir: path.dirname(args.path) }))
      builder.onLoad({ filter: /\.vue$/ }, args => {
        const source = preprocess(readFileSync(args.path, 'utf8'), target)
        let { descriptor, errors } = parse(source, { filename: args.path })
        assert.deepEqual(errors, [])
        const options = { id: args.path, inlineTemplate: true, templateOptions: { compilerOptions: { isCustomElement: tag => /^[a-z]/.test(tag) } }, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') } }
        if (capture && (args.path === entry || (path.basename(entry) === 'index.ts' && path.basename(path.dirname(entry)) === 'reborn-tabs' && args.path.endsWith('RebornTabs.vue')))) {
          const first = compileScript(descriptor, options)
          const names = Object.entries(first.bindings).filter(([, type]) => String(type).startsWith('setup-') || type === 'literal-const').map(([name]) => name)
          const end = descriptor.scriptSetup.loc.end.offset
          const injected = `${source.slice(0, end)}\nglobalThis.__u3.capture.push({${names.join(',')}});\n${source.slice(end)}`
          descriptor = parse(injected, { filename: args.path }).descriptor
        }
        return { contents: compileScript(descriptor, options).content, loader: 'ts', resolveDir: path.dirname(args.path) }
      })
    } }],
  })
  const module = { exports: {} }
  runInThisContext(`(function(module,exports,require){${result.outputFiles[0].text}\n})`)(module, module.exports, createRequire(import.meta.url))
  return { component: module.exports.default, exports: module.exports, fixture }
}

export function createFixture(vue) {
  const fixture = { capture: [], validations: [], disabled: vue.shallowRef(false), pending: [], autoQuery: true, queries: [], rects: () => [], pageShows: [] }
  globalThis.__u3 = fixture
  globalThis.uni = {
    getSystemInfoSync: () => ({ platform: 'web', windowWidth: 375 }), getWindowInfo: () => ({ windowWidth: 375 }),
    showToast() {}, createSelectorQuery() {
      const selections = []
      let callback
      const query = {
        in() { return query }, select(selector) { selections.push(selector); return query }, selectAll(selector) { selections.push(selector); return query },
        fields() { return query }, scrollOffset() { return query }, boundingClientRect(fn) { callback = fn; return query },
        exec(fn) { const run = () => { const values = fixture.rects(selections); callback?.(values[0]); fn?.(values) }; fixture.queries.push(selections); if (fixture.autoQuery) queueMicrotask(run); else fixture.pending.push(run) },
      }
      return query
    },
  }
  return fixture
}
