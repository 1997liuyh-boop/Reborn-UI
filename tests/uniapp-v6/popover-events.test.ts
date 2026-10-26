/**
 * RebornPopover（UniApp）事件回归：
 * 打开后要等测量 #target 才能定位，测量期间如果又被关闭（快速开→关），这次打开的 open / change(true) 不能丢，
 * 使用方不应只收到一个没有对应 open 的 close。
 */
import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- 沿用仓库可直接执行的 Node 回归测试宿主。
import test from 'node:test'
import { nextTick, reactive } from 'vue'
import { fixture, loadComponent, mount } from '../uniapp-u1/harness'

const tick = async () => { await nextTick(); await nextTick() }

test('UniApp Popover：测量期间被关闭，open / change(true) 仍按顺序派发', async () => {
  const env = fixture()
  const Popover = await loadComponent('reborn-popover/RebornPopover.vue')
  const events: string[] = []
  const props = reactive<Record<string, any>>({
    'open': false,
    'title': '提示',
    'onUpdate:open': (value: boolean) => { props.open = value },
    'onOpen': () => events.push('open'),
    'onClose': () => events.push('close'),
    'onChange': ({ show }: { show: boolean }) => events.push(`change:${show}`),
  })
  const wrapper = await mount(Popover, props)
  await tick()

  props.open = true
  await tick() // 进入测量，#target 的查询尚未返回
  props.open = false
  await tick()
  env.flush() // 迟到的测量结果返回
  await tick()
  assert.deepEqual(events, ['change:true', 'open', 'change:false', 'close'])

  // 正常打开：测量完成后定位，事件只派发一次
  events.length = 0
  props.open = true
  await tick()
  env.flush()
  await tick()
  assert.deepEqual(events, ['change:true', 'open'])
  wrapper.unmount()
})
