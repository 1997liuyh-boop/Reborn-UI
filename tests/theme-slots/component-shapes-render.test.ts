import type {ViteDevServer} from 'vite';
import type {Component} from 'vue';
/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict'
import { after, before, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { renderToString } from '@vue/server-renderer'
import { createServer  } from 'vite'
import {  createSSRApp, h } from 'vue'

let server: ViteDevServer
let Button: Component
let Badge: Component

before(async () => {
  server = await createServer({
    configFile: false,
    plugins: [vue()],
    resolve: { alias: { '~': fileURLToPath(new URL('../../app', import.meta.url)) } },
    server: { middlewareMode: true, watch: null, hmr: { port: 0 } },
    optimizeDeps: { noDiscovery: true, include: [] },
    appType: 'custom',
  })
  Button = (await server.ssrLoadModule('/app/components/reborn/ui/reborn-button/RebornButton.vue')).default
  Badge = (await server.ssrLoadModule('/app/components/reborn/ui/reborn-badge/RebornBadge.vue')).default
})

after(async () => { await server?.close() })

/** 使用真实组件和主题渲染，验证布尔参数确实传入样式构建器。 */
async function render(component: Component, props: Record<string, unknown>, slots?: Record<string, () => unknown>, groupSize?: string) {
  const app = createSSRApp({ render: () => h(component, props, slots) })
  app.component('Icon', { render: () => h('svg', { 'data-close-icon': '' }) })
  if (groupSize) app.provide('rebornForm', { props: { size: groupSize } })
  return renderToString(app)
}

it('Button 声明独立形状参数，描边圆形不变为实底配色', async () => {
  const html = await render(Button, { variant: 'outlined', circle: true, round: true, label: '加' })
  assert.match(html, /!rounded-full/)
  assert.match(html, /!w-\[var\(--height-button-md\)\]/)
  assert.doesNotMatch(html, / circle[= >]/)
  assert.doesNotMatch(html, /bg-primary[ "]/)
})

it('Button text 圆形及 Badge 圆形继承表单尺寸', async () => {
  for (const [component, name, variant] of [[Button, 'button', 'text'], [Badge, 'badge', 'soft']] as const) {
    const html = await render(component, { circle: true, variant, size: 'sm', label: '1' }, undefined, 'lg')
    assert.ok(html.includes(`!w-[var(--height-${  name  }-lg)]`))
    assert.ok(html.includes(`!h-[var(--height-${  name  }-lg)]`))
    assert.doesNotMatch(html, /!h-auto/)
  }
})

it('圆形按钮加载时禁用，并用加载动画替换原图标', async () => {
  const html = await render(Button, { circle: true, variant: 'outlined', loading: true }, { default: () => h('svg', { 'data-original-icon': '' }) })
  assert.match(html, /<button disabled/)
  assert.doesNotMatch(html, /data-original-icon/)
  assert.match(html, /rb-loading/)
})

it('新形状参数沿用 Filled / Outlined / Text 的禁用灰阶文字', async () => {
  for (const variant of ['filled', 'outlined', 'text']) {
    const html = await render(Button, { variant, circle: true, disabled: true, label: '加' })
    assert.match(html, /text-gray-5/)
    assert.match(html, /cursor-not-allowed/)
  }
  const legacy = await render(Button, { variant: 'round', disabled: true, label: '兼容' })
  assert.match(legacy, /text-white\/50/)
})

it('圆形 Badge 保留数字零，纯图标不插入空标签', async () => {
  const zero = await render(Badge, { circle: true, label: 0 })
  assert.match(zero, /<span>0<\/span>/)
  const icon = await render(Badge, { circle: true }, { leading: () => h('svg', { 'data-leading-icon': '' }) })
  assert.match(icon, /data-leading-icon/)
  assert.doesNotMatch(icon, /truncate/)
  assert.ok(icon.includes('!w-[var(--height-badge-md)]'))
})

it('Badge 形状不影响默认内容和关闭插槽', async () => {
  const html = await render(Badge, { circle: true, closable: true, label: '被覆盖' }, { default: () => '9' })
  assert.doesNotMatch(html, /被覆盖/)
  assert.match(html, />9</)
  assert.match(html, /data-close-icon/)
})
