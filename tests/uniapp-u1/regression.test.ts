import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
// eslint-disable-next-line test/no-import-node-test -- 沿用仓库可直接执行的 Node 回归测试宿主。
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import { computed, defineComponent, h, nextTick, provide, reactive } from 'vue'
import { z } from 'zod'
import { find, fixture, loadComponent, mount } from './harness'

const tick = async () => { await nextTick(); await nextTick() }
const { FORM_ITEM_KEY, FORM_KEY, useFormInject } = createRequire(import.meta.url)('../../packages/uniapp-project/src/composables/useFieldGroup.ts') as typeof import('../../packages/uniapp-project/src/composables/useFieldGroup')

test('隐藏回顶按钮不能命中或派发点击', async () => {
  fixture()
  const component = await loadComponent('reborn-back-top/RebornBackTop.vue')
  const calls: unknown[] = []
  const props = reactive({ scrollTop: 0, onClick: () => calls.push(1) })
  const wrapper = await mount(component, props)
  const button = find(wrapper.root, n => !!n.props.onTap)[0]!
  assert.equal(button.props.style.pointerEvents, 'none')
  button.props.onTap({ stopPropagation() {} })
  assert.equal(calls.length, 0)
  props.scrollTop = 500
  await tick()
  button.props.onTap({ stopPropagation() {} })
  assert.equal(calls.length, 1)
  wrapper.unmount()
})

test('Collapse公开方法写回模型，快速切换时旧测量不复活', async () => {
  const env = fixture()
  const component = await loadComponent('reborn-collapse/RebornCollapse.vue')
  const updates: boolean[] = []
  const wrapper = await mount(component, { 'onUpdate:modelValue': (v: boolean) => updates.push(v) })
  wrapper.exposed.show()
  await tick()
  assert.equal(updates.at(-1), true)
  wrapper.exposed.hide()
  await tick()
  assert.equal(updates.at(-1), false)
  wrapper.unmount()
  env.flush()
})

