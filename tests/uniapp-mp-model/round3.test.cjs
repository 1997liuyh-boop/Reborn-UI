const assert = require('node:assert/strict')
const test = require('node:test')
const { load, mount } = require('./harness.cjs')

for (const throughSlot of [false, true]) test(`延迟 native uP 与缓存序号变化，无 observer dirty 仍接管（插槽=${throughSlot}）`, async () => {
  const fixture = await mount('reborn-collapse/RebornCollapse.vue', 'modelValue', {}, 'collapse', false, throughSlot, { deferNative: true })
  try {
    fixture.state.show()
    await fixture.flush()
    let updates = 0
    fixture.runtime.onBeforeUpdate(() => updates++, fixture.child.$)
    const wrapperRenders = fixture.wrapperRenders
    fixture.enablePrefix()
    await fixture.update({ ...fixture.child.$.props, modelValue: undefined })
    assert.equal(updates, 0)
    assert.equal(fixture.value, true)
    fixture.publishNative()
    assert.equal(updates, 0, 'native observer 无 dirty，不能依靠子级 beforeUpdate')
    await fixture.flush()
    assert.equal(fixture.value, false)
    assert.equal(fixture.rendered, false)
    assert.equal(fixture.wrapperRenders, wrapperRenders)
    assert.deepEqual(fixture.warnings, [])
  } finally { fixture.close() }
})

test('同模块不同父级隔离，等待中的原生回调在最后子项卸载后不刷新', async () => {
  const loaded = await load('reborn-collapse/RebornCollapse.vue')
  const first = await mount('reborn-collapse/RebornCollapse.vue', 'modelValue', {}, 'collapse', false, false, { loaded, deferNative: true })
  const second = await mount('reborn-collapse/RebornCollapse.vue', 'modelValue', {}, 'collapse', false, false, { loaded, deferNative: true })
  try {
    first.state.show()
    second.state.show()
    first.enablePrefix()
    await first.update({ ...first.child.$.props, modelValue: undefined })
    first.publishNative()
    await first.flush()
    assert.equal(first.value, false)
    assert.equal(second.value, true)
    second.enablePrefix()
    await second.update({ ...second.child.$.props, modelValue: undefined })
    second.removeChild()
    assert.equal(second.parent.$.u.length, 0)
    second.publishNative()
    await second.flush()
    assert.equal(second.state.collapse.value, true)
    assert.deepEqual([...first.warnings, ...second.warnings], [])
  } finally { first.close(); second.close() }
})

const components = [
  ['reborn-popover/RebornPopover.vue', 'open', 'showPopover', 'open', false, 'defaultOpen'],
  ['reborn-slide-verify/RebornSlideVerify.vue', 'modelValue', 'verified', 'completeVerify', false, 'defaultVerified'],
  ['reborn-popup/RebornPopup.vue', 'modelValue', 'model', 'close', true],
  ['reborn-signature/RebornSignatureLandscape.vue', 'show', 'show', 'close', true],
]

for (const [file, name, stateName, action, initial, defaultName] of components) {
  test(`${file} 真实公开动作、拒收重复目标、接收与初始化`, async () => {
    const fixture = await mount(file, name, { [name]: initial }, stateName)
    try {
      assert.deepEqual(fixture.events, [])
      fixture.state[action]()
      fixture.state[action]()
      await fixture.flush()
      assert.deepEqual(fixture.events, [!initial, !initial])
      assert.equal(fixture.value, initial)
      fixture.accept(true)
      fixture.state[action]()
      await fixture.flush()
      assert.equal(fixture.value, !initial)
      assert.deepEqual(fixture.warnings, [])
    } finally { fixture.close() }
  })

  test(`${file} 缺省、显式空值/false、绑定移除`, async () => {
    const fixture = await mount(file, name, {}, stateName)
    try {
      assert.equal(!!fixture.value, false)
      fixture.state[stateName].value = true
      await fixture.flush()
      for (const value of [undefined, null, false]) {
        await fixture.update({ [name]: value })
        assert.equal(fixture.value, false)
        fixture.state[stateName].value = true
        assert.equal(fixture.value, false)
      }
      await fixture.update({})
      assert.equal(fixture.value, true)
      assert.deepEqual(fixture.warnings, [])
    } finally { fixture.close() }
    if (defaultName) for (const binding of [{ [defaultName]: true }, { [defaultName]: true, [name]: undefined }, { [defaultName]: true, [name]: null }, { [defaultName]: true, [name]: false }]) {
      const defaults = await mount(file, name, binding, stateName)
      try {
        assert.equal(defaults.value, !Object.hasOwn(binding, name))
        assert.deepEqual(defaults.events, [])
        assert.deepEqual(defaults.warnings, [])
      } finally { defaults.close() }
    }
  })
}
