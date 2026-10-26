/* eslint test/no-import-node-test: off -- 使用仓库现有测试运行器 */
import assert from 'node:assert/strict'
import { after, beforeEach, it } from 'node:test'
import { installDom } from '../composables/harness'
import { loadComponent, loadModule } from './harness'

const dom = installDom()
const { createApp, h, nextTick, shallowRef } = await import('vue')
const base = 'packages/uniapp-project/src/components/'
const fixture = { controls: {} as Record<string, { props: any; emit: (name: string, ...args: any[]) => void }[]>, stopped: 0 }
Object.assign(globalThis, { __u2: fixture })
const storage = new Map<string, string>()
const queryCallbacks: (() => void)[] = []
const context = new Proxy({}, { get: () => () => {} })
let queryCount = 0
let delayedQuery = false
const rect = { left: 0, top: 0, width: 300, height: 200 }
Object.assign(globalThis, { uni: {
  getWindowInfo: () => ({ windowWidth: 375 }), getStorageSync: (key: string) => storage.get(key) ?? '',
  setStorageSync: (key: string, value: string) => storage.set(key, value), hideKeyboard() {},
  createCanvasContext: () => context,
  createSelectorQuery: () => {
    queryCount++
    const callbacks: (() => void)[] = []
    const query = { in: () => query, select: () => query, selectAll: () => query,
      boundingClientRect: (callback: (value: any) => void) => { if (callback) callbacks.push(() => callback(rect)); return query },
      exec: () => { for (const callback of callbacks) { if (delayedQuery) queryCallbacks.push(callback); else callback() } },
    }
    return query
  },
} })
after(() => dom.window.close())
beforeEach(() => { fixture.controls = {}; storage.clear(); queryCallbacks.length = 0; delayedQuery = false; queryCount = 0 })
const flush = async () => { await nextTick(); await nextTick(); await nextTick() }
function mount(Component: any, props: any = {}, slots?: any) {
  const root = document.createElement('div')
  const app = createApp({ render: () => h(Component, typeof props === 'function' ? props() : props, slots) })
  app.config.warnHandler = () => {}
  const vm = app.mount(root)
  return { root, app, vm }
}
function event(element: Element, name: string, detail?: any) {
  element.dispatchEvent(new dom.window.CustomEvent(name, { detail, bubbles: true }))
}

it('InputNumber 非受控 defaultValue、生效回到 0 和非法数字回退', async () => {
  const Component = await loadComponent(`${base}reborn-input-number/RebornInputNumber.vue`)
  const changes: number[] = []
  const { root, app } = mount(Component, { defaultValue: 1, onChange: (value: number) => changes.push(value) })
  try {
    assert.equal(root.querySelector('input')!.value, '1')
    const minus = root.querySelector('.button')!
    event(minus, 'touchstart'); event(minus, 'touchend'); await flush()
    assert.deepEqual(changes, [0])
    assert.equal(root.querySelector('input')!.value, '0')
    event(root.querySelector('input')!, 'blur', { value: '.' }); await flush()
    assert.deepEqual(changes, [0])
    assert.equal(root.querySelector('input')!.value, '0')
  } finally { app.unmount() }
})

it('SearchBox 非受控输入参与 search，historyKey 存储隔离且受控历史不写存储', async () => {
  const Component = await loadComponent(`${base}reborn-search-box/RebornSearchBox.vue`)
  const searches: string[] = []
  const { app } = mount(Component, { historyKey: 'first', onSearch: (value: string) => searches.push(value) })
  try {
    fixture.controls.RebornInput![0]!.emit('update:modelValue', 'alpha')
    await flush(); fixture.controls.RebornInput![0]!.emit('confirm'); await flush()
    assert.deepEqual(searches, ['alpha'])
    assert.deepEqual(JSON.parse(storage.get('first')!), ['alpha'])
    assert.equal(storage.has('second'), false)
  } finally { app.unmount() }
  const histories: string[][] = []
  const bound = mount(Component, { modelValue: 'beta', history: ['old'], historyKey: 'second', 'onUpdate:history': (value: string[]) => histories.push(value) })
  try { fixture.controls.RebornInput!.at(-1)!.emit('confirm'); await flush(); assert.deepEqual(histories, [['beta', 'old']]); assert.equal(storage.has('second'), false) }
  finally { bound.app.unmount() }
})

it('PickerView 非受控索引在滚动后同步选中高亮', async () => {
  const Component = await loadComponent(`${base}reborn-picker-view/RebornPickerView.vue`)
  const { root, app } = mount(Component, { columns: [[{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }]] })
  try {
    event(root.querySelector('picker-view')!, 'change', { value: [1] }); await flush()
    assert.equal(root.querySelectorAll('text.itemText').length, 2)
    assert.equal(root.querySelector('text.itemText.active')!.textContent!.trim(), 'B')
  } finally { app.unmount() }
})

