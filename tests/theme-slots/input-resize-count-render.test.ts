/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { ViteDevServer } from 'vite'
import type { Component } from 'vue'
import assert from 'node:assert/strict'
import { after, before, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { renderToString } from '@vue/server-renderer'
import { createServer } from 'vite'
import { createSSRApp, h } from 'vue'

let server: ViteDevServer
let Input: Component
before(async () => {
  server = await createServer({
    configFile: false,
    plugins: [vue()],
    resolve: { alias: { '~': fileURLToPath(new URL('../../app', import.meta.url)) } },
    server: { middlewareMode: true, watch: null, hmr: { port: 0 } },
    optimizeDeps: { noDiscovery: true, include: [] },
    appType: 'custom',
  })
  Input = (await server.ssrLoadModule('/app/components/reborn/ui/reborn-input/RebornInput.vue')).default
})
after(async () => { await server?.close() })

async function render(props: Record<string, unknown>) {
  return renderToString(createSSRApp({
    render: () => h(Input, {
      type: 'textarea', resize: 'vertical', showWordLimit: true, maxlength: 100, modelValue: '测试', ...props,
    }),
  }))
}
for (const resize of ['vertical', 'horizontal', 'both']) {
  it(`${resize} 与内置统计组合接通布局修复并保留原生拖拽方向`, async () => {
    const html = await render({ resize })
    assert.match(html, /px-0!/)
    assert.match(html, /<textarea[^>]*class="[^"]*pb-6/)
    assert.match(html, /<span[^>]*class="[^"]*right-6/)
    assert.ok(html.includes(`resize:${resize}`))
    assert.match(html, /2 \/ 100/)
  })
}
for (const [name, props] of [
  ['不可拖拽', { resize: 'none' }],
  ['未指定拖拽方向', { resize: undefined }],
  ['外置统计', { wordLimitPosition: 'outside' }],
  ['不展示统计', { showWordLimit: false }],
  ['没有字数上限', { maxlength: undefined }],
  ['单行输入框', { type: 'text' }],
] as const) {
  it(`${name} 不启用布局修复`, async () => {
    const html = await render(props)
    assert.doesNotMatch(html, /px-0!|pb-6|right-6/)
  })
}
it('旧 as 属性和自动高度模式同样支持可拖拽统计布局', async () => {
  const html = await render({ type: 'text', as: 'textarea', autosize: { minRows: 2, maxRows: 5 } })
  assert.match(html, /<textarea[^>]*class="[^"]*pb-6/)
})
