/**
 * RebornSelect（UniApp）草稿回归：
 * 弹层打开、用户滚动但未确认时，父级传入的 options 换了引用（内联数组 / 每次新建），
 * 不能把滚轮拉回已提交值；只有已提交值或列数变化才按模型重建。
 */
import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- 沿用仓库可直接执行的 Node 回归测试宿主。
import test from 'node:test'
import { nextTick, reactive } from 'vue'
import { find, fixture, loadComponent, mount } from '../uniapp-u1/harness'

const tick = async () => { await nextTick(); await nextTick() }
const makeOptions = () => [{ label: '甲', value: 'a' }, { label: '乙', value: 'b' }, { label: '丙', value: 'c' }]

test('UniApp Select：弹层打开时 options 换引用，未确认的滚轮位置保留', async () => {
  fixture()
  // PickerView 的 useDarkMode 读写本地存储并同步 <html> 的 dark 类
  Object.assign((globalThis as any).uni, { getStorageSync: () => '', setStorageSync() {} })
  Object.assign((globalThis as any).document, { documentElement: { classList: { add() {}, remove() {} } } })
  const Select = await loadComponent('reborn-select/RebornSelect.vue', ['reborn-picker-view/RebornPickerView.vue'])
  const changing: unknown[] = []
  const props = reactive<Record<string, any>>({ modelValue: 'a', options: makeOptions(), showTrigger: false, onChanging: (value: unknown) => changing.push(value) })
  const wrapper = await mount(Select, props)
  const picker = () => find(wrapper.root, n => n.type === 'picker-view')[0]!

  wrapper.exposed.open()
  await tick()
  assert.deepEqual(picker().props.value, [0])
  picker().props.onChange({ detail: { value: [2] } })
  await tick()
  assert.deepEqual(changing, ['c'])
  assert.deepEqual(picker().props.value, [2])

  // 父级在 @changing 里刷新状态，options 以新数组传入
  props.options = makeOptions()
  await tick()
  assert.deepEqual(picker().props.value, [2], '未确认的草稿不能被拉回已提交值')

  // 新选项里草稿值不存在：校正到首项
  props.options = [{ label: '丁', value: 'd' }, { label: '戊', value: 'e' }]
  await tick()
  assert.deepEqual(picker().props.value, [0])

  // 已提交值变化仍按模型重建
  props.options = makeOptions()
  props.modelValue = 'b'
  await tick()
  assert.deepEqual(picker().props.value, [1])
  wrapper.unmount()
})
