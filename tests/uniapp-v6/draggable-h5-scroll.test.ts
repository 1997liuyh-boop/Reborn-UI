/**
 * RebornDraggable（UniApp H5）触摸默认行为回归：
 * 默认长按模式下，手指落在列表上的 touchstart 不能 preventDefault——那会取消这次触摸的页面滚动与兼容点击；
 * 只有长按判定成功、真正进入拖拽后，才拦截 touchmove 的默认滚动。
 */
import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- 沿用仓库可直接执行的 Node 回归测试宿主。
import test from 'node:test'
import { nextTick } from 'vue'
import { find, fixture, loadComponent, mount } from '../uniapp-u1/harness'

const tick = async () => { await nextTick(); await nextTick() }

function touchEvent(y: number) {
  const event = {
    touches: [{ clientX: 0, clientY: y }],
    cancelable: true,
    prevented: 0,
    preventDefault() { event.prevented++ },
    stopPropagation() {},
  }
  return event
}

test('H5 Draggable 长按模式：touchstart 不阻止默认行为，长按进入拖拽后才拦截滚动', async () => {
  const env = fixture()
  const documentListeners: string[] = []
  ;(globalThis as any).document = {
    addEventListener: (name: string) => documentListeners.push(name),
    removeEventListener() {},
  }
  const Drag = await loadComponent('reborn-draggable/RebornDraggable.vue')
  const events: string[] = []
  const wrapper = await mount(Drag, { modelValue: ['甲', '乙', '丙'], onStart: () => events.push('start') })
  const items = find(wrapper.root, n => !!n.props.onTouchstart)
  assert.equal(items.length, 3)

  // 手指落下后直接纵向滑动：页面应能滚动，组件不进入拖拽
  const down = touchEvent(0)
  await items[0]!.props.onTouchstart(down)
  assert.equal(down.prevented, 0, 'touchstart 被 preventDefault 会让页面滚不动、项内按钮点击被吞')
  const scroll = touchEvent(40)
  items[0]!.props.onTouchmove(scroll)
  assert.equal(scroll.prevented, 0, '未进入拖拽时 touchmove 不能阻止页面滚动')
  items[0]!.props.onTouchend()
  assert.deepEqual(events, [])
  assert.equal(documentListeners.length, 0)

  // 长按菜单由 contextmenu 单独屏蔽
  const menu = touchEvent(0)
  items[0]!.props.onContextmenu(menu)
  assert.equal(menu.prevented, 1, '长按模式下应屏蔽浏览器长按菜单')

  // 长按判定成功：进入拖拽，之后的 touchmove 才拦截默认滚动
  const press = touchEvent(0)
  const pending = items[0]!.props.onLongpress(press)
  env.flush(); await tick(); env.flush(); await tick()
  await pending
  assert.deepEqual(events, ['start'])
  assert.deepEqual(documentListeners, ['touchmove'], '进入拖拽后才注册 passive:false 的 document touchmove 拦截')
  const drag = touchEvent(30)
  items[0]!.props.onTouchmove(drag)
  assert.equal(drag.prevented, 1, '拖拽中 touchmove 必须阻止页面跟随滚动')
  items[0]!.props.onTouchend()
  wrapper.unmount()
})

test('H5 Draggable 非长按模式：右键 / 长按菜单不被屏蔽', async () => {
  fixture()
  const Drag = await loadComponent('reborn-draggable/RebornDraggable.vue')
  const wrapper = await mount(Drag, { modelValue: ['甲'], longPress: false })
  const item = find(wrapper.root, n => !!n.props.onTouchstart)[0]!
  const menu = touchEvent(0)
  item.props.onContextmenu(menu)
  assert.equal(menu.prevented, 0)
  wrapper.unmount()
})
