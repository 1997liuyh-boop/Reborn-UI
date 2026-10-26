/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict'
import { after, beforeEach, it } from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { JSDOM } from 'jsdom'
import { createFixture, loadComponent } from './harness.mjs'

// 将真实 SFC 编译到 JSDOM，异步测量由可控 uni 夹具驱动。
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' })
for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node', 'Event']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] })
}
const vue = await import('vue')
const { createApp, h, nextTick, shallowRef } = vue
const cleanups = []
let fixture
beforeEach(() => { cleanups.splice(0).forEach(fn => fn()); fixture = createFixture(vue) })
after(() => { cleanups.splice(0).forEach(fn => fn()); dom.window.close() })
function mount(component, props = {}, slots) {
  const host = document.createElement('div'); document.body.appendChild(host)
  const app = createApp({ setup: () => () => h(component, typeof props === 'function' ? props() : props, slots) })
  app.config.warnHandler = () => {}
  app.mount(host)
  let mounted = true
  const unmount = () => { if (mounted) { mounted = false; app.unmount(); host.remove() } }
  cleanups.push(unmount)
  return { host, unmount, app, get state() { return fixture.capture.at(-1) } }
}
const componentFile = name => `reborn-${name.replace(/[A-Z]/g, (value, index) => `${index ? '-' : ''}${value.toLowerCase()}`)}/Reborn${name}.vue`

it('U3 全部15个 SFC 的 H5 分支可编译', async () => {
  for (const name of ['SlideVerify','Slider','Sticky','SwiperAction','Switch','Tabbar','Tabs','Text','Textarea','Toast','Transition','Waterfall','Watermark']) {
    await loadComponent(componentFile(name))
  }
  await loadComponent('reborn-tabbar/RebornTabbarTrigger.vue')
  await loadComponent('reborn-tabs/RebornTabPane.vue')
})

it('Switch 表单禁用与异步拦截期间禁用均不提交，连续点按仅拦截一次', async () => {
  const { component } = await loadComponent(componentFile('Switch'))
  let finish; let calls = 0; const changes = []
  fixture.disabled.value = true
  const t = mount(component, { beforeChange: () => { calls++; return new Promise(resolve => { finish = resolve }) }, onChange: value => changes.push(value) })
  await t.state.onTap(); assert.equal(calls, 0)
  fixture.disabled.value = false
  const pending = t.state.onTap(); await t.state.onTap(); assert.equal(calls, 1)
  fixture.disabled.value = true; finish(true); await pending
  assert.deepEqual(changes, [])
})

it('Switch 外部 undefined 回到 defaultValue', async () => {
  const { component } = await loadComponent(componentFile('Switch'))
  const model = shallowRef(false)
  const t = mount(component, () => ({ modelValue: model.value, defaultValue: true, 'onUpdate:modelValue': value => { model.value = value } }))
  assert.equal(t.state.isChecked.value, false)
  model.value = undefined; await nextTick(); assert.equal(t.state.isChecked.value, true)
  assert.equal(t.host.hasAttribute('class'), false)
})

it('Textarea 父级 null/undefined 清空字数；交互仅提交一次新值', async () => {
  const { component } = await loadComponent(componentFile('Textarea'))
  const model = shallowRef('原内容'); const changes = []; const updates = []
  const t = mount(component, () => ({ modelValue: model.value, 'onUpdate:modelValue': value => { updates.push(value); model.value = value }, onChange: value => changes.push(value) }))
  model.value = null; await nextTick(); assert.equal(t.state.value.value, ''); assert.ok(t.host.textContent.includes('0 / 100'))
  model.value = undefined; await nextTick(); assert.equal(t.state.value.value, '')
  t.state.onInput({ detail: { value: '新值' } }); await nextTick()
  assert.deepEqual(updates, ['新值']); assert.deepEqual(changes, ['新值'])
  t.state.focus(); t.unmount(); await delay(5)
})

