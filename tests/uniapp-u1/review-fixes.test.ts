/* eslint test/no-import-node-test: off -- 使用仓库现有 Node 回归宿主。 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { h, nextTick, reactive } from 'vue'
import { z } from 'zod'
import { find, fixture, loadComponent, mount } from './harness'

const tick = async () => { await nextTick(); await nextTick() }

for (const platform of ['uniapp', 'web'] as const) {
  test(`${platform} 整表校验等待较新字段请求，不能提前允许提交`, async () => {
    fixture()
    const Form = await loadComponent('reborn-form/RebornForm.vue', [], platform)
    const Item = await loadComponent('reborn-form/RebornFormItem.vue', [], platform)
    const pending: ((value: any) => void)[] = []
    const wrapper = await mount(Form, { modelValue: { name: '' }, showMessage: false, scrollToError: false,
      rules: { safeParseAsync: () => new Promise(resolve => pending.push(resolve)) } },
    { default: () => h(Item, { prop: 'name' }) })
    let settled = false
    const whole = wrapper.exposed.validate().then((value: boolean) => { settled = true; return value })
    const field = wrapper.exposed.validateField('name')
    pending[0]!({ success: true })
    await tick()
    const early = settled
    pending[1]!({ success: false, error: { issues: [{ path: ['name'], message: '新错误' }] } })
    assert.equal(await field, '新错误')
    const valid = await whole
    wrapper.unmount()
    assert.equal(early, false)
    assert.equal(valid, false)
  })

  test(`${platform} schema拒绝或refine抛错始终resolve失败，清除后旧结果不复活`, async () => {
    fixture()
    const Form = await loadComponent('reborn-form/RebornForm.vue', [], platform)
    const Item = await loadComponent('reborn-form/RebornFormItem.vue', [], platform)
    const props = reactive({ modelValue: { name: '' }, showMessage: false, scrollToError: false,
      rules: { safeParseAsync: async () => { throw new Error('远程校验不可用') } } })
    const wrapper = await mount(Form, props, { default: () => h(Item, { prop: 'name' }) })
    const original = console.error
    console.error = () => {}
    try {
      const errors: any[] = []
      assert.equal(await wrapper.exposed.validate((_valid: boolean, current: any[]) => errors.push(...current)), false)
      assert.ok(errors.length > 0)
      assert.ok(await wrapper.exposed.validateField('name'))
      props.rules = z.object({ name: z.string() }).superRefine(() => { throw new Error('refine失败') }) as any
      await tick()
      assert.equal(await wrapper.exposed.validate(), false)
      let finish: (value: any) => void = () => {}
      props.rules = { safeParseAsync: () => new Promise(resolve => { finish = resolve }) } as any
      await tick()
      const pending = wrapper.exposed.validate()
      wrapper.exposed.clearValidate()
      finish({ success: false, error: { issues: [{ path: ['name'], message: '旧错误' }] } })
      assert.equal(await pending, true)
      const reset = wrapper.exposed.validate()
      wrapper.exposed.resetFields()
      finish({ success: false, error: { issues: [{ path: ['name'], message: '重置前错误' }] } })
      assert.equal(await reset, true)
    }
    finally { console.error = original; wrapper.unmount() }
  })

  test(`${platform}整表校验互相接管也等待最终结果，未注册字段时schema异常仍失败`, async () => {
    fixture()
    const Form = await loadComponent('reborn-form/RebornForm.vue', [], platform)
    const Item = await loadComponent('reborn-form/RebornFormItem.vue', [], platform)
    const pending: ((value: any) => void)[] = []
    const props = reactive({ modelValue: { name: '' }, showMessage: false, scrollToError: false,
      rules: { safeParseAsync: () => new Promise(resolve => pending.push(resolve)) } })
    const wrapper = await mount(Form, props, { default: () => h(Item, { prop: 'name' }) })
    let settled = false
    const first = wrapper.exposed.validate().then((value: boolean) => { settled = true; return value })
    const second = wrapper.exposed.validate()
    pending[0]!({ success: true }); await tick(); assert.equal(settled, false)
    pending[1]!({ success: false, error: { issues: [{ path: ['name'], message: '整表新错误' }] } })
    assert.deepEqual(await Promise.all([first, second]), [false, false])
    wrapper.unmount()
    const empty = await mount(Form, { ...props, rules: { safeParseAsync: () => Promise.reject(new Error('拒绝')) } })
    const original = console.error; console.error = () => {}
    try { assert.equal(await empty.exposed.validate(), false) }
    finally { console.error = original; empty.unmount() }
  })
}

test('二维码预览调用真实无参数导出，固定600像素并删除死尺寸选择', async () => {
  const env = fixture()
  const exports: any[] = []
  Object.assign((globalThis as any).uni, {
    createCanvasContext: () => new Proxy({}, { get: () => () => {} }),
    canvasToTempFilePath: (options: any) => { exports.push(options); options.success({ tempFilePath: '/fixed-600.png' }) },
  })
  const Preview = await loadComponent('../pages/reborn-qrcode/components/PreviewSection.vue', ['reborn-qrcode/RebornQrcode.vue'])
  const wrapper = await mount(Preview, { config: { text: '真实导出', margin: 1, dotsType: 'rect', dotsColor: '#000000',
    backgroundColor: '#ffffff', logoSize: 'medium', logoMargin: 'small', logoShape: 'rectangle' }, isGenerating: false })
  try {
    assert.equal(await wrapper.exposed.toPng(), '/fixed-600.png')
    assert.equal(exports[0].destWidth, 600)
    assert.equal(exports[0].destHeight, 600)
    assert.ok(find(wrapper.root, n => n.text === '导出图片固定为 600×600 像素').length)
    assert.equal(env.controls.RebornDropdownSelect, undefined)
  }
  finally { wrapper.unmount() }
})

test('Draggable测量后真实跨项重排，start一次且取消与卸载不追加监听', async () => {
  const env = fixture()
  let adds = 0
  document.addEventListener = () => { adds++ }
  const Drag = await loadComponent('reborn-draggable/RebornDraggable.vue')
  const updates: string[][] = []
  const events: string[] = []
  const wrapper = await mount(Drag, { modelValue: ['甲', '乙'], longPress: false,
    'onUpdate:modelValue': (value: string[]) => updates.push(value),
    onStart: () => events.push('start'), onEnd: () => events.push('end') })
  const item = find(wrapper.root, n => !!n.props.onTouchstart)[0]!
  const event = (y: number) => ({ touches: [{ clientX: 0, clientY: y }], preventDefault() {}, stopPropagation() {} })
  item.props.onTouchstart(event(0))
  env.flush(); await tick(); env.flush(); await tick()
  item.props.onTouchmove(event(80)); item.props.onTouchend()
  assert.deepEqual(updates.at(-1), ['乙', '甲'])
  assert.deepEqual(events, ['start', 'end'])
  const before = adds
  item.props.onTouchstart(event(0)); item.props.onTouchcancel()
  env.flush(); await tick(); env.flush(); await tick()
  assert.equal(adds, before)
  item.props.onTouchstart(event(0)); wrapper.unmount()
  env.flush(); await tick(); env.flush(); await tick()
  assert.equal(adds, before)
})

test('真实ColorPicker与Popover一次点击开关，遮罩关闭后可重开且禁用不打开', async () => {
  const env = fixture()
  const Picker = await loadComponent('reborn-color-picker/RebornColorPicker.vue', ['reborn-popover/RebornPopover.vue'])
  const props = reactive({ disabled: false })
  const wrapper = await mount(Picker, props)
  const click = async () => {
    // 模拟 H5 的 tap 后 click 冒泡；内层如有 tap 处理器也必须执行。
    find(wrapper.root, n => !!n.props.onTap).forEach(n => n.props.onTap())
    find(wrapper.root, n => n.props.id === 'target')[0]!.props.onClick({ stopPropagation() {} })
    await tick(); env.flush(); await tick()
  }
  const mask = () => find(wrapper.root, n => String(n.props.class).includes('fixed inset-0'))[0]
  await click(); assert.ok(mask())
  assert.ok(find(wrapper.root, n => String(n.props.class).includes('rotate-180')).length)
  await click(); assert.equal(mask(), undefined)
  await click(); assert.ok(mask())
  mask()!.props.onClick({ stopPropagation() {} }); await tick(); assert.equal(mask(), undefined)
  assert.equal(find(wrapper.root, n => String(n.props.class).includes('rotate-180')).length, 0)
  await click(); assert.ok(mask())
  mask()!.props.onClick({ stopPropagation() {} }); props.disabled = true; await tick()
  await click(); assert.equal(mask(), undefined)
  wrapper.unmount()
})

for (const name of ['alert', 'badge']) test(`${name}显式空show隐藏，非受控交互后受控相同值仍发更新`, async () => {
  const env = fixture()
  const componentName = name === 'alert' ? 'Alert' : 'Badge'
  const Comp = await loadComponent(`reborn-${name}/Reborn${componentName}.vue`)
  const updates: boolean[] = []
  const props = reactive<Record<string, any>>({ closable: true, label: '标签', title: '提示' })
  const wrapper = await mount(Comp, props)
  const transition = () => env.controls.RebornTransition!.at(-1)!
  assert.equal(transition().props.show, true)
  // 插槽提供真实公开的关闭入口，避免绑定内部实现名。
  wrapper.unmount()
  let dismiss: (event: unknown) => void = () => {}
  const second = await mount(Comp, props, { [name === 'alert' ? 'close-element' : 'close']: ({ close: action }: any) => { dismiss = action; return h('close') } })
  dismiss({ stopPropagation() {} }); await tick()
  assert.equal(transition().props.show, false)
  props.show = undefined
  props['onUpdate:show'] = (value: boolean) => updates.push(value)
  await tick()
  assert.equal(transition().props.show, false)
  dismiss({ stopPropagation() {} }); await tick()
  assert.deepEqual(updates, [false])
  props.show = null; await tick(); assert.equal(transition().props.show, false)
  second.unmount()
})

test('Collapse非受控展开后显式undefined关闭，再展开仍发送update', async () => {
  fixture()
  const Comp = await loadComponent('reborn-collapse/RebornCollapse.vue')
  const props = reactive<Record<string, any>>({})
  const updates: boolean[] = []
  const wrapper = await mount(Comp, props, { default: ({ open }: any) => h('probe', { open }) })
  wrapper.exposed.show(); await tick()
  assert.equal(find(wrapper.root, n => n.type === 'probe')[0]!.props.open, true)
  props.modelValue = undefined; props['onUpdate:modelValue'] = (value: boolean) => updates.push(value); await tick()
  assert.equal(find(wrapper.root, n => n.type === 'probe')[0]!.props.open, false)
  wrapper.exposed.show(); await tick(); assert.deepEqual(updates, [true])
  props.modelValue = null; await tick()
  assert.equal(find(wrapper.root, n => n.type === 'probe')[0]!.props.open, false)
  wrapper.unmount()
})

test('Badge非受控选中后显式undefined，再选中仍发送update与change', async () => {
  fixture()
  const Comp = await loadComponent('reborn-badge/RebornBadge.vue')
  const updates: boolean[] = []
  const changes: boolean[] = []
  const props = reactive<Record<string, any>>({ check: true, onChange: (value: boolean) => changes.push(value) })
  const wrapper = await mount(Comp, props)
  const tap = () => find(wrapper.root, n => !!n.props.onTap)[0]!.props.onTap({})
  tap(); await tick(); assert.equal(changes.at(-1), true)
  props.checked = undefined; props['onUpdate:checked'] = (value: boolean) => updates.push(value); await tick()
  tap(); await tick(); assert.deepEqual(updates, [true]); assert.deepEqual(changes, [true, true])
  wrapper.unmount()
  await delay(1)
})
