/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { after, it } from 'node:test'
import { runInThisContext } from 'node:vm'
import { compileScript, parse } from '@vue/compiler-sfc'
import { build } from 'esbuild'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' })
for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] })
}
const vue = await import('vue')
const { renderToString } = await import('@vue/server-renderer')
const { withAsyncContext } = await import('../../node_modules/nuxt/dist/app/composables/asyncContext.js')
const { createSSRApp, defineComponent, h, nextTick, provide, readonly, shallowRef, Suspense } = vue
after(() => dom.window.close())

const route = { path: '/components/button/reborn-button' }
const page = { path: route.path, title: 'Button 按钮', description: '按钮文档' }
const navigation = [{ title: '按钮', path: '/components/button', children: [{ title: page.title, path: page.path }] }]

// 执行真实取数组合式函数；仅替换数据库与页面展示，保留异步返回和组件级导航注入。
Object.assign(globalThis, vue, {
  useRoute: () => route,
  definePageMeta: () => {},
  useSeoMeta: () => {},
  defineOgImageComponent: () => {},
  useRequestEvent: () => undefined,
  useDocusI18n: () => ({ locale: shallowRef('en'), isEnabled: shallowRef(false), t: value => value }),
  queryCollection: () => ({ path: () => ({ first: async () => page }) }),
  queryCollectionItemSurroundings: async () => [],
  useAsyncData: (_key, handler) => {
    const state = { data: shallowRef(), error: shallowRef() }
    return Object.assign(Promise.resolve().then(handler).then(value => {
      state.data.value = value
      return state
    }), state)
  },
})

async function loadPage(file, server) {
  const entry = path.resolve(file)
  const result = await build({
    stdin: { contents: `export {default as Page} from ${JSON.stringify(entry)}; export {useDocsPageData} from './app/composables/useDocsPageData'; export {navigationKey} from './app/utils/docsNavigation';`, resolveDir: process.cwd() },
    bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external',
    alias: { '~': path.resolve('app'), '@nuxt/content/utils': path.resolve('node_modules/@nuxt/content/dist/runtime/utils/index.js') },
    plugins: [{ name: 'nuxt-page-context', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, ({ path: filename }) => {
        const { descriptor } = parse(readFileSync(filename, 'utf8'), { filename })
        let code = compileScript(descriptor, { id: filename, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') } }).content
        // Nuxt 的服务端转换把 Vue 的 await 包装替换为其真实 asyncContext 实现。
        if (server) code = `${code.replace('withAsyncContext as _withAsyncContext', 'withAsyncContext as unusedAsyncContext')}\nconst _withAsyncContext = globalThis.nuxtPageAsyncContext;`
        return { contents: code, loader: 'ts', resolveDir: path.dirname(filename) }
      })
    } }],
  })
  const module = { exports: {} }
  runInThisContext(`(function(module,exports,require){${result.outputFiles[0].text}\n})`)(module, module.exports, createRequire(import.meta.url))
  return module.exports
}

globalThis.nuxtPageAsyncContext = withAsyncContext

function createPageApp(loaded) {
  globalThis.useDocsPageData = loaded.useDocsPageData
  const DocsPage = defineComponent({ props: ['headline'], setup: props => () => h('article', [h('header', props.headline ? h('p', { 'data-headline': '' }, props.headline) : null)]) })
  const app = createSSRApp(defineComponent({ setup() {
    provide(loaded.navigationKey, readonly(shallowRef(navigation)))
    return () => h(Suspense, null, { default: () => h(loaded.Page) })
  } }))
  // Nuxt withAsyncContext 通过此入口调用 Vue app.runWithContext，重现应用上下文遮蔽组件注入。
  app.$nuxt = { runWithContext: fn => app.runWithContext(fn) }
  app.component('DocsPage', DocsPage)
  app.component('Landing', defineComponent({ render: () => h('div') }))
  for (const name of ['UPage', 'UPageBody']) app.component(name, defineComponent({ setup: (_props, { slots }) => () => h('div', slots.default?.()) }))
  return app
}

for (const file of ['app/pages/[...slug].vue', 'app/pages/index.vue', 'app/pages/[[lang]]/[...slug].vue', 'app/pages/[[lang]]/index.vue']) {
  it(`${file} 在 Nuxt SSR await 上下文中保留导航分类并无差异水合`, async () => {
    const server = await loadPage(file, true)
    const html = await renderToString(createPageApp(server))
    assert.match(html, /data-headline[^>]*>按钮<\/p>/, 'SSR 必须在首帧输出导航分类')
    const client = await loadPage(file, false)
    const root = document.createElement('div')
    root.innerHTML = html
    document.body.append(root)
    const app = createPageApp(client)
    const warnings = []
    app.config.warnHandler = message => warnings.push(message)
    const previousError = console.error
    console.error = (...args) => warnings.push(args.join(' '))
    try {
      app.mount(root)
      await new Promise(resolve => setTimeout(resolve, 0))
      await nextTick()
      assert.equal(root.querySelector('[data-headline]')?.textContent, '按钮')
      assert.deepEqual(warnings, [])
    }
    finally {
      console.error = previousError
      app.unmount()
      root.remove()
    }
  })
}