it('Slider 测量未返回先松手：仍点按跳值并派发一次正确收尾', async () => {
  const { component } = await loadComponent(componentFile('Slider'))
  fixture.autoQuery = false
  fixture.rects = () => [{ left: 0, top: 0, width: 100, height: 4 }, { left: 0, top: 0, width: 100, height: 30 }]
  const complete = []; const t = mount(component, { modelValue: 0, 'onUpdate:modelValue': () => {}, onChangeComplete: value => complete.push(value) })
  const started = t.state.onTouchStart({ touches: [{ clientX: 70, clientY: 0 }] })
  t.state.onTouchEnd(); fixture.pending.shift()(); await started
  assert.equal(t.state.dragging.value, false); assert.deepEqual(complete, [70])
  assert.equal(t.state.value.value, 0)
})

it('Slider 两端thumb契约平铺且范围模式仍保留组件外层', async () => {
  const { component } = await loadComponent(componentFile('Slider'))
  const received = []; const t = mount(component, { range: true, values: [20, 80] }, { thumb: props => { received.push(props); return h('b', String(props.value)) } })
  assert.equal(t.host.querySelectorAll('b').length, 2)
  assert.deepEqual(Object.keys(received[0]).sort(), ['active','disabled','index','value'])
  assert.deepEqual(received.map(item => item.value), [20, 80])
})

it('SlideVerify 早松手不进入拖拽；受控success载荷为true', async () => {
  const { component } = await loadComponent(componentFile('SlideVerify'))
  fixture.autoQuery = false
  fixture.rects = () => [{ width: 200 }, { width: 40 }]
  const successes = []; const starts = []
  const t = mount(component, { modelValue: false, 'onUpdate:modelValue': () => {}, onSuccess: value => successes.push(value), onStart: value => starts.push(value) })
  await nextTick(); fixture.pending.splice(0).forEach(run => run()); await nextTick()
  const pending = t.state.handleTouchStart({ touches: [{ clientX: 20, clientY: 0 }] })
  t.state.handleTouchEnd(); fixture.pending.splice(0).forEach(run => run()); await pending
  assert.equal(t.state.isDragging.value, false); assert.deepEqual(starts, [])
  t.state.completeVerify(); assert.equal(successes[0].verified, true)
})

it('SlideVerify defaultVerified不触发交互change或校验', async () => {
  const { component } = await loadComponent(componentFile('SlideVerify'))
  const changes = []; const updates = []
  const t = mount(component, { defaultVerified: true, onChange: value => changes.push(value), 'onUpdate:modelValue': value => updates.push(value) })
  await nextTick(); assert.equal(t.state.verified.value, true)
  assert.deepEqual(changes, []); assert.deepEqual(updates, []); assert.deepEqual(fixture.validations, [])
})

it('SlideVerify显式受控false优先于defaultVerified且挂载不回写', async () => {
  const { component } = await loadComponent(componentFile('SlideVerify'))
  const updates = []
  const t = mount(component, { defaultVerified: true, modelValue: false, 'onUpdate:modelValue': value => updates.push(value) })
  await nextTick(); assert.equal(t.state.verified.value, false); assert.deepEqual(updates, [])
  assert.deepEqual(fixture.validations, [])
})

it('Waterfall 连续append串行完成，clear使旧批次失效且不回填旧数据', async () => {
  const { component } = await loadComponent(componentFile('Waterfall'))
  fixture.rects = selectors => [selectors[0].includes('column-inner') ? [{ height: 0 }, { height: 0 }] : [{ height: 30 }]]
  const t = mount(component)
  await Promise.all([t.state.append([{ id: 1 }]), t.state.append([{ id: 2 }])])
  assert.deepEqual(t.state.columns.value.flat().map(item => item.id).sort(), [1, 2])
  const old = t.state.append([{ id: 3 }]); await delay(10); t.state.clear()
  const fresh = t.state.append([{ id: 4 }]); await Promise.all([old, fresh])
  assert.deepEqual(t.state.columns.value.flat().map(item => item.id), [4])
  const pending = t.state.append([{ id: 5 }]); await delay(10); t.unmount(); await pending
})

it('Waterfall remove / update 把数字 id 与等值字符串视为同一项', async () => {
  const { component } = await loadComponent(componentFile('Waterfall'))
  const t = mount(component)
  t.state.columns.value = [[{ id: 1 }, { id: 2 }], [{ id: '3' }]]
  t.state.remove('1'); t.state.update(3, { title: '新标题' }); t.state.update('x', { title: '不匹配' })
  assert.deepEqual(t.state.columns.value, [[{ id: 2 }], [{ id: '3', title: '新标题' }]])
})

