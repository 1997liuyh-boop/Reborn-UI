const assert = require('node:assert/strict')
const test = require('node:test')
const { mount } = require('./harness.cjs')

const cases = [
  ['reborn-alert/RebornAlert.vue', 'show', 'show', true],
  ['reborn-badge/RebornBadge.vue', 'show', 'show', true],
  ['reborn-badge/RebornBadge.vue', 'checked', 'checked', false],
  ['reborn-collapse/RebornCollapse.vue', 'modelValue', 'collapse', false],
  ['reborn-chip/RebornChip.vue', 'show', 'show', true],
  ['reborn-fab/RebornFab.vue', 'modelValue', 'isActive', false],
  ['reborn-overlay/RebornOverlay.vue', 'modelValue', 'model', false],
]

for (const [file, name, state, fallback] of cases) {
  test(`${file} ${name} 使用实际父编译、缓存、observer 与事件桥接管模型`, async () => {
    const fixture = await mount(file, name, {}, state)
    try {
      assert.equal(fixture.runtime.version, '3.4.21')
      assert.equal(fixture.child.$.subTree, null)
      assert.equal(!!fixture.value, fallback)
      assert.deepEqual(fixture.events, [], '初始化不得发模型事件')
      if (!file.includes('chip')) fixture.state[state].value = !fallback
      await fixture.flush()
      const local = !!fixture.value
      for (const empty of [undefined, null]) {
        await fixture.update({ [name]: empty })
        assert.equal(fixture.rendered, false, '显式空值必须使实际 setData 视图关闭')
        assert.equal(!!fixture.value, false)
        if (!file.includes('chip')) {
          fixture.events.length = 0
          fixture.state[state].value = true
          fixture.state[state].value = true
          assert.deepEqual(fixture.events, [true, true], '父级拒收后重复相同目标也派发')
          assert.equal(!!fixture.value, false)
          fixture.accept(true)
          fixture.state[state].value = true
          await fixture.flush()
          assert.equal(fixture.rendered, true)
          fixture.accept(false)
        }
      }
      await fixture.update({})
      assert.equal(!!fixture.value, local, '移除绑定恢复本地状态')
      assert.equal(fixture.rendered, local)
      assert.deepEqual(fixture.warnings, [])
    } finally { fixture.close() }
  })
}

test('Fab active 只提供初始值，显式空模型优先且零初始化事件', async () => {
  for (const binding of [{ active: true }, { active: true, modelValue: undefined }, { active: true, modelValue: null }]) {
    const fixture = await mount('reborn-fab/RebornFab.vue', 'modelValue', binding, 'isActive')
    try {
      assert.equal(!!fixture.value, !Object.hasOwn(binding, 'modelValue'))
      assert.deepEqual(fixture.events, [])
      assert.deepEqual(fixture.warnings, [])
    } finally { fixture.close() }
  }
})

test('显式连字符模板模型经过真实编译与 native 事件桥', async () => {
  const fixture = await mount('reborn-collapse/RebornCollapse.vue', 'modelValue', { modelValue: undefined }, 'collapse', true)
  try {
    assert.match(fixture.parentCode, /\['model-value'\]/)
    fixture.state.show()
    fixture.state.show()
    assert.deepEqual(fixture.events, [true, true])
    assert.equal(fixture.value, false)
    fixture.accept(true)
    fixture.state.show()
    await fixture.flush()
    assert.equal(fixture.rendered, true)
    assert.deepEqual(fixture.warnings, [])
  } finally { fixture.close() }
})

test('同父多模型与多子项只登记一个更新钩子，卸载解除，独立父级隔离', async () => {
  const first = await mount('reborn-badge/RebornBadge.vue', 'checked', {}, 'checked')
  const second = await mount('reborn-badge/RebornBadge.vue', 'checked', {}, 'checked')
  try {
    const sibling = first.addSibling()
    assert.equal(first.parent.$.u.length, 1)
    first.state.checked.value = true
    sibling.state.checked.value = true
    second.state.checked.value = true
    await first.update({ checked: undefined })
    assert.equal(first.value, false)
    assert.equal(sibling.state.checked.value, false)
    assert.equal(second.value, true)
    first.removeChild()
    assert.equal(first.parent.$.u.length, 1)
    first.removeSibling()
    assert.equal(first.parent.$.u.length, 0)
    await first.update({ checked: true })
    assert.equal(sibling.state.checked.value, false, '已卸载实例不再刷新')
    assert.deepEqual([...first.warnings, ...second.warnings], [])
  } finally { first.close(); second.close() }
})

test('祖先拥有的实际编译插槽在中间组件未更新时仍接管 undefined，卸载清理祖先订阅', async () => {
  const fixture = await mount('reborn-collapse/RebornCollapse.vue', 'modelValue', {}, 'collapse', false, true)
  try {
    assert.match(fixture.parentCode, /TestWrapper/)
    assert.equal(fixture.child.$.parent, fixture.wrapper.$)
    fixture.state.show()
    await fixture.flush()
    assert.equal(fixture.rendered, true)
    const renders = fixture.wrapperRenders
    assert.equal(fixture.child.$.props.modelValue, undefined)
    await fixture.update({ modelValue: undefined })
    assert.equal(fixture.child.$.props.modelValue, undefined, '原生解析值相同，只有绑定存在性变化')
    assert.equal(Object.hasOwn(fixture.child.$.vnode.props, 'modelValue'), false, '原始 VNode 仍保持挂载时的属性')
    assert.equal(fixture.wrapperRenders, renders, '中间组件没有更新，由插槽所有者刷新')
    assert.equal(fixture.rendered, false)
    fixture.state.show()
    fixture.state.show()
    assert.deepEqual(fixture.events, [true, true, true])
    assert.equal(fixture.value, false)
    await fixture.update({})
    assert.equal(fixture.rendered, true)
    fixture.removeChild()
    assert.equal(fixture.wrapper.$.u.length, 0)
    assert.equal(fixture.parent.$.u.length, 0)
    assert.deepEqual(fixture.warnings, [])
  } finally { fixture.close() }
})
