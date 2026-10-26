/**
 * RebornCheckbox（UniApp）空值绑定回归：
 * 独立使用的 Checkbox 绑定 v-model 初值为 null（接口数据、表单重置常见）时不能抛错，按未选中的布尔模式处理，
 * 点击后提交布尔值而不是数组。
 */
import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- 沿用仓库可直接执行的 Node 回归测试宿主。
import test from 'node:test'
import { nextTick, reactive } from 'vue'
import { find, fixture, loadComponent, mount } from '../uniapp-u1/harness'

const tick = async () => { await nextTick(); await nextTick() }

test('UniApp Checkbox：v-model 为 null 时正常渲染为未选中，点击提交布尔值', async () => {
  fixture()
  const Checkbox = await loadComponent('reborn-checkbox/RebornCheckbox.vue')
  const updates: unknown[] = []
  const changes: unknown[] = []
  const props = reactive<Record<string, any>>({
    'modelValue': null,
    'label': '同意协议',
    'onUpdate:modelValue': (value: unknown) => { updates.push(value); props.modelValue = value },
    'onChange': (value: unknown) => changes.push(value),
  })
  const wrapper = await mount(Checkbox, props)
  const root = find(wrapper.root, n => !!n.props.onTap)[0]
  assert.ok(root, 'null 绑定时组件必须正常渲染')
  assert.doesNotMatch(String(root.props.class), /is-checked/)

  root.props.onTap({})
  await tick()
  assert.deepEqual(updates, [true], 'null 按布尔模式切换，不能提交 [value]')
  assert.deepEqual(changes, [true])
  assert.match(String(find(wrapper.root, n => !!n.props.onTap)[0]!.props.class), /is-checked/)

  // 数组绑定仍按多值模式
  props.modelValue = ['a']
  props.value = 'b'
  await tick()
  find(wrapper.root, n => !!n.props.onTap)[0]!.props.onTap({})
  await tick()
  assert.deepEqual(updates.at(-1), ['a', 'b'])
  wrapper.unmount()
})