it('Sticky getRect 每次恢复最新文档位置，缺失节点与卸载回调无副作用', async () => {
  const { component } = await loadComponent(componentFile('Sticky'))
  let top = 50
  fixture.rects = () => [{ top, left: 4, width: 100, height: 30 }]
  const t = mount(component, { scrollTop: 20 }); await nextTick(); await nextTick()
  assert.equal(t.state.rect.top, 70)
  top = 150; t.state.getRect(); await nextTick(); assert.equal(t.state.rect.top, 170)
  fixture.rects = () => [null]; t.state.getRect(); await nextTick(); assert.equal(t.state.rect.top, 170)
})

it('Sticky 吸顶切换后的内部重测只刷新宽高、不改触发点；被作废的外部重测位置并入下一次', async () => {
  const { component } = await loadComponent(componentFile('Sticky'))
  const scroll = shallowRef(0)
  let node = { top: 50, left: 4, width: 100, height: 30 }
  fixture.rects = () => [node]
  const t = mount(component, () => ({ scrollTop: scroll.value })); await delay(0)
  assert.equal(t.state.rect.top, 50)
  // 滚过触发点：查询结果按更晚的滚动量给出（与 prop 不同步），内部重测不得据此改写触发点
  node = { top: -20, left: 4, width: 120, height: 30 }
  scroll.value = 60; await nextTick(); await delay(0)
  assert.equal(t.state.isSticky.value, true)
  assert.equal(t.state.rect.width, 120)
  assert.equal(t.state.rect.top, 50)
  // 外部 getRect 尚未返回就被内部重测作废时，位置更新并入后一次
  fixture.autoQuery = false
  node = { top: 10, left: 4, width: 120, height: 30 }
  t.state.getRect(); t.state.measure(false)
  fixture.pending.splice(0).forEach(run => run())
  assert.equal(t.state.rect.top, 70)
})

it('Sticky 吸顶期间用吸顶前的宽度给占位容器兜底，收缩包裹的父容器里不会塌成 0 宽', async () => {
  const { component } = await loadComponent(componentFile('Sticky'))
  const scroll = shallowRef(0)
  fixture.rects = () => [{ top: 50, left: 4, width: 100, height: 30 }]
  const t = mount(component, () => ({ scrollTop: scroll.value })); await delay(0)
  const wrapper = t.host.querySelector('.reborn-sticky-wrapper')
  assert.equal(wrapper.style.minWidth, '')
  scroll.value = 60; await nextTick(); await delay(0)
  assert.equal(t.state.isSticky.value, true)
  assert.equal(t.state.flowWidth.value, 100)
  assert.match(wrapper.getAttribute('style'), /min-width:\s*min\(100px,\s*100%\)/)
  // 回到流内后撤掉下限，占位容器重新由内容撑开
  scroll.value = 0; await nextTick(); await delay(0)
  assert.equal(t.state.isSticky.value, false)
  assert.doesNotMatch(wrapper.getAttribute('style') ?? '', /min-width/)
})

it('Tabbar drop 即使父级拒绝回写也会解锁', async () => {
  const { component } = await loadComponent(componentFile('Tabbar'))
  const changes = []
  const t = mount(component, { animation: 'drop', modelValue: 0, 'onUpdate:modelValue': () => {}, onChange: value => changes.push(value) })
  t.state.setChange({ name: 1 }); assert.equal(t.state.locked.value, true)
  await delay(530); assert.equal(t.state.locked.value, false)
  t.state.setChange({ name: 2 }); assert.equal(changes.length, 2)
})

it('Text 数字手机号/卡号脱敏与空金额均能渲染', async () => {
  const { component } = await loadComponent(componentFile('Text'))
  const props = shallowRef({ type: 'phone', value: 13800138000, mask: true })
  const t = mount(component, () => props.value); assert.ok(t.host.textContent.includes('138****8000'))
  props.value = { type: 'card', value: 123456789012, mask: true }; await nextTick(); assert.ok(t.host.textContent.includes('*'))
  props.value = { type: 'amount', value: null }; await nextTick(); assert.equal(t.host.textContent, '')
})

