/* eslint test/no-import-node-test: off -- 使用项目现有的 Node 测试运行器 */
import type { Component, Ref } from 'vue'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { after, it } from 'node:test'
import { runInThisContext } from 'node:vm'
import { compileScript, parse } from '@vue/compiler-sfc'
import { build } from 'esbuild'
import { installDom, loadAppModule, wait } from '../composables/harness'

const dom = installDom()
const vue = await import('vue')
Object.assign(globalThis, vue)
const { createApp, defineComponent, h, nextTick, ref } = vue
after(() => dom.window.close())

/** 只替换底层控件，执行真实演练场的模型和异步显隐逻辑。 */
async function loadPlayground() {
  const result = await build({
    entryPoints: ['app/components/common/play-ground/Playground.vue'], bundle: true, write: false,
    format: 'cjs', platform: 'node', packages: 'external', alias: { '~': path.resolve('app') },
    plugins: [{ name: 'playground-fixture', setup(builder) {
      builder.onResolve({ filter: /~\/components\/reborn\/ui\// }, args => ({ path: path.basename(args.path, '.vue'), namespace: 'fixture' }))
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: `const {defineComponent,h}=require('vue');export default defineComponent({inheritAttrs:false,props:['modelValue'],emits:['update:modelValue'],setup(props,{emit,slots}){return()=>h('button',{'data-control':${JSON.stringify(args.path)},onClick:()=>emit('update:modelValue','changed')},slots.default?.())}})`, loader: 'js', resolveDir: path.resolve('.') }))
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

const Playground = await loadPlayground()

it('演练场较早的异步 hide 结果不会覆盖较新的控件状态', async () => {
  const pending: Array<(value: boolean) => void> = []
  const model = ref({ value: 'first' })
  const controls = [{ title: '设置', children: [{ key: 'value', label: '测试控件', component: 'input', hide: () => new Promise<boolean>(resolve => pending.push(resolve)) }] }]
  const root = document.createElement('div')
  document.body.append(root)
  const app = createApp({ render: () => h(Playground, { modelValue: model.value, controls }) })
  app.config.warnHandler = () => {}
  app.mount(root)
  try {
    assert.equal(pending.length, 1, '挂载时只计算一次')
    model.value = { value: 'second' }
    await nextTick()
    pending[1]!(false)
    await wait()
    pending[0]!(true)
    await wait()
    assert.ok(root.querySelector('[data-control="RebornInput"]'), '旧请求不得把当前控件隐藏')
  }
  finally { app.unmount(); root.remove() }
})

it('演练场字段更新通过模型发出新对象并保留其他字段', async () => {
  const model = ref({ value: 'first', sibling: 'preserved' })
  const original = model.value
  const root = document.createElement('div')
  document.body.append(root)
  const controls = [{ title: '设置', children: [{ key: 'value', label: '测试控件', component: 'input' }] }]
  const app = createApp({ render: () => h(Playground, { modelValue: model.value, controls, 'onUpdate:modelValue': value => { model.value = value } }) })
  app.config.warnHandler = () => {}
  app.mount(root)
  try {
    root.querySelector<HTMLButtonElement>('[data-control="RebornInput"]')!.click()
    await nextTick()
    assert.deepEqual(model.value, { value: 'changed', sibling: 'preserved' })
    assert.equal(original.value, 'first')
  }
  finally { app.unmount(); root.remove() }
})

it('iframe 卸载后取消延迟主题补发', async () => {
  const colorMode = ref('dark')
  Object.assign(globalThis, { useColorMode: () => colorMode })
  const { useDemoFrameTheme } = await loadAppModule<typeof import('../../app/composables/useDemoFrameTheme')>('app/composables/useDemoFrameTheme.ts')
  const sent: unknown[] = []
  let notify!: () => void
  const frame = ref({ contentWindow: { postMessage: (message: unknown) => sent.push(message) } })
  const app = createApp(defineComponent({ setup() {
    notify = useDemoFrameTheme(frame as unknown as Readonly<Ref<HTMLIFrameElement>>).onFrameLoad
    return () => h('div')
  } }))
  app.mount(document.createElement('div'))
  notify()
  assert.deepEqual(sent, [{ type: 'theme-change', theme: 'dark' }])
  app.unmount()
  await wait(650)
  assert.equal(sent.length, 1)
})
