/**
 * RebornBreadcrumb（UniApp）小程序回归：
 * 1. routes 模式下 Breadcrumb 向子条目转发 #separator。小程序编译器把转发的具名插槽一律记为已传入，
 *    子条目的 $slots.separator 恒为真，分隔符兜底必须放在 Breadcrumb 这一层，否则使用方没写 #separator 时分隔符消失。
 * 2. 小程序插槽模式下挂载后新增条目且未逐项传 order 时，开发态提示一次。
 */
import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- 沿用仓库可直接执行的 Node 回归测试宿主。
import test from 'node:test'
import { h, nextTick, reactive } from 'vue'
import { fixture, loadComponent, mount } from '../uniapp-u1/harness'
import { compileMpTemplate, findTags, renderWxml } from './mp-template'

const tick = async () => { await nextTick(); await nextTick() }
const ui = new Proxy({}, { get: (_, key) => () => `ui-${String(key)}` })

function renderBreadcrumb($slots: Record<string, boolean>) {
  const template = compileMpTemplate('reborn-breadcrumb/RebornBreadcrumb.vue')
  const props = { routes: [{ label: '首页', path: '/a' }, { label: '列表', path: '/b' }], separator: '/', separatorIcon: undefined }
  const ctx = new Proxy({ props, ui, $slots, isCollapsing: false, hrefOf: () => undefined, pathsOf: () => [], emit: () => {} } as Record<string, any>, {
    get: (target, key: string) => target[key],
  })
  return { template, output: renderWxml(template.wxml, { ...template.render(ctx), $slots }) }
}

test('小程序 Breadcrumb routes 模式：未写 #separator 时转发内容自带分隔符兜底', () => {
  const { template, output } = renderBreadcrumb({ d: true })
  const items = findTags(template.wxml, 'reborn-breadcrumb-item')
  assert.equal(items.length, 1, 'v-for 渲染的子条目标签')
  assert.match(items[0]!['u-s']!, /separator/, '小程序编译器把转发的 separator 记为已传入，子条目必然渲染插槽而非自身后备内容')
  // 每个子条目转发进来的 separator 插槽内容里必须有分隔符文字
  assert.deepEqual(output.filter(text => text === '/').length, 2, `子条目 separator 插槽内容应含分隔符：${output.join(' | ')}`)
  assert.ok(!output.includes('slot:separator'), '使用方没写 #separator 时不应转发空插槽')
})

test('小程序 Breadcrumb routes 模式：写了 #separator 时转发使用方插槽', () => {
  const { output } = renderBreadcrumb({ d: true, separator: true })
  assert.ok(output.includes('slot:separator'))
  assert.ok(!output.includes('/'))
})

test('小程序 Breadcrumb 插槽模式：挂载后新增条目且未全部传 order 时开发态提示一次', async () => {
  fixture()
  const Breadcrumb = await loadComponent('reborn-breadcrumb/RebornBreadcrumb.vue', [], 'uniapp', 'MP-WEIXIN')
  const Item = await loadComponent('reborn-breadcrumb/RebornBreadcrumbItem.vue', [], 'uniapp', 'MP-WEIXIN')
  const warnings: string[] = []
  const original = console.warn
  console.warn = (message: string) => warnings.push(String(message))
  try {
    const plain = reactive(['甲', '丙'])
    const loose = await mount(Breadcrumb, {}, { default: () => plain.map(id => h(Item, { key: id }, { default: () => h('text', id) })) })
    assert.equal(warnings.length, 0, '首次挂载不提示')
    plain.splice(1, 0, '乙')
    await tick()
    plain.push('丁')
    await tick()
    assert.equal(warnings.filter(text => text.includes('[RebornBreadcrumb]')).length, 1, '漏传 order 的插入只提示一次')
    loose.unmount()

    warnings.length = 0
    const ordered = reactive([{ id: '甲', order: 0 }, { id: '丙', order: 2 }])
    const strict = await mount(Breadcrumb, {}, { default: () => ordered.map(item => h(Item, { key: item.id, order: item.order }, { default: () => h('text', item.id) })) })
    ordered.splice(1, 0, { id: '乙', order: 1 })
    await tick()
    assert.equal(warnings.length, 0, '逐项传了 order 时不提示')
    strict.unmount()
  }
  finally {
    console.warn = original
  }
})