it('Transition 离场期间卸载会中止在途生命周期', async () => {
  const { component } = await loadComponent(componentFile('Transition'))
  const show = shallowRef(true); const events = []
  const t = mount(component, () => ({ show: show.value, duration: 100, onAfterLeave: () => events.push('after') }))
  await delay(110); show.value = false; await nextTick(); t.unmount(); await delay(200)
  assert.deepEqual(events, []); assert.equal(t.state.timers.size, 0)
})


it('Watermark 组件作用域、宽高重绘、同值内联配置和过期导出', async () => {
  const { component } = await loadComponent(componentFile('Watermark'))
  const contexts = []; const exports = []
  globalThis.uni.createCanvasContext = (id, proxy) => {
    contexts.push({ id, proxy })
    return { translate() {}, rotate() {}, drawImage() {}, setFillStyle() {}, setFontSize() {}, setTextAlign() {}, setTextBaseline() {}, fillText() {}, draw(_reserve, done) { done() } }
  }
  globalThis.uni.canvasToTempFilePath = (options, proxy) => { exports.push({ options, proxy }) }
  const props = shallowRef({ width: 120, font: { fontSize: 16 }, gap: [100,100], customClass: 'watermark-custom' })
  const t = mount(component, () => props.value)
  await delay(70); assert.equal(exports.length, 1); assert.ok(exports[0].proxy); assert.equal(exports[0].proxy, contexts[0].proxy)
  assert.ok(t.host.firstElementChild.classList.contains('watermark-custom'))
  props.value = { ...props.value, font: { fontSize: 16 }, gap: [100,100] }; await delay(70); assert.equal(exports.length, 1)
  props.value = { ...props.value, width: 160 }; await delay(70); assert.equal(exports.length, 2)
  exports[1].options.success({ tempFilePath: '最新水印' }); exports[0].options.success({ tempFilePath: '旧水印' })
  assert.equal(t.state.watermarkBase64.value, '最新水印')
  t.unmount(); exports[1].options.success({ tempFilePath: '卸载后水印' }); assert.equal(t.state.watermarkBase64.value, '最新水印')
})

it('SwiperAction 同值close不吞掉下次外部打开；卸载取消动画定时器', async () => {
  const { component } = await loadComponent(componentFile('SwiperAction'))
  const model = shallowRef('')
  const t = mount(component, () => ({ modelValue: model.value, rightActions: [{ key: 0, text: '操作', width: 100 }], 'onUpdate:modelValue': value => { model.value = value } }))
  t.state.close(); model.value = 'right'; await nextTick()
  assert.ok(t.state.translateX.value < 0)
  t.state.close(); assert.ok(t.state.timers.size > 0)
  t.unmount(); assert.equal(t.state.timers.size, 0)
})

it('SwiperAction卸载后删除测量回调不写状态，later也不创建timer', async () => {
  const { component } = await loadComponent(componentFile('SwiperAction'))
  fixture.autoQuery = false
  fixture.rects = () => [{ height: 987 }]
  const t = mount(component)
  const state = t.state
  state.triggerRemoveAnimation({ key: 'remove' }, 0, 'right')
  const before = state.removingMaxHeight.value
  t.unmount()
  fixture.pending.splice(0).forEach(run => run())
  assert.equal(state.removingMaxHeight.value, before)
  assert.equal(state.timers.size, 0)
  state.later('unmounted', () => assert.fail('不得执行'), 1)
  assert.equal(state.timers.size, 0)
})

it('Toast 从页面缓存上下文，命令式容器与页面轮流渲染，destroy兑现同key所有Promise', async () => {
  const { exports } = await loadComponent('reborn-toast/index.ts', false)
  const page = mount(exports.RebornToast)
  const context = page.app._context
  page.unmount(); await nextTick()
  let closed = 0; let resolved = 0
  const first = exports.message.success({ content: '第一条', key: 'same', duration: 0, onClose: () => { closed++ } }).then(() => { resolved++ })
  await nextTick()
  const containerRoot = [...document.querySelectorAll('view')].find(node => node.textContent === '第一条')
  assert.equal(containerRoot.__vueParentComponent.appContext, context)
  const second = exports.message.success({ content: '更新提示', key: 'same', duration: 0, onClose: () => { closed++ } }).then(() => { resolved++ })
  await nextTick(); assert.equal(document.body.textContent.split('更新提示').length - 1, 1)
  const activePage = mount(exports.RebornToast); await nextTick()
  assert.equal(document.body.textContent.split('更新提示').length - 1, 1)
  activePage.unmount(); await nextTick(); assert.equal(document.body.textContent.split('更新提示').length - 1, 1)
  exports.message.destroy('same'); await Promise.all([first, second])
  assert.equal(closed, 1); assert.equal(resolved, 2)
  await delay(260); assert.equal(document.body.textContent.includes('更新提示'), false)
})

