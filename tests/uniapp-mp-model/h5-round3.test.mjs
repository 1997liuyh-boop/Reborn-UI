/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { JSDOM } from 'jsdom'
import { createFixture, loadComponent } from '../uniapp-u3/harness.mjs'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' })
for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node', 'Event']) Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] })
const vue = await import('vue')
after(() => dom.window.close())

const cases = [
  ['reborn-popover/RebornPopover.vue', 'open', 'showPopover', 'open', false, 'defaultOpen'],
  ['reborn-slide-verify/RebornSlideVerify.vue', 'modelValue', 'verified', 'completeVerify', false, 'defaultVerified'],
  ['reborn-popup/RebornPopup.vue', 'modelValue', 'model', 'close', true],
  ['reborn-signature/RebornSignatureLandscape.vue', 'show', 'show', 'close', true],
]

for (const [file, name, stateName, action, initial, defaultName] of cases) test(`H5 ${file} 真实动作与完整模型所有权`, async () => {
  const fixture = createFixture(vue)
  fixture.autoQuery = false
  const { component } = await loadComponent(file)
  const binding = vue.shallowRef({ [name]: initial })
  const events = []
  const warnings = []
  let accepting = false
  const app = vue.createApp({ render: () => vue.h(component, { ...binding.value, [`onUpdate:${name}`]: value => { events.push(value); if (accepting) binding.value = { ...binding.value, [name]: value } } }) })
  app.config.warnHandler = message => warnings.push(message)
  app.mount(document.createElement('div'))
  const state = fixture.capture[0]
  try {
    assert.deepEqual(events, [])
    state[action]()
    state[action]()
    assert.deepEqual(events, [!initial, !initial])
    assert.equal(state[stateName].value, initial)
    accepting = true
    state[action]()
    await vue.nextTick()
    assert.equal(state[stateName].value, !initial)
    accepting = false
    binding.value = {}
    await vue.nextTick()
    assert.equal(state[stateName].value, false)
    state[stateName].value = true
    for (const value of [undefined, null, false]) {
      binding.value = { [name]: value, ...(defaultName ? { [defaultName]: true } : {}) }
      await vue.nextTick()
      assert.equal(state[stateName].value, false)
    }
    binding.value = {}
    await vue.nextTick()
    assert.equal(state[stateName].value, true)
    assert.deepEqual(warnings, [])
  } finally { app.unmount() }
})

for (const [file, name, stateName, , , defaultName] of cases.filter(item => item[5])) test(`H5 ${file} 默认 true 仅用于缺省模型且初始化不发事件`, async () => {
  for (const binding of [{}, { [name]: undefined }, { [name]: null }, { [name]: false }]) {
    const fixture = createFixture(vue)
    fixture.autoQuery = false
    const { component } = await loadComponent(file)
    const events = []
    const warnings = []
    const app = vue.createApp({ render: () => vue.h(component, { ...binding, [defaultName]: true, [`onUpdate:${name}`]: value => events.push(value) }) })
    app.config.warnHandler = message => warnings.push(message)
    app.mount(document.createElement('div'))
    try {
      await vue.nextTick()
      assert.equal(fixture.capture[0][stateName].value, !(name in binding))
      assert.deepEqual(events, [])
      assert.deepEqual(warnings, [])
    } finally { app.unmount() }
  }
})

test('H5 Tabbar 显式 order、无效回退、索引选择与真实点击保持一致', async () => {
  const fixture = createFixture(vue)
  fixture.autoQuery = false
  const { exports: components } = await loadComponent('reborn-tabbar/index.ts', false)
  const entries = vue.shallowRef([{ name: 'a', order: 2 }, { name: 'b', order: 0 }, { name: 'c', order: 1 }])
  const model = vue.shallowRef(1)
  const events = []
  const warnings = []
  const host = document.createElement('div')
  const app = vue.createApp({ render: () => vue.h(components.RebornTabbar, { modelValue: model.value, 'onUpdate:modelValue': value => { model.value = value }, onChange: value => events.push(value) }, () => entries.value.map(item => vue.h(components.RebornTabbarTrigger, { key: item.name, order: item.order, title: item.name }, { default: ({ active }) => vue.h('text', { 'data-title': item.name, 'data-active': String(active) }, item.name) }))) })
  app.config.warnHandler = message => warnings.push(message)
  app.mount(host)
  const selected = () => host.querySelector('[data-active="true"]')?.textContent
  const order = () => [...host.querySelectorAll('.reborn-tabbar-trigger')].sort((a, b) => Number(a.style.order) - Number(b.style.order)).map(node => node.textContent)
  try {
    await vue.nextTick()
    assert.deepEqual(order(), ['b', 'c', 'a'])
    assert.equal(selected(), 'c')
    host.querySelector('[data-title="a"]').parentElement.dispatchEvent(new dom.window.Event('click', { bubbles: true }))
    await vue.nextTick()
    assert.equal(model.value, 2)
    assert.deepEqual(events, [{ value: 2 }])
    assert.equal(selected(), 'a')
    entries.value = [{ name: 'c' }, { name: 'b' }, { name: 'a' }]
    await vue.nextTick()
    await vue.nextTick()
    assert.deepEqual(order(), ['c', 'b', 'a'], '缺省 order 的 H5 按最新 VNode 顺序')
    assert.equal(selected(), 'a')
    assert.deepEqual(warnings, [])
  } finally { app.unmount() }
})
