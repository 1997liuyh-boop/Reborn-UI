/* eslint test/no-import-node-test: off -- 使用项目现有的 Node 测试运行器 */
import type { Component } from 'vue'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { after, it } from 'node:test'
import { runInThisContext } from 'node:vm'
import { compileScript, parse } from '@vue/compiler-sfc'
import { build } from 'esbuild'
import { installDom } from '../composables/harness'

const dom = installDom()
const vue = await import('vue')
Object.assign(globalThis, vue)
const { createApp, defineComponent, h, nextTick, ref } = vue
after(() => dom.window.close())

/**
 * 打包一个文档站 SFC 并在当前上下文执行。
 * fixtures 按导入路径（原样匹配）替换成测试桩，用来隔离子组件或注入一张假的主题色表。
 */
async function loadSfc(entry: string, fixtures: Record<string, string> = {}) {
  const result = await build({
    entryPoints: [entry], bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external',
    alias: { '~': path.resolve('app') },
    plugins: [{ name: 'site-sfc', setup(builder) {
      builder.onResolve({ filter: /.*/ }, args => args.path in fixtures ? { path: args.path, namespace: 'fixture' } : undefined)
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: fixtures[args.path], loader: 'js', resolveDir: path.resolve('.') }))
      builder.onLoad({ filter: /\.vue$/ }, ({ path: file }) => {
        const { descriptor } = parse(readFileSync(file, 'utf8'), { filename: file })
        return { contents: compileScript(descriptor, { id: file, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') } }).content, loader: 'ts', resolveDir: path.dirname(file) }
      })
    } }],
  })
  const module = { exports: {} as { default: Component } }
  runInThisContext(`(function(module,exports,require){${result.outputFiles[0]!.text}\n})`)(module, module.exports, createRequire(import.meta.url))
  return module.exports.default
}

it('设备档 iframe 的主题预设从 utils/themeColor 的表里查，不另写色系名映射', async () => {
  // 假表里 purple 的预设名与色系名不同：旧写法（只把 blue 换成 brand，其余原样写入）会写成不存在的 purple 预设
  const DemoStage = await loadSfc('app/components/common/demo-stage/DemoStage.vue', {
    '~/utils/themeColor': `export const themeColors = [{ name: 'blue', preset: 'brand' }, { name: 'purple', preset: 'violet' }]`,
  })
  const colorMode = ref('light')
  const themeColor = ref('blue')
  Object.assign(globalThis, {
    useColorMode: () => colorMode,
    useThemeColor: () => themeColor,
    useRuntimeConfig: () => ({ app: { baseURL: '/' } }),
  })
  const root = document.createElement('div')
  document.body.append(root)
  const app = createApp({ render: () => h(DemoStage, { demoName: 'FooDemo', viewport: 'mobile' }) })
  app.mount(root)
  try {
    // jsdom 不加载 iframe 的 src，换成一份空白同源文档，等价于预览页加载完成后的 contentDocument
    const frame = root.querySelector('iframe')!
    const frameDoc = document.implementation.createHTMLDocument('')
    Object.defineProperty(frame, 'contentDocument', { configurable: true, get: () => frameDoc })
    const html = frameDoc.documentElement
    frame.dispatchEvent(new window.Event('load'))
    assert.equal(html.dataset.themeColor, 'brand')

    themeColor.value = 'purple'
    await nextTick()
    assert.equal(html.dataset.themeColor, 'violet')

    // 表里查不到的值回落品牌预设，与外层页面的白名单行为一致
    themeColor.value = 'unknown'
    colorMode.value = 'dark'
    await nextTick()
    assert.equal(html.dataset.themeColor, 'brand')
    assert.ok(html.classList.contains('dark'))
  }
  finally { app.unmount(); root.remove() }
})

it('AI 助手每条消息共用同一份代码块组件与解析选项，不随消息实例各建一份', async () => {
  const MessageItem = await loadSfc('app/components/app/assistant/AppAssistantMessageItem.vue', {
    './AppAssistantMessage.vue': `const { defineComponent, h } = require('vue'); export default defineComponent({ setup(_, { slots }) { return () => h('div', slots.default?.()) } })`,
  })
  const received: { components: Record<string, unknown>, parserOptions: unknown }[] = []
  const MDCCached = defineComponent({
    props: ['value', 'cacheKey', 'components', 'parserOptions'],
    setup(props) {
      received.push({ components: props.components, parserOptions: props.parserOptions })
      return () => h('p', props.value)
    },
  })
  const message = (id: string) => ({ id, role: 'assistant', parts: [{ type: 'text', text: `回答 ${id}`, state: 'done' }] })
  const shared = { userName: '用户', assistantName: '客服机器人', avatar: '', time: '', streaming: false }
  const root = document.createElement('div')
  const app = createApp({ render: () => [h(MessageItem, { ...shared, message: message('a') }), h(MessageItem, { ...shared, message: message('b') })] })
  app.component('MDCCached', MDCCached)
  app.component('AssistantLoading', defineComponent({ render: () => null }))
  app.mount(root)
  try {
    assert.equal(received.length, 2)
    assert.equal(received[0]!.components, received[1]!.components)
    assert.equal(received[0]!.components.pre, received[1]!.components.pre)
    assert.equal(received[0]!.parserOptions, received[1]!.parserOptions)
  }
  finally { app.unmount() }
})