test('ColorPickerPanel草稿完整提交且外部赋值不回传', async () => {
  const env = fixture()
  const component = await loadComponent('reborn-color-picker/RebornColorPickerPanel.vue')
  const updates: string[] = []
  const changes: string[] = []
  const props = reactive({ modelValue: '#000000', 'onUpdate:modelValue': (v: string) => updates.push(v), onChange: (v: string) => changes.push(v) })
  const wrapper = await mount(component, props)
  const input = env.controls.RebornInput![0]
  input.emit('focus')
  input.emit('update:modelValue', '#12')
  await tick()
  assert.equal(input.props.modelValue, '#12')
  assert.equal(updates.length, 0)
  input.emit('update:modelValue', '#ff0000')
  input.emit('blur')
  await tick()
  assert.equal(updates.at(-1), '#ff0000')
  assert.equal(changes.length, 1)
  const count = updates.length
  props.modelValue = '#00FF00'
  await tick()
  assert.equal(updates.length, count)
  assert.equal(changes.length, 1)
  input.emit('focus')
  input.emit('update:modelValue', '#f008')
  input.emit('blur')
  await tick()
  assert.match(updates.at(-1)!, /^#ff0000/i)
  wrapper.unmount()
})

test('ColorPickerPanel受控格式尚未回流时change携带新格式', async () => {
  const env = fixture()
  const component = await loadComponent('reborn-color-picker/RebornColorPickerPanel.vue')
  const changes: string[] = []
  const wrapper = await mount(component, { modelValue: '#ff0000', format: 'hex', 'onUpdate:format': () => {}, onChange: (value: string) => changes.push(value) })
  env.controls.RebornButton![1]!.emit('tap')
  assert.match(changes.at(-1)!, /^rgb\(/)
  wrapper.unmount()
})

test('Cascader懒加载丢弃旧根请求且关闭后不跳转到旧分支', async () => {
  fixture()
  const component = await loadComponent('reborn-cascader/RebornCascader.vue')
  const pending: ((value: any[]) => void)[] = []
  const props = reactive({ options: [] as any[], lazy: true, lazyLoad: (_node: unknown, resolve: (value: any[]) => void) => pending.push(resolve) })
  const wrapper = await mount(component, props)
  const first = wrapper.exposed.open()
  const second = wrapper.exposed.open()
  pending[1]!([{ label: '新根', value: 'new', leaf: true }])
  await second
  pending[0]!([{ label: '旧根', value: 'old', leaf: true }])
  await first
  await tick()
  assert.ok(find(wrapper.root, n => n.text === '新根').length)
  assert.equal(find(wrapper.root, n => n.text === '旧根').length, 0)
  props.options = [{ label: '分支', value: 'branch' }]
  await tick()
  const item = find(wrapper.root, n => !!n.props.onTap && String(n.props.class).includes('justify-between'))[0]!
  const loading = item.props.onTap()
  wrapper.exposed.close()
  props.options = [{ label: '替代', value: 'replacement', leaf: true }]
  await tick()
  pending[2]!([{ label: '过期子项', value: 'stale', leaf: true }])
  await loading
  await tick()
  assert.equal(find(wrapper.root, n => n.text === '过期子项').length, 0)
  wrapper.unmount()
})

test('Badge透传根属性且Input透传实际输入属性并响应外部修改', async () => {
  fixture()
  const badge = await loadComponent('reborn-badge/RebornBadge.vue')
  const b = await mount(badge, { id: 'badge', 'aria-label': '徽章' })
  assert.equal(find(b.root, n => n.props.id === 'badge')[0]?.props['aria-label'], '徽章')
  b.unmount()
  const input = await loadComponent('reborn-input/RebornInput.vue')
  const props = reactive({ name: 'field', spellcheck: false, class: 'outer-style', type: 'text' })
  const wrapper = await mount(input, props)
  assert.equal(find(wrapper.root, n => n.type === 'input')[0]?.props.name, 'field')
  assert.equal(find(wrapper.root, n => n.type === 'input')[0]?.props.spellcheck, false)
  assert.ok(find(wrapper.root, n => String(n.props.class).includes('outer-style')).length)
  props.name = 'changed'
  props.type = 'textarea'
  await tick()
  assert.equal(find(wrapper.root, n => n.type === 'textarea')[0]?.props.name, 'changed')
  wrapper.unmount()
})

test('Image替换src后退出旧错误态并重新加载', async () => {
  fixture()
  const component = await loadComponent('reborn-image/RebornImage.vue')
  const props = reactive({ src: 'first.png' })
  const wrapper = await mount(component, props)
  find(wrapper.root, n => n.type === 'image')[0]!.props.onError({})
  await tick()
  assert.ok(find(wrapper.root, n => String(n.props.class).includes('i-lucide-image-off')).length)
  props.src = 'second.png'
  await tick()
  assert.equal(find(wrapper.root, n => String(n.props.class).includes('i-lucide-image-off')).length, 0)
  assert.equal(find(wrapper.root, n => n.type === 'image')[0]!.props.src, 'second.png')
  wrapper.unmount()
})

test('UniApp仅消费Symbol上下文且null隔离外层表单与表单项', async () => {
  fixture()
  let calls = 0
  const Control = defineComponent({ setup() {
    const state = useFormInject({ size: 'md' })
    state.validate('change')
    return () => h('probe', { size: state.size.value, error: state.isError.value })
  } })
  const context = { props: { size: 'lg' }, addField() {}, removeField() {}, getError: () => '', validateField: async () => null }
  const item = { isError: computed(() => true), validate: () => { calls++ } }
  const Outer = defineComponent({ setup(_, { slots }) {
    provide(FORM_KEY, context)
    provide(FORM_ITEM_KEY, item)
    return () => slots.default?.()
  } })
  const Barrier = defineComponent({ setup(_, { slots }) {
    provide(FORM_KEY, null as any)
    provide(FORM_ITEM_KEY, null as any)
    return () => slots.default?.()
  } })
  const StringProvider = defineComponent({ setup(_, { slots }) {
    provide('rebornForm', context)
    provide('rebornFormItem', item)
    return () => slots.default?.()
  } })
  const outer = await mount(Outer, {}, { default: () => h(Control) })
  assert.equal(find(outer.root, n => n.type === 'probe')[0]!.props.size, 'lg')
  assert.equal(calls, 1)
  outer.unmount()
  const barrier = await mount(Outer, {}, { default: () => h(Barrier, {}, { default: () => h(Control) }) })
  const probe = find(barrier.root, n => n.type === 'probe')[0]!
  assert.equal(probe.props.size, 'md')
  assert.equal(probe.props.error, false)
  assert.equal(calls, 1)
  barrier.unmount()
  const legacy = await mount(StringProvider, {}, { default: () => h(Control) })
  assert.equal(find(legacy.root, n => n.type === 'probe')[0]!.props.size, 'md')
  assert.equal(find(legacy.root, n => n.type === 'probe')[0]!.props.error, false)
  assert.equal(calls, 1)
  legacy.unmount()
})

test('Breadcrumb插槽中间插入与换序后末项分隔符保持正确', async () => {
  fixture()
  const component = await loadComponent('reborn-breadcrumb/RebornBreadcrumb.vue')
  const item = await loadComponent('reborn-breadcrumb/RebornBreadcrumbItem.vue')
  const ids = reactive(['甲', '丙'])
  const props = reactive({ separator: '/' })
  const wrapper = await mount(component, props, { default: () => ids.map(id => h(item, { key: id }, { default: () => h('text', id) })) })
  ids.splice(1, 0, '乙')
  await tick()
  const items = () => find(wrapper.root, n => String(n.props.class).split(' ').includes('reborn-breadcrumb-item'))
  assert.equal(String(items()[1]!.children.at(-1)!.props.class).includes('hidden'), false)
  assert.equal(String(items()[2]!.children.at(-1)!.props.class).includes('hidden'), true)
  props.separator = '>'
  await tick()
  assert.equal(find(wrapper.root, n => n.text === '/').length, 0)
  assert.equal(find(wrapper.root, n => n.text === '>').length, 3)
  ids.splice(0, 3, '丙', '甲', '乙')
  await tick()
  assert.equal(String(items()[1]!.children.at(-1)!.props.class).includes('hidden'), false)
  assert.equal(String(items()[2]!.children.at(-1)!.props.class).includes('hidden'), true)
  wrapper.unmount()
})

for (const platform of ['uniapp', 'web'] as const) test(`${platform} Form字段竞态等待最新结果且清除重置使旧结果失效`, async () => {
  fixture()
  const component = await loadComponent('reborn-form/RebornForm.vue', [], platform)
  const pending: ((value: any) => void)[] = []
  const rules = { safeParseAsync: () => new Promise(resolve => pending.push(resolve)) }
  const wrapper = await mount(component, { modelValue: { name: '' }, rules, scrollToError: false })
  const first = wrapper.exposed.validateField('name')
  const second = wrapper.exposed.validateField('name')
  pending[0]!({ success: false, error: { issues: [{ path: ['name'], message: '旧错误' }] } })
  pending[1]!({ success: true })
  assert.deepEqual(await Promise.all([first, second]), [null, null])
  const third = wrapper.exposed.validateField('name')
  wrapper.exposed.clearValidate()
  pending[2]!({ success: false, error: { issues: [{ path: ['name'], message: '已清除' }] } })
  assert.equal(await third, null)
  const fourth = wrapper.exposed.validateField('name')
  wrapper.exposed.resetFields()
  pending[3]!({ success: false, error: { issues: [{ path: ['name'], message: '重置前' }] } })
  assert.equal(await fourth, null)
  wrapper.unmount()
})

test('Fab显式true不被active默认false覆盖且每个动作只派发一次', async () => {
  fixture()
  const component = await loadComponent('reborn-fab/RebornFab.vue')
  const updates: boolean[] = []
  const actions: unknown[] = []
  const wrapper = await mount(component, { modelValue: true, expandable: true, items: [{ name: 'a', icon: 'x' }], 'onUpdate:modelValue': (v: boolean) => updates.push(v), onAction: (v: unknown) => actions.push(v) })
  assert.equal(updates.length, 0)
  const button = find(wrapper.root, n => !!n.props.onTap && !n.props.id)[0]!
  assert.equal(button.props.onClick, undefined)
  button.props.onTap({ stopPropagation() {} })
  assert.equal(actions.length, 1)
  wrapper.unmount()
})

test('Cascader非受控模型重开保留已提交路径', async () => {
  fixture()
  const component = await loadComponent('reborn-cascader/RebornCascader.vue')
  const changes: unknown[] = []
  const wrapper = await mount(component, { options: [{ label: '甲', value: 'a', leaf: true }], onChange: (value: unknown) => changes.push(value) })
  await wrapper.exposed.open()
  await tick()
  const item = find(wrapper.root, n => n.props.onTap && String(n.props.class).includes('justify-between'))[0]
    ?? find(wrapper.root, n => n.props.onTap && String(n.props.class).includes('reborn-cascader-item'))[0]
  assert.ok(item, JSON.stringify(find(wrapper.root, n => !!n.props.onTap).map(n => ({ type: n.type, class: n.props.class, text: n.text }))))
  item.props.onTap()
  await tick()
  assert.deepEqual(changes.at(-1), ['a'])
  await wrapper.exposed.open()
  await tick()
  wrapper.unmount()
})

test('DatePicker非受控确认后重开不丢失已选值', async () => {
  const env = fixture()
  const component = await loadComponent('reborn-date-picker/RebornDatePicker.vue')
  const changes: string[] = []
  const wrapper = await mount(component, { onChange: (v: string) => changes.push(v) })
  wrapper.exposed.setValue('2024-06-07 08:09:10')
  wrapper.exposed.confirm()
  await tick()
  assert.ok(changes[0]?.includes('2024'))
  const trigger = env.controls.RebornSelectTrigger![0]
  const before = trigger.props.modelValue
  wrapper.exposed.open()
  await tick()
  assert.equal(trigger.props.modelValue, before)
  assert.equal(trigger.props.focus, true)
  wrapper.unmount()
})

test('Form嵌套快照连续重置、单次解析与Symbol字段注册', async () => {
  fixture()
  const component = await loadComponent('reborn-form/RebornForm.vue', ['reborn-form/RebornFormItem.vue'])
  const item = await loadComponent('reborn-form/RebornFormItem.vue')
  const model = reactive({ contacts: [{ name: '初始' }], optional: undefined as string | undefined })
  let parses = 0
  const rules = z.object({ contacts: z.array(z.object({ name: z.string().min(1) })).optional(), optional: z.string().optional() }).superRefine(() => { parses++ })
  const wrapper = await mount(component, { modelValue: model, rules, scrollToError: false }, { default: () => [h(item, { prop: 'contacts-0-name' }), h(item, { prop: 'optional' })] })
  model.contacts[0]!.name = '第一次'
  wrapper.exposed.resetFields()
  model.contacts[0]!.name = '第二次'
  model.optional = '已有值'
  wrapper.exposed.resetFields()
  assert.equal(model.contacts[0]!.name, '初始')
  assert.equal(model.optional, undefined)
  assert.equal(wrapper.exposed.fields.size, 2)
  assert.equal(await wrapper.exposed.validate(), true)
  assert.equal(parses, 1)
  wrapper.unmount()
})

test('Draggable保留元素身份、数组原地新增同步且轻触start先于end', async () => {
  const env = fixture()
  const component = await loadComponent('reborn-draggable/RebornDraggable.vue')
  const original = { title: '甲' }
  const list = reactive([original, '乙'])
  const events: string[] = []
  const wrapper = await mount(component, { modelValue: list, longPress: false, onStart: () => events.push('start'), onEnd: () => events.push('end') })
  list.push('丙')
  await tick()
  const items = find(wrapper.root, n => !!n.props.onTouchstart)
  assert.equal(items.length, 3)
  const event = { touches: [{ clientX: 0, clientY: 0 }], preventDefault() {}, stopPropagation() {} }
  const pending = items[0]!.props.onTouchstart(event)
  items[0]!.props.onTouchend()
  assert.deepEqual(events, ['start', 'end'])
  env.flush()
  await pending
  assert.deepEqual(events, ['start', 'end'])
  assert.equal(Object.hasOwn(original, 'uid'), false)
  wrapper.unmount()
})

for (const target of ['H5', 'MP-WEIXIN'] as const) test(`${target} Draggable50项跟手位移不重跑未拖动项插槽`, async () => {
  const env = fixture()
  const component = await loadComponent('reborn-draggable/RebornDraggable.vue', [], 'uniapp', target)
  const counts = Array.from({ length: 50 }, () => 0)
  const wrapper = await mount(component, { modelValue: counts.map((_, id) => ({ id })), longPress: false }, { item: ({ index }: { index: number }) => { counts[index]!++; return h('heavy', String(index)) } })
  const items = find(wrapper.root, n => !!n.props.onTouchstart)
  assert.equal(items.length, 50)
  const event = (value: number) => ({ touches: [{ clientX: value, clientY: value }], cancelable: true, preventDefault() {}, stopPropagation() {} })
  items[0]!.props.onTouchstart(event(0))
  await tick()
  env.flush()
  await tick()
  env.flush()
  await tick()
  const before = [...counts]
  for (const value of [1, 2, 3]) { items[0]!.props.onTouchmove(event(value)); await tick() }
  assert.deepEqual(counts.slice(1), before.slice(1))
  assert.deepEqual(counts, before)
  // H5 位移继续更新，但独立业务内容不依赖跟手坐标。
  if (target === 'H5') assert.equal(items[0]!.props.style.transform, 'translate(3px, 3px)')
  items[0]!.props.onTouchcancel()
  wrapper.unmount()
})

test('Draggable WXS只写当前项的transform，非拖拽滚动不写样式', () => {
  const source = readFileSync('packages/uniapp-project/src/components/reborn-draggable/RebornDraggable.vue', 'utf8')
  const body = source.match(/<script module="dragWxs" lang="wxs">([\s\S]*?)<\/script>/)![1]!
  const module = { exports: {} as any }
  runInNewContext(body, { module })
  const styles: any[] = []
  const selected: string[] = []
  const owner = { selectComponent(selector: string) { selected.push(selector); return { setStyle(style: any) { styles.push(style) } } } }
  const event = { currentTarget: { dataset: { dragging: false, startX: 10, startY: 20 } }, touches: [{ clientX: 15, clientY: 27 }] }
  assert.equal(module.exports.touchmove(event, owner), true)
  assert.equal(styles.length, 0)
  event.currentTarget.dataset.dragging = true
  assert.equal(module.exports.touchmove(event, owner), false)
  assert.equal(styles[0].transform, 'translate(5px, 7px)')
  assert.deepEqual(selected, ['.reborn-draggable__item--dragging'])
  module.exports.touchend(event, owner)
  assert.equal(styles[1].transform, '')
})
