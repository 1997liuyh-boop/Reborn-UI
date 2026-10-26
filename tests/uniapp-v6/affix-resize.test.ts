/**
 * RebornAffix（UniApp）窗口尺寸变化回归：
 * 窗口变化（H5 地址栏收起 / 软键盘、横竖屏）不能把用户拖动过的悬浮块复位到初始位置，只夹回新边界；
 * 定位 props 变化才复位。
 */
import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- 沿用仓库可直接执行的 Node 回归测试宿主。
import test from 'node:test'
import { nextTick, reactive } from 'vue'
import { find, fixture, loadComponent, mount } from '../uniapp-u1/harness'

const tick = async () => { await nextTick(); await nextTick() }

test('UniApp Affix：拖动后窗口变化保留位置并夹回边界，未拖动时按 props 重新锚定，props 变化才复位', async () => {
  fixture()
  const uni = (globalThis as any).uni
  let screen = { screenWidth: 375, screenHeight: 800 }
  uni.getWindowInfo = () => ({ ...screen, windowWidth: screen.screenWidth, windowHeight: screen.screenHeight, safeAreaInsets: { top: 0, bottom: 0 } })
  const listeners: (() => void)[] = []
  uni.onWindowResize = (callback: () => void) => listeners.push(callback)
  uni.offWindowResize = (callback: () => void) => listeners.splice(listeners.indexOf(callback), 1)
  const resize = async (next: typeof screen) => { screen = next; listeners.forEach(fn => fn()); await tick() }

  const Affix = await loadComponent('reborn-affix/RebornAffix.vue')
  const props = reactive<Record<string, any>>({ right: 10, bottom: 10, noSnapping: true })
  const wrapper = await mount(Affix, props)
  const node = () => find(wrapper.root, n => !!n.props.onTouchstart)[0]!
  const at = () => [node().props.style.left, node().props.style.bottom]
  assert.deepEqual(at(), ['325px', '10px'])

  // 未拖动：横屏后按 right 重新锚定
  await resize({ screenWidth: 800, screenHeight: 375 })
  assert.deepEqual(at(), ['750px', '10px'])

  // 拖动：向左 50、向上 50
  const touch = (x: number, y: number) => ({ touches: [{ clientX: x, clientY: y }], cancelable: true, preventDefault() {}, stopPropagation() {} })
  node().props.onTouchstart(touch(100, 100))
  node().props.onTouchmove(touch(50, 50))
  node().props.onTouchend()
  await tick()
  assert.deepEqual(at(), ['700px', '60px'])

  // 窗口变窄：保留用户位置，只把 x 夹回新边界
  await resize({ screenWidth: 375, screenHeight: 800 })
  assert.deepEqual(at(), ['335px', '60px'], '窗口变化不能复位用户拖动后的位置')
  // 再变宽：不跳回 right 锚点
  await resize({ screenWidth: 800, screenHeight: 375 })
  assert.deepEqual(at(), ['335px', '60px'])

  // 定位 props 变化：复位
  props.bottom = 20
  await tick()
  assert.deepEqual(at(), ['750px', '20px'])
  wrapper.unmount()
  assert.equal(listeners.length, 0, '卸载后注销窗口监听')
})

test('UniApp Affix：开启吸附时，拖动后窗口变化贴回原来那一侧的边缘', async () => {
  fixture()
  const uni = (globalThis as any).uni
  let screen = { screenWidth: 375, screenHeight: 800 }
  uni.getWindowInfo = () => ({ ...screen, safeAreaInsets: { top: 0, bottom: 0 } })
  const listeners: (() => void)[] = []
  uni.onWindowResize = (callback: () => void) => listeners.push(callback)
  uni.offWindowResize = () => {}
  const resize = async (next: typeof screen) => { screen = next; listeners.forEach(fn => fn()); await tick() }

  const Affix = await loadComponent('reborn-affix/RebornAffix.vue')
  const wrapper = await mount(Affix, { left: 10, bottom: 100 })
  const node = () => find(wrapper.root, n => !!n.props.onTouchstart)[0]!
  const at = () => [node().props.style.left, node().props.style.bottom]
  const touch = (x: number, y: number) => ({ touches: [{ clientX: x, clientY: y }], cancelable: true, preventDefault() {}, stopPropagation() {} })
  // 拖到右半边，松手吸附到右缘
  node().props.onTouchstart(touch(20, 500))
  node().props.onTouchmove(touch(260, 500))
  node().props.onTouchend()
  await tick()
  assert.deepEqual(at(), ['325px', '100px'])
  // 横屏变宽：仍贴右缘，而不是按新中线被判到左侧
  await resize({ screenWidth: 800, screenHeight: 375 })
  assert.deepEqual(at(), ['750px', '100px'])
  await resize({ screenWidth: 375, screenHeight: 800 })
  assert.deepEqual(at(), ['325px', '100px'])
  wrapper.unmount()
})

test('UniApp Affix：按窗口尺寸而不是设备屏幕尺寸定位与吸附（H5 窗口比屏幕小时右缘不落到窗口外）', async () => {
  fixture()
  const uni = (globalThis as any).uni
  // 文档站手机预览：页面窗口 375×667，设备屏幕 1920×1080
  uni.getWindowInfo = () => ({ screenWidth: 1920, screenHeight: 1080, windowWidth: 375, windowHeight: 667, safeAreaInsets: { top: 0, bottom: 0 } })
  uni.onWindowResize = () => {}
  uni.offWindowResize = () => {}

  const Affix = await loadComponent('reborn-affix/RebornAffix.vue')
  const wrapper = await mount(Affix, { right: 20, top: 30, size: 40 })
  const node = () => find(wrapper.root, n => !!n.props.onTouchstart)[0]!
  const at = () => [node().props.style.left, node().props.style.bottom]
  assert.deepEqual(at(), ['315px', '597px'], 'right / top 相对窗口：375 - 40 - 20，667 - 40 - 30')

  const touch = (x: number, y: number) => ({ touches: [{ clientX: x, clientY: y }], cancelable: true, preventDefault() {}, stopPropagation() {} })
  // 拖到左半边：中心 315 - 200 + 20 = 135 在窗口中线 187.5 左侧，贴左缘
  node().props.onTouchstart(touch(335, 60))
  node().props.onTouchmove(touch(135, 60))
  node().props.onTouchend()
  await tick()
  assert.equal(at()[0], '10px')
  // 拖回右半边：贴窗口右缘留 gap，而不是屏幕右缘（1920 - 40 - 10）
  node().props.onTouchstart(touch(30, 60))
  node().props.onTouchmove(touch(230, 60))
  node().props.onTouchend()
  await tick()
  assert.equal(at()[0], '325px', '375 - 40 - 10')
  wrapper.unmount()
})
