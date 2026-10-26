/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { JSDOM } from 'jsdom'
import { createFixture, loadComponent } from '../uniapp-u3/harness.mjs'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' })
for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node', 'Event']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] })
}
const vue = await import('vue')
after(() => dom.window.close())

for (const [file, name, stateName, fallback] of [
  ['reborn-chip/RebornChip.vue', 'show', 'show', true],
  ['reborn-fab/RebornFab.vue', 'modelValue', 'isActive', false],
  ['reborn-overlay/RebornOverlay.vue', 'modelValue', 'model', false],
]) test(`Uni H5 ${file} 缺省、显式空值、父级拒收/接收与移除`, async () => {
  const fixture = createFixture(vue)
  fixture.autoQuery = false
  const { component } = await loadComponent(file)
  const binding = vue.shallowRef({})
  const events = []
  const warnings = []
  let accepting = false
  const host = document.createElement('div')
  const app = vue.createApp({ setup: () => () => vue.h(component, { ...binding.value, [`onUpdate:${name}`]: value => { events.push(value); if (accepting) binding.value = { [name]: value } } }) })
  app.config.warnHandler = message => warnings.push(message)
  app.mount(host)
  const state = fixture.capture[0][stateName]
  try {
    assert.equal(state.value, fallback)
    assert.deepEqual(events, [])
    if (!file.includes('chip')) state.value = !fallback
    await vue.nextTick()
    const local = state.value
    for (const empty of [undefined, null]) {
      binding.value = { [name]: empty }
      await vue.nextTick()
      assert.equal(state.value, false)
      if (!file.includes('chip')) {
        events.length = 0
        state.value = true
        state.value = true
        assert.deepEqual(events, [true, true])
        assert.equal(state.value, false)
        accepting = true
        state.value = true
        await vue.nextTick()
        assert.equal(state.value, true)
        accepting = false
      }
    }
    binding.value = {}
    await vue.nextTick()
    assert.equal(state.value, local)
    assert.deepEqual(warnings, [])
  } finally { app.unmount() }
})
