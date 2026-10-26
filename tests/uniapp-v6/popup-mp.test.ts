/**
 * RebornPopup / RebornPopupPanel 小程序模板回归：
 * 1. 只传 title、不写 #header 时，小程序端标题必须渲染（编译器会把转发的 header 插槽一律记为已传入，
 *    Panel 的 $slots.header 恒为真，不能再靠插槽后备内容兜底）。
 * 2. Panel 转发拖拽手势不能用 touchstart 等原生同名事件，否则内容区冒泡上来的原生触摸会被当成下拉关闭。
 */
import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- 沿用仓库可直接执行的 Node 回归测试宿主。
import test from 'node:test'
import { bindWxml, compileMpTemplate, findTags, renderWxml } from './mp-template'

const rootClass = new Proxy({}, { get: (_, key) => () => `rc-${String(key)}` })

function panelCtx(overrides: Record<string, any>) {
  return {
    modal: true, model: true, zIndex: 1, lockScroll: true, duration: 300, panelDuration: 300,
    overlayStyle: '', panelStyle: '', lazyRender: true, transitionName: 'slide-up', rootClass,
    swipeClose: true, showHeader: true, showClose: true, title: '标题T', hasHeaderSlot: false,
    emit: () => {},
    ...overrides,
  }
}

test('小程序 Panel：未写 #header 时即使 $slots.header 恒为真也渲染 title，写了则只渲染插槽', () => {
  const panel = compileMpTemplate('reborn-popup/RebornPopupPanel.vue')
  // 小程序端由使用方 u-s 生成的 $slots：Popup 无条件转发 header，Panel 这里永远拿到 header
  const $slots = { header: true, d: true }
  for (const swipeClose of [true, false]) {
    const withoutSlot = renderWxml(panel.wxml, { ...panel.render(panelCtx({ swipeClose, hasHeaderSlot: false })), $slots })
    assert.ok(withoutSlot.includes('标题T'), `swipeClose=${swipeClose} 只传 title 时标题必须可见：${withoutSlot.join(' | ')}`)
    assert.ok(!withoutSlot.includes('slot:header'), '未写 #header 时不应输出 header 插槽')

    const withSlot = renderWxml(panel.wxml, { ...panel.render(panelCtx({ swipeClose, hasHeaderSlot: true })), $slots })
    assert.ok(withSlot.includes('slot:header'), `swipeClose=${swipeClose} 写了 #header 时应渲染插槽`)
    assert.ok(!withSlot.includes('标题T'), '写了 #header 时不应再渲染 title 兜底')
  }
  assert.doesNotMatch(panel.wxml, /\$slots\.header/, 'Panel 的 WXML 不能依赖小程序端不准确的 $slots.header')
})

test('小程序 Popup：has-header-slot 取自使用方的 $slots，两个 Panel 分支一致', () => {
  const popup = compileMpTemplate('reborn-popup/RebornPopup.vue')
  const panels = findTags(popup.wxml, 'reborn-popup-panel')
  assert.equal(panels.length, 2, 'rootPortal 开 / 关各一处 Panel')
  for (const rootPortal of [true, false]) {
    for (const header of [false, true]) {
      const data = popup.render(new Proxy({
        actualRootPortal: rootPortal, rootClass, $slots: header ? { header: true, d: true } : { d: true },
      }, { get: (target: any, key) => key in target ? target[key] : undefined, has: () => true }))
      const tag = panels[rootPortal ? 0 : 1]!
      const props = bindWxml(tag['u-p']!, data)
      assert.equal(props['has-header-slot'], header, `rootPortal=${rootPortal} 使用方${header ? '写了' : '未写'} #header`)
    }
  }
})

test('小程序 Popup：Panel 的拖拽转发事件不与原生触摸事件同名', () => {
  const popup = compileMpTemplate('reborn-popup/RebornPopup.vue')
  for (const tag of findTags(popup.wxml, 'reborn-popup-panel')) {
    const names = Object.keys(tag)
    assert.deepEqual(names.filter(name => /^(?:capture-)?(?:bind|catch):?touch/i.test(name)), [], `Panel 标签上不能绑定原生同名触摸事件：${names.join(' ')}`)
    for (const name of ['bindswipeStart', 'bindswipeMove', 'bindswipeEnd', 'bindswipeCancel']) {
      assert.ok(names.includes(name), `缺少 ${name}`)
    }
  }
})

test('H5 Popup：只传 title 显示标题，写了 #header 只显示插槽内容', async () => {
  const { fixture, find, loadComponent, mount } = await import('../uniapp-u1/harness')
  fixture()
  const { h } = await import('vue')
  const Popup = await loadComponent('reborn-popup/RebornPopup.vue', ['reborn-popup/RebornPopupPanel.vue'])
  const texts = (root: any) => find(root, (n: any) => n.type === '#text' || typeof n.text === 'string').map((n: any) => n.text).filter(Boolean)
  for (const rootPortal of [false, true]) {
    const plain = await mount(Popup, { modelValue: true, title: '标题T', rootPortal })
    assert.ok(texts(plain.root).includes('标题T'), `rootPortal=${rootPortal} 只传 title 时 H5 应显示标题`)
    plain.unmount()
    const custom = await mount(Popup, { modelValue: true, title: '标题T', rootPortal }, { header: () => h('text', '自定义头部') })
    const content = texts(custom.root)
    assert.ok(content.includes('自定义头部'), `rootPortal=${rootPortal} 写了 #header 应显示插槽`)
    assert.ok(!content.includes('标题T'), '写了 #header 时不再显示 title')
    custom.unmount()
  }
})
