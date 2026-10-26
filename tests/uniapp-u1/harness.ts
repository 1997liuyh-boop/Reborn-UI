import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { runInThisContext } from 'node:vm'
import { compileScript, parse } from '@vue/compiler-sfc'
import { build } from 'esbuild'
import { createRenderer, defineComponent, h, nextTick } from 'vue'

export interface TestNode { type: string; props: Record<string, any>; style: Record<string, any>; children: TestNode[]; parent?: TestNode; text?: string }
export const node = (type: string): TestNode => ({ type, props: {}, style: {}, children: [] })
export const renderer = createRenderer<TestNode, TestNode>({
  createElement: node, createText: text => ({ ...node('#text'), text }), createComment: text => ({ ...node('#comment'), text }),
  insert(child, parent, anchor) { if (child.parent) child.parent.children.splice(child.parent.children.indexOf(child), 1); const i = anchor ? parent.children.indexOf(anchor) : -1; parent.children.splice(i < 0 ? parent.children.length : i, 0, child); child.parent = parent },
  remove(child) { child.parent?.children.splice(child.parent.children.indexOf(child), 1) },
  setText(child, text) { child.text = text }, setElementText(child, text) { child.text = text; child.children = [] },
  parentNode: child => child.parent!, nextSibling: child => child.parent?.children[child.parent.children.indexOf(child) + 1]!,
  patchProp(child, key, _old, value) { child.props[key] = value },
})
export function find(root: TestNode, predicate: (n: TestNode) => boolean): TestNode[] { return [root, ...root.children.flatMap(n => find(n, predicate))].filter(predicate) }
export function fixture() {
  const pending: (() => void)[] = []
  const controls: Record<string, any[]> = {}
  Object.assign(globalThis, { __u1Controls: controls, uni: {
    getWindowInfo: () => ({ screenWidth: 375, screenHeight: 800, windowWidth: 375, windowHeight: 800, safeAreaInsets: { bottom: 0, top: 0 } }),
    getSystemInfoSync: () => ({ platform: 'ios', windowWidth: 375, windowHeight: 800, safeArea: { bottom: 800 } }),
    onWindowResize() {}, offWindowResize() {}, pageScrollTo() {}, $emit() {},
    createSelectorQuery() {
      const callbacks: ((rect: any) => void)[] = []
      let all = false
      const query = { in() { return query }, select() { return query }, selectAll() { all = true; return query }, boundingClientRect(callback?: (rect: any) => void) { if (callback) callbacks.push(callback); return query }, exec(callback?: (rect: any[]) => void) { pending.push(() => { const rect = { top: 0, left: 0, width: 100, height: 50 }; callbacks.forEach(fn => fn(rect)); callback?.([all ? [rect, { ...rect, top: 50 }] : rect]) }); return query } }
      return query
    },
  }, document: { addEventListener() {}, removeEventListener() {} } })
  return { pending, controls, flush() { pending.splice(0).forEach(fn => fn()) } }
}
function preprocess(source: string, flags = ['H5', 'VUE3']) {
  const stack: boolean[] = [true]
  return source.split(/\r?\n/).filter(line => {
    const directive = line.match(/(?:\/\/|<!--)[ \t]*#(ifdef|ifndef|endif)\b(.*)$/)
    if (!directive) return stack.every(Boolean)
    const [, kind, rawExpression = ''] = directive
    const expression = rawExpression.replace('-->', '').trim()
    if (kind === 'endif') stack.pop()
    else {
      const matches = expression.split(/\s*\|\|\s*/).some(flag => flags.includes(flag.trim()))
      stack.push(kind === 'ifdef' ? matches : !matches)
    }
    return false
  }).join('\n')
}
export async function loadComponent(name: string, live: string[] = [], platform: 'uniapp' | 'web' = 'uniapp', target: 'H5' | 'MP-WEIXIN' = 'H5') {
  const flags = target === 'H5' ? ['H5', 'VUE3'] : ['MP', 'MP-WEIXIN', 'VUE3']
  const sourceRoot = platform === 'web' ? 'app' : 'packages/uniapp-project/src'
  const componentRoot = platform === 'web' ? 'app/components/reborn/ui' : `${sourceRoot}/components`
  const entry = path.resolve(componentRoot, name)
  const actual = new Set([entry, ...live.map(p => path.resolve(componentRoot, p))])
  const result = await build({ entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', alias: { '@': path.resolve(sourceRoot), '~': path.resolve(sourceRoot) }, plugins: [{ name: 'u1-fixture', setup(builder) {
    builder.onResolve({ filter: /^[@~]\/composables\/useFieldGroup$/ }, () => ({ path: path.resolve(sourceRoot, 'composables/useFieldGroup.ts'), external: true }))
    builder.onResolve({ filter: /reborn-breadcrumb\.config$/ }, () => ({ path: path.resolve('packages/uniapp-project/src/components/reborn-breadcrumb/reborn-breadcrumb.config.ts'), external: true }))
    builder.onLoad({ filter: /\.ts$/ }, args => args.path.includes('uniapp-project') ? { contents: preprocess(readFileSync(args.path, 'utf8'), flags), loader: 'ts', resolveDir: path.dirname(args.path) } : undefined)
    builder.onLoad({ filter: /\.vue$/ }, args => {
        if (!actual.has(args.path)) return { loader: 'js', resolveDir: path.dirname(args.path), contents: `const {defineComponent,h}=require('vue');export default defineComponent({inheritAttrs:${path.basename(args.path) === 'RebornTransition.vue'},props:['modelValue','format','show','focus','label','disabled'],emits:['update:modelValue','update:format','change','focus','blur','confirm','tap'],setup(props,{emit,slots}){const name=${JSON.stringify(path.basename(args.path, '.vue'))};(globalThis.__u1Controls[name]??=[]).push({props,emit});return()=>h('control',{name,...props},Object.values(slots).flatMap(slot=>slot?.({})));}})` }
      let source = preprocess(readFileSync(args.path, 'utf8'), flags)
      // MP 的 WXS 由独立用例执行；Vue 内存渲染器只需要可绑定的事件入口。
      if (target !== 'H5' && source.includes('module="dragWxs"')) source = source.replace('<script lang="ts" setup>', '<script lang="ts" setup>\nconst dragWxs = { touchmove: () => true, touchend: () => true }')
      // 测试宿主不解析WXS；真实平台编译交由uniapp工具链。
      source = source.replace(/<script module="dragWxs"[\s\S]*?<\/script>/, '')
      const { descriptor } = parse(source, { filename: args.path })
      return { contents: compileScript(descriptor, { id: args.path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') } }).content, loader: 'ts', resolveDir: path.dirname(args.path) }
    })
  } }] })
  const module = { exports: {} as any }
  runInThisContext(`(function(module,exports,require){${result.outputFiles[0]!.text}\n})`)(module, module.exports, createRequire(import.meta.url))
  return module.exports.default
}
export async function mount(component: any, props: Record<string, any> = {}, slots: Record<string, any> = {}) {
  const root = node('root')
  let exposed: any
  const app = renderer.createApp(defineComponent({ setup() { return () => h(component, { ...props, ref: (value: any) => exposed = value }, slots) } }))
  app.config.warnHandler = () => {}
  app.mount(root)
  await nextTick()
  return { root, get exposed() { return exposed }, unmount: () => app.unmount() }
}
