/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict'
import { after, it } from 'node:test'
import { installDom, loadAppModule, wait } from '../composables/harness'

const dom = installDom()
const { createApp, createSSRApp, Fragment, h, ref } = await import('vue')
const { renderToString } = await import('vue/server-renderer')
const { RebornBreadcrumb: Breadcrumb, RebornBreadcrumbItem: Item } = await loadAppModule<typeof import('../../app/components/reborn/ui/reborn-breadcrumb')>('app/components/reborn/ui/reborn-breadcrumb/index.ts')
after(() => dom.window.close())

it('Web 完整 order 排序与折叠一致，无效或混传回到插槽顺序，重复序位稳定', async () => {
  const orders = ref<Array<number | undefined>>([2, 0, 1])
  const container = document.createElement('div')
  const app = createApp({ render: () => h(Breadcrumb, { maxCount: 2 }, () => h(Fragment, ['a', 'b', 'c'].map((key, index) => h(Item, { key, order: orders.value[index] }, () => key)))) })
  app.component('Icon', { render: () => h('i') })
  app.component('NuxtLink', { render: () => h('a') })
  const warnings: string[] = []
  app.config.warnHandler = message => warnings.push(message)
  app.mount(container)
  const labels = () => [...container.querySelectorAll('.reborn-breadcrumb-item__link')].map(node => ({ label: node.textContent, hidden: node.parentElement!.classList.contains('hidden') }))
  try {
    assert.deepEqual(labels(), [{ label: 'b', hidden: false }, { label: 'c', hidden: true }, { label: 'a', hidden: false }])
    for (const invalid of [undefined, Number.NaN, Number.POSITIVE_INFINITY]) {
      orders.value = [2, invalid, 1]
      await wait()
      assert.deepEqual(labels(), [{ label: 'a', hidden: false }, { label: 'b', hidden: true }, { label: 'c', hidden: false }])
    }
    orders.value = [1, 0, 0]
    await wait()
    assert.deepEqual(labels().map(item => item.label), ['b', 'c', 'a'])
    assert.deepEqual(warnings, [])
  } finally { app.unmount() }
})

it('Web 显式 order 在 SSR 首屏生效，并保留非条目节点的位置', async () => {
  const app = createSSRApp({ render: () => h(Breadcrumb, {}, () => [h(Item, { order: 1 }, () => '后项'), h('em', '说明'), h(Item, { order: 0 }, () => '首项')]) })
  app.component('Icon', { render: () => h('i') })
  app.component('NuxtLink', { render: () => h('a') })
  const warnings: string[] = []
  app.config.warnHandler = message => warnings.push(message)
  const html = await renderToString(app)
  assert.ok(html.indexOf('首项') < html.indexOf('说明'))
  assert.ok(html.indexOf('说明') < html.indexOf('后项'))
  assert.deepEqual(warnings, [])
})

it('Web 条目经异步包装（全局注册 / 运行时编译）或单根包装组件渲染时，order 与 max-count 仍生效', async () => {
  const { defineAsyncComponent } = await import('vue')
  // 站内 /playground 经 resolveComponent 拿到的是 defineAsyncComponent 包装，而不是 RebornBreadcrumbItem 本身
  const AsyncItem = defineAsyncComponent(() => Promise.resolve(Item))
  const Wrapped = { setup: (_: unknown, { slots }: { slots: any }) => () => h(Item, null, slots) }
  for (const Entry of [AsyncItem, Wrapped]) {
    const container = document.createElement('div')
    const app = createApp({ render: () => h(Breadcrumb, { maxCount: 2 }, () => [
      h(Entry, { order: 2 }, () => 'a'), h('em', '说明'), h(Entry, { order: 0 }, () => 'b'), h(Entry, { order: 1 }, () => 'c'),
    ]) })
    app.component('Icon', { render: () => h('i') })
    app.component('NuxtLink', { render: () => h('a') })
    const warnings: string[] = []
    app.config.warnHandler = message => warnings.push(message)
    app.mount(container)
    try {
      await wait()
      await wait()
      const labels = [...container.querySelectorAll('.reborn-breadcrumb-item__link')].map(node => ({ label: node.textContent, hidden: node.parentElement!.classList.contains('hidden') }))
      assert.deepEqual(labels, [{ label: 'b', hidden: false }, { label: 'c', hidden: true }, { label: 'a', hidden: false }])
      // 省略号紧跟首项，普通元素原位保留
      const order = [...container.querySelector('nav')!.children].map(node => node.querySelector('.reborn-breadcrumb-item__link')?.textContent ?? node.tagName.toLowerCase())
      assert.deepEqual(order, ['b', 'div', 'em', 'c', 'a'])
      assert.deepEqual(warnings, [])
    } finally { app.unmount() }
  }
})