it('Select 外部级联重置立即对齐 tag 项、文本和展开态', async () => {
  const Component = await loadComponent(`${base}reborn-select/RebornSelect.vue`)
  const model = shallowRef(['A', 'a2'])
  const options = [{ label: 'A', value: 'A', children: [{ label: 'a1', value: 'a1' }, { label: 'a2', value: 'a2' }] }, { label: 'B', value: 'B', children: [{ label: 'b1', value: 'b1' }, { label: 'b2', value: 'b2' }] }]
  const { app } = mount(Component, () => ({ modelValue: model.value, options, columnCount: 2 }))
  try {
    assert.equal(fixture.controls.RebornSelectTrigger![0]!.props.text, 'A - a2')
    model.value = ['B', 'b2']; await flush()
    assert.deepEqual(fixture.controls.RebornPickerView![0]!.props.value, [1, 1])
    assert.equal(fixture.controls.RebornSelectTrigger![0]!.props.text, 'B - b2')
  } finally { app.unmount() }
})

it('Pagination 自定义 select 派发 current-change，并不能绕过禁用', async () => {
  const Component = await loadComponent(`${base}reborn-pagination/RebornPagination.vue`)
  const disabled = shallowRef(false)
  const selections: Record<number, () => void> = {}
  const changes: number[] = []
  const { app } = mount(Component, () => ({ total: 100, disabled: disabled.value, onCurrentChange: (value: number) => changes.push(value) }), { 'pager-item': (scope: any) => { selections[scope.page] = scope.select; return h('button', String(scope.page)) } })
  try {
    selections[2]!(); await flush(); assert.deepEqual(changes, [2])
    disabled.value = true; await flush(); selections[10]!(); await flush(); assert.deepEqual(changes, [2])
  } finally { app.unmount() }
})

it('Popup size 与主属性生效，并在 position 改变时更新安全区', async () => {
  const Component = await loadComponent(`${base}reborn-popup/RebornPopup.vue`)
  const position = shallowRef('left')
  const { app } = mount(Component, () => ({ modelValue: true, position: position.value, size: '60%', modal: false, zIndex: 33 }))
  try {
    assert.equal(fixture.controls.RebornOverlay, undefined)
    const transition = fixture.controls.RebornTransition![0]!
    assert.match(transition.props.customStyle, /width: 60%/)
    assert.match(transition.props.customStyle, /z-index:33/)
    position.value = 'bottom'; await flush()
    assert.match(transition.props.customStyle, /height: 60%/)
    assert.match(transition.props.customStyle, /padding-bottom: 20px/)
  } finally { app.unmount() }
})

it('Popover 每次打开测量，关闭实例不重复发送更新', async () => {
  const Component = await loadComponent(`${base}reborn-popover/RebornPopover.vue`)
  const updates: boolean[] = []
  let exposed: any
  const { app } = mount(Component, { ref: (value: any) => { exposed = value }, 'onUpdate:open': (value: boolean) => updates.push(value) })
  try {
    exposed.close(); await flush(); assert.deepEqual(updates, [])
    exposed.open(); await flush(); assert.equal(queryCount, 1)
    exposed.close(); await flush(); exposed.close(); await flush(); assert.deepEqual(updates, [true, false])
    exposed.open(); await flush(); assert.equal(queryCount, 2)
  } finally { app.unmount() }
})

it('Signature 查询期间抬起仍完成笔画，卸载时导出 Promise 被拒绝', async () => {
  const Component = await loadComponent(`${base}reborn-signature/RebornSignature.vue`)
  const ends: any[] = []
  let exposed: any
  const { root, app } = mount(Component, { ref: (value: any) => { exposed = value }, onEnd: (value: any) => ends.push(value), allowEmpty: true })
  try {
    delayedQuery = true
    const board = root.querySelector('.board')!
    event(board, 'touchstart', undefined)
    await nextTick()
    event(board, 'touchend')
    for (const callback of queryCallbacks.splice(0)) callback()
    await flush()
    assert.equal(ends.length, 1)
    const exported = exposed.toPng()
    app.unmount()
    await assert.rejects(exported, /已卸载/)
  } finally { if ((app as any)._container) app.unmount() }
})

it('Qrcode 尺寸变化重绘并使旧绘制过期，卸载会结束待导出 Promise', async () => {
  const draws: { options: any; stale: () => boolean }[] = []
  Object.assign(globalThis, { __u2Draws: draws })
  const Component = await loadComponent(`${base}reborn-qrcode/RebornQrcode.vue`, { './draw': 'export const eccLevel={H:2};export function drawQrcode(ctx,options,canvas,stale){globalThis.__u2Draws.push({options,stale})}' })
  const size = shallowRef(200)
  let exposed: any
  const { root, app } = mount(Component, () => ({ ref: (value: any) => { exposed = value }, size: size.value, class: 'qr-custom' }))
  try {
    await new Promise(resolve => setTimeout(resolve, 15)); await flush()
    assert.equal(draws.length, 1)
    size.value = 240; await flush()
    assert.equal(draws.length, 2)
    assert.equal(draws[0]!.stale(), true)
    assert.equal(draws[1]!.options.size, 240)
    assert.ok(root.querySelector('.qr-custom'))
    const exported = exposed.toPng()
    app.unmount()
    assert.equal(draws[1]!.stale(), true)
    await assert.rejects(exported, /已卸载/)
  } finally { if ((app as any)._container) app.unmount() }
})

