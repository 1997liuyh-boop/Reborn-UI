/* eslint test/no-import-node-test: off -- 使用仓库现有测试运行器 */
import assert from 'node:assert/strict'
import { after, it } from 'node:test'
import { installDom } from '../composables/harness'
import { createFixture as createComponentFixture, loadComponent } from '../uniapp-u3/harness.mjs'
import { createFixture, loadUniDemo } from './harness'

const dom = installDom()
const vue = await import('vue')
const { createApp, h, nextTick, shallowRef } = vue
const { loadComponent: loadRealComponent } = await import('../uniapp-u1/harness')
after(() => dom.window.close())
const base = 'packages/uniapp-project/src/pages/reborn-qrcode/'
const Basic = await loadUniDemo(`${base}components/ConfigBasic.vue`)
const Shape = await loadUniDemo(`${base}components/ConfigShape.vue`)
const Logo = await loadUniDemo(`${base}components/ConfigLogo.vue`)

it('Textarea 默认可编辑，父级只读和表单禁用切换真实原生禁用态', async () => {
  const fixture = createComponentFixture(vue)
  const { component } = await loadComponent('reborn-textarea/RebornTextarea.vue', false)
  const readonly = shallowRef(false)
  const model = shallowRef('原文')
  const host = document.createElement('div')
  const app = createApp({ render: () => h(component, {
    readonly: readonly.value, modelValue: model.value,
    'onUpdate:modelValue': (value: string) => { model.value = value },
  }) })
  app.config.warnHandler = () => {}
  app.mount(host)
  try {
    const textarea = host.querySelector('textarea')!
    assert.equal(textarea.disabled, false)
    readonly.value = true
    await nextTick()
    assert.equal(textarea.disabled, true)
    readonly.value = false
    fixture.disabled.value = true
    await nextTick()
    assert.equal(textarea.disabled, true)
    fixture.disabled.value = false
    await nextTick()
    assert.equal(textarea.disabled, false)
    textarea.dispatchEvent(new dom.window.CustomEvent('input', { detail: { value: '新文', cursor: 2 } }))
    await nextTick()
    assert.equal(model.value, '新文')
    assert.equal(textarea.value, '新文')
  }
  finally { app.unmount() }
})

it('Input样式透传保留字符串、对象、数组和父级后续更新', async () => {
  const component = await loadRealComponent('reborn-input/RebornInput.vue')
  const style = shallowRef<unknown>('color: red; margin-top: 1px')
  const host = document.createElement('div')
  const app = createApp({ render: () => h(component, { style: style.value }) })
  app.config.warnHandler = () => {}
  app.mount(host)
  try {
    const root = host.firstElementChild as HTMLElement
    assert.equal(root.style.color, 'red')
    assert.equal(root.style.marginTop, '1px')
    style.value = [{ color: 'blue', marginTop: '2px' }, { marginTop: '3px' }]
    await nextTick()
    assert.equal(root.style.color, 'blue')
    assert.equal(root.style.marginTop, '3px')
    style.value = { color: 'green', marginTop: '4px' }
    await nextTick()
    assert.equal(root.style.color, 'green')
    assert.equal(root.style.marginTop, '4px')
  }
  finally { app.unmount() }
})

it('二维码基础选项只接纳当前合法选项，宽事件值不污染父模型', async () => {
  const fixture = createFixture()
  const original = Object.freeze({ text: '原文', margin: 1, ecc: 2 })
  const model = shallowRef(original)
  const app = createApp({ render: () => h(Basic, {
    modelValue: model.value, marginOptions: [{ value: 0, name: '无' }, { value: 1, name: '小' }],
    errorLevels: [{ value: 2, name: '高' }, { value: 3, name: '中' }],
    'onUpdate:modelValue': value => { model.value = value },
  }) })
  app.config.warnHandler = () => {}
  app.mount(document.createElement('div'))
  try {
    const [margin, ecc] = fixture.controls.RebornRadioGroup!
    for (const value of [false, '0', 99]) margin!.emit('update:modelValue', value)
    for (const value of [true, '3', 99]) ecc!.emit('update:modelValue', value)
    await nextTick()
    assert.equal(model.value, original)
    margin!.emit('update:modelValue', 0)
    await nextTick()
    ecc!.emit('update:modelValue', 3)
    await nextTick()
    assert.deepEqual(model.value, { text: '原文', margin: 0, ecc: 3 })
    assert.deepEqual(original, { text: '原文', margin: 1, ecc: 2 })
  }
  finally { app.unmount() }
})

it('二维码形状选项按所属集合收窄，非法值拒绝且合法0值可写回', async () => {
  const fixture = createFixture()
  const original = Object.freeze({ dotsType: 'rect', cornersSquareType: 20, cornersDotType: 5 })
  const model = shallowRef(original)
  const app = createApp({ render: () => h(Shape, {
    modelValue: model.value, dotsStyles: [{ type: 'rect', name: '方' }, { type: 'line', name: '线' }],
    cornersSquareStyles: [{ type: 0, name: '方' }, { type: 20, name: '圆' }],
    cornersDotStyles: [{ type: 0, name: '方' }, { type: 5, name: '圆' }],
    'onUpdate:modelValue': value => { model.value = value },
  }) })
  app.config.warnHandler = () => {}
  app.mount(document.createElement('div'))
  try {
    const [dots, square, dot] = fixture.controls.RebornRadioGroup!
    for (const value of [false, 1, '不存在']) dots!.emit('update:modelValue', value)
    for (const value of [true, '0', 5]) square!.emit('update:modelValue', value)
    for (const value of [false, '0', 20]) dot!.emit('update:modelValue', value)
    await nextTick()
    assert.equal(model.value, original)
    dots!.emit('update:modelValue', 'line')
    await nextTick()
    square!.emit('update:modelValue', 0)
    await nextTick()
    dot!.emit('update:modelValue', 0)
    await nextTick()
    assert.deepEqual(model.value, { dotsType: 'line', cornersSquareType: 0, cornersDotType: 0 })
    assert.deepEqual(original, { dotsType: 'rect', cornersSquareType: 20, cornersDotType: 5 })
  }
  finally { app.unmount() }
})

it('Logo原生开关保留两个方向的布尔事件写回，并拒绝普通DOM事件', async () => {
  createFixture()
  const original = Object.freeze({ logoImage: '/logo.png', logoShadow: false, logoHideBackgroundDots: true })
  const model = shallowRef(original)
  const host = document.createElement('div')
  const app = createApp({ render: () => h(Logo, {
    modelValue: model.value, logoSizeOptions: [], logoMarginOptions: [],
    'onUpdate:modelValue': value => { model.value = value },
  }) })
  app.config.warnHandler = () => {}
  app.mount(host)
  try {
    const [shadow, background] = host.querySelectorAll('switch')
    shadow!.dispatchEvent(new dom.window.CustomEvent('change', { detail: { value: true } }))
    await nextTick()
    background!.dispatchEvent(new dom.window.CustomEvent('change', { detail: { value: false } }))
    await nextTick()
    assert.deepEqual(model.value, { logoImage: '/logo.png', logoShadow: true, logoHideBackgroundDots: false })
    const changed = model.value
    shadow!.dispatchEvent(new dom.window.Event('change'))
    background!.dispatchEvent(new dom.window.CustomEvent('change', { detail: { value: 'false' } }))
    await nextTick()
    assert.equal(model.value, changed)
    assert.deepEqual(original, { logoImage: '/logo.png', logoShadow: false, logoHideBackgroundDots: true })
  }
  finally { app.unmount() }
})
