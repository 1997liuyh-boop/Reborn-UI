/**
 * RebornRate（UniApp）回归：
 * 1. 半星点按：小程序跨线程查询常晚于手指抬起，结果不能取决于手速——测量晚于 touchend / tap 返回时仍按触点取半星。
 * 2. 越界的 v-model（如 7 / count=5）读取时夹取到 0 ~ count，不原样显示。
 */
import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- 沿用仓库可直接执行的 Node 回归测试宿主。
import test from 'node:test'
import { nextTick, reactive } from 'vue'
import { find, fixture, loadComponent, mount } from '../uniapp-u1/harness'

const tick = async () => { await nextTick(); await nextTick() }

/** 每颗星宽 100、依次排开；exec 的回调由用例手动放行，模拟测量晚于抬起 */
function installStarQuery() {
  const pending: (() => void)[] = []
  ;(globalThis as any).uni.createSelectorQuery = () => {
    let callback: ((nodes: any) => void) | undefined
    const query = {
      in: () => query,
      selectAll: () => query,
      select: () => query,
      boundingClientRect: (fn: (nodes: any) => void) => { callback = fn; return query },
      exec: () => { pending.push(() => callback?.(Array.from({ length: 5 }, (_, i) => ({ left: i * 100, width: 100, top: 0, height: 40 })))) },
    }
    return query
  }
  return { flush: () => pending.splice(0).forEach(fn => fn()) }
}

test('UniApp Rate 半星：测量晚于抬起与 tap 返回，仍按触点取半星', async () => {
  fixture()
  const query = installStarQuery()
  const Rate = await loadComponent('reborn-rate/RebornRate.vue')
  const changes: number[] = []
  const props = reactive<Record<string, any>>({
    'modelValue': 0,
    'allowHalf': true,
    'onUpdate:modelValue': (value: number) => { props.modelValue = value },
    'onChange': (value: number) => changes.push(value),
  })
  const wrapper = await mount(Rate, props)
  const star = find(wrapper.root, n => !!n.props.onTouchstart)[2]!
  // 第 3 颗星的左半边
  star.props.onTouchstart({ touches: [{ clientX: 220, clientY: 10 }], stopPropagation() {} })
  star.props.onTouchend()
  star.props.onTap()
  await tick()
  assert.deepEqual(changes, [], 'tap 不能抢在半星判定前按「同星循环」改值')
  query.flush()
  await tick()
  assert.deepEqual(changes, [2.5], '迟到的测量仍按触点落在左半边取 2.5')
  wrapper.unmount()
})

test('UniApp Rate：v-model 越界时按 0 ~ count 夹取显示', async () => {
  fixture()
  installStarQuery()
  const Rate = await loadComponent('reborn-rate/RebornRate.vue')
  const wrapper = await mount(Rate, { modelValue: 7, count: 5, showValue: true })
  const texts = find(wrapper.root, n => typeof n.text === 'string').map(n => n.text!.trim()).filter(Boolean)
  assert.ok(texts.includes('5'), `分数区应显示夹取后的 5：${texts.join(' | ')}`)
  assert.ok(!texts.includes('7'))
  wrapper.unmount()
})