it('二维码前景图晚到时，过期绘制不会覆盖新内容或提交画布', async () => {
  const { drawQrcode, eccLevel } = await loadModule(`${base}reborn-qrcode/draw.ts`) as any
  const images: any[] = []
  let commits = 0
  const ctx = new Proxy({}, { get: (_, key) => key === 'draw' ? () => { commits++ } : () => {} })
  const canvas = { createImage: () => { const image = {}; images.push(image); return image } }
  const options = { text: 'first', ecc: eccLevel.H, size: 200, foreground: '#000', background: '#fff', padding: 4, logo: '', logoSize: 40, mode: 'rect' as const, pdColor: '#000', pdRadius: 0, dotsImage: '/dots.png' }
  let stale = false
  const old = drawQrcode(ctx, options, canvas, () => stale)
  stale = true
  const latest = drawQrcode(ctx, { ...options, text: 'latest' }, canvas)
  images[1].onload(); await latest
  assert.equal(commits, 1)
  images[0].onload(); await old
  assert.equal(commits, 1)
})

it('OTP App 聚焦时卸载会停止无限光标动画', async () => {
  const Component = await loadComponent(`${base}reborn-input-otp/RebornInputOtp.vue`, {}, 'APP')
  const before = fixture.stopped
  const { app } = mount(Component)
  fixture.controls.RebornInput![0]!.emit('focus', {})
  await flush()
  app.unmount()
  assert.ok(fixture.stopped > before)
})

it('Rate 一次手势只测量一次，移动按缓存同步计算半星', async () => {
  const Component = await loadComponent(`${base}reborn-rate/RebornRate.vue`)
  const changes: number[] = []
  const uni = (globalThis as any).uni
  const original = uni.createSelectorQuery
  uni.createSelectorQuery = () => {
    queryCount++
    let callback: (value: any) => void
    const query = { in: () => query, selectAll: () => query, boundingClientRect: (fn: (value: any) => void) => { callback = fn; return query }, exec: () => callback(Array.from({ length: 5 }, (_, index) => ({ left: index * 40, width: 40 }))) }
    return query
  }
  const { root, app } = mount(Component, { allowHalf: true, onChange: (value: number) => changes.push(value) })
  const touch = (name: string, x: number) => {
    const value = new dom.window.Event(name, { bubbles: true, cancelable: true })
    Object.assign(value, { touches: name === 'touchend' ? [] : [{ clientX: x, clientY: 0 }] })
    root.querySelector('.reborn-rate__star')!.dispatchEvent(value)
  }
  try {
    touch('touchstart', 10); await flush()
    for (let x = 30; x <= 170; x += 10) touch('touchmove', x)
    touch('touchend', 180); await flush()
    assert.equal(queryCount, 1)
    assert.equal(changes.at(-1), 4.5)
  } finally { app.unmount(); uni.createSelectorQuery = original }
})

it('NoticeBar 单条数组不显示 JSON，原地增项、禁用和 interval 变化重启轮播', async (ctx) => {
  const Component = await loadComponent(`${base}reborn-notice-bar/RebornNoticeBar.vue`)
  const { ref } = await import('vue')
  const text = ref(['one'])
  const disabled = shallowRef(false)
  const interval = shallowRef(20)
  const changes: number[] = []
  ctx.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] })
  const { root, app } = mount(Component, () => ({ text: text.value, direction: 'vertical', interval: interval.value, disabled: disabled.value, onChange: (value: number) => changes.push(value) }))
  try {
    assert.equal(root.textContent!.trim(), 'one')
    text.value.push('two'); await flush()
    ctx.mock.timers.tick(20); await flush(); assert.deepEqual(changes, [1])
    disabled.value = true; await flush(); ctx.mock.timers.tick(100); assert.deepEqual(changes, [1])
    interval.value = 40; disabled.value = false; await flush()
    ctx.mock.timers.tick(20); assert.deepEqual(changes, [1])
    // 禁用 / 解禁只停启计时器、不重置当前条目：从第 2 条（索引 1）继续轮到索引 0
    ctx.mock.timers.tick(20); assert.deepEqual(changes, [1, 0])
    app.unmount(); ctx.mock.timers.tick(200); assert.deepEqual(changes, [1, 0])
  } finally { if ((app as any)._container) app.unmount() }
})