// 两个 tabBar 页面来回切换：页面不卸载，渲染归属须跟随 getCurrentPages() 栈顶，而不是最后挂载的实例。
for (const target of ['H5', 'MP-WEIXIN']) it(`${target} Toast tabBar 切回先打开的页面后消息渲染在当前页；H5 容器只在当前页没有实例时接管`, async () => {
  const { exports } = await loadComponent('reborn-toast/index.ts', false, target)
  let current
  globalThis.getCurrentPages = () => current ? [current] : []
  cleanups.push(() => { delete globalThis.getCurrentPages })
  const pageOf = mounted => ({ $vm: { $: mounted.app._instance } })
  const show = mounted => fixture.pageShows.filter(({ instance }) => instance.root === mounted.app._instance).forEach(({ fn }) => fn())
  const count = (root, text) => root.textContent.split(text).length - 1
  // 先进入标签页 A，再切到标签页 B，最后切回 A：全程没有挂载 / 卸载
  const tabA = mount(exports.RebornToast); current = pageOf(tabA); show(tabA)
  const tabB = mount(exports.RebornToast); current = pageOf(tabB); show(tabB)
  current = pageOf(tabA); show(tabA)
  exports.message.success({ content: '回到A', duration: 0 }); await nextTick()
  assert.equal(count(tabA.host, '回到A'), 1)
  // 隐藏的 B 页各自渲染一份（看不见），且没有额外挂命令式容器
  assert.equal(count(document.body, '回到A'), 2)
  if (target === 'H5') {
    // 跳到没有 <RebornToast /> 的普通页：容器接管，A / B 两页的副本都在隐藏页里
    current = { $vm: { $: {} } }
    exports.message.success({ content: 'C页', duration: 0 }); await nextTick()
    const outside = text => count(document.body, text) - count(tabA.host, text) - count(tabB.host, text)
    assert.equal(outside('C页'), 1)
    // 返回 A：A 的 onShow 让容器让位，同屏只剩 A 页那一份
    current = pageOf(tabA); show(tabA); await nextTick()
    assert.equal(outside('C页'), 0)
    assert.equal(count(tabA.host, 'C页'), 1)
  }
  exports.message.destroy(); await delay(260)
  assert.equal(document.body.textContent.includes('回到A'), false)
})

for (const target of ['H5', 'MP-WEIXIN']) it(`${target} Tabs 动态插入中间项后头部按实际面板顺序，激活项key不变`, async () => {
  const { exports: { RebornTabs: Tabs, RebornTabPane: Pane } } = await loadComponent('reborn-tabs/index.ts', true, target)
  const order = shallowRef(['a','c']); const active = shallowRef('c')
  // 普通后代选择器跨不过小程序子组件边界，不伪造穿透结果。
  fixture.rects = () => []
  const t = mount(Tabs, () => ({ activeKey: active.value }), { default: () => order.value.map((key, index) => h(Pane, { key, paneKey: key, order: index, title: key }, () => key)) })
  await nextTick(); await nextTick(); order.value = ['a','b','c']; await nextTick(); await nextTick(); await nextTick()
  assert.deepEqual(t.state.panes.value.map(pane => pane.key), ['a','b','c'])
  assert.equal(t.state.currentKey.value, 'c')
  order.value = ['c','a','b']; await nextTick(); await nextTick(); await nextTick()
  assert.deepEqual(t.state.panes.value.map(pane => pane.key), ['c','a','b'])
  order.value = ['c','b']; await nextTick(); await nextTick(); await nextTick()
  assert.deepEqual(t.state.panes.value.map(pane => pane.key), ['c','b'])
  assert.equal(fixture.queries.some(selectors => selectors.includes('.reborn-tabs__pane')), false)
})
