/**
 * RebornRadioGroup（UniApp）表单重置回归：
 * 受控绑定下用户点选某项后，父级把绑定值置回 undefined（表单重置常见），组内应回到 defaultValue，
 * 不能继续显示上一次点选的项（与 Web 端一致）。
 */
import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- 沿用仓库可直接执行的 Node 回归测试宿主。
import test from 'node:test'
import { nextTick, reactive } from 'vue'
import { find, fixture, loadComponent, mount } from '../uniapp-u1/harness'

const tick = async () => { await nextTick(); await nextTick() }

test('UniApp RadioGroup：点选后父级置回 undefined，选中项回到 defaultValue', async () => {
  fixture()
  const RadioGroup = await loadComponent('reborn-radio/RebornRadioGroup.vue', ['reborn-radio/RebornRadio.vue'])
  const props = reactive<Record<string, any>>({
    'modelValue': undefined,
    'defaultValue': 'a',
    'options': ['a', 'b', 'c'],
    'onUpdate:modelValue': (value: unknown) => { props.modelValue = value },
  })
  const wrapper = await mount(RadioGroup, props)
  const radios = () => find(wrapper.root, n => n.props['data-checked'] !== undefined)
  const checked = () => radios().map(n => n.props['data-checked'])

  assert.deepEqual(checked(), [true, false, false], '未绑定值时按 defaultValue 选中')

  find(radios()[2]!, n => !!n.props.onTap)[0]!.props.onTap({})
  await tick()
  assert.equal(props.modelValue, 'c')
  assert.deepEqual(checked(), [false, false, true])

  props.modelValue = undefined
  await tick()
  assert.deepEqual(checked(), [true, false, false], '父级重置后回到 defaultValue，而不是上一次点选的项')
  wrapper.unmount()
})

test('UniApp RadioGroup：未绑定 v-model 时由组件自己持有选中值', async () => {
  fixture()
  const RadioGroup = await loadComponent('reborn-radio/RebornRadioGroup.vue', ['reborn-radio/RebornRadio.vue'])
  const changes: unknown[] = []
  const wrapper = await mount(RadioGroup, { defaultValue: 'a', options: ['a', 'b'], onChange: (value: unknown) => changes.push(value) })
  const radios = () => find(wrapper.root, n => n.props['data-checked'] !== undefined)

  find(radios()[1]!, n => !!n.props.onTap)[0]!.props.onTap({})
  await tick()
  assert.deepEqual(radios().map(n => n.props['data-checked']), [false, true])
  assert.deepEqual(changes, ['b'])
  wrapper.unmount()
})
