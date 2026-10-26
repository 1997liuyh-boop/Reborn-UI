/* eslint test/no-import-node-test: off -- 使用仓库现有测试运行器 */
import assert from 'node:assert/strict'
import { after, it } from 'node:test'
import { installDom } from '../composables/harness'
import { createFixture, loadUniDemo } from './harness'

const dom = installDom()
const { createApp, h, nextTick, shallowRef } = await import('vue')
after(() => dom.window.close())
const base = 'packages/uniapp-project/src/pages/reborn-qrcode/'
const Basic = await loadUniDemo(`${base}components/ConfigBasic.vue`)
const ColorModal = await loadUniDemo(`${base}components/ColorPickerModal.vue`)
const Preview = await loadUniDemo(`${base}components/PreviewSection.vue`)
/** 页面级夹具：弹窗与预览替换成只记录 props / emit 的替身，静态图片替换成字符串 */
const recorder = (name: string) => `const {defineComponent}=require('vue');export default defineComponent({
  props:['open','color','gradient','background','image','images','config','isGenerating','modalOpen'],emits:['apply','update:open'],
  setup(props,{emit}){(globalThis.__uniDemo.controls[${JSON.stringify(name)}]??=[]).push({props,slots:{},emit});return()=>null}});`
const QrcodeDemo = await loadUniDemo(`${base}RebornQrcodeDemo.vue`, {
  './components/ColorPickerModal.vue': recorder('ColorPickerModal'),
  './components/GradientEditorModal.vue': recorder('GradientEditorModal'),
  './components/ForegroundImageModal.vue': recorder('ForegroundImageModal'),
  './components/PreviewSection.vue': recorder('PreviewSection'),
  ...Object.fromEntries([1, 2, 3, 4, 5, 6].map(index => [`@/static/${index}.jpeg`, `export default 'bg${index}.jpeg'`])),
})

it('配置控件整体替换父模型，冻结的旧对象不被直接改写', async () => {
  const fixture = createFixture()
  const original = Object.freeze({ text: 'old', margin: 1, ecc: 2 })
  const model = shallowRef(original)
  const app = createApp({ render: () => h(Basic, {
    modelValue: model.value, marginOptions: [], errorLevels: [],
    'onUpdate:modelValue': value => { model.value = value },
  }) })
  app.config.warnHandler = () => {}
  app.mount(document.createElement('div'))
  try {
    fixture.controls.RebornTextarea![0]!.emit('update:modelValue', 'new')
    await nextTick()
    assert.notEqual(model.value, original)
    assert.equal(model.value.text, 'new')
    assert.equal(original.text, 'old')
    assert.equal(model.value.margin, 1)
  }
  finally { app.unmount() }
})

it('自定义颜色逐键输入保留弹窗，非法值拒绝提交，合法值确认后提交', async () => {
  const fixture = createFixture()
  const open = shallowRef(false)
  const applied: string[] = []
  const root = document.createElement('div')
  const app = createApp({ render: () => h(ColorModal, {
    open: open.value, color: '#000000', onApply: (value: string) => applied.push(value),
    'onUpdate:open': (value: boolean) => { open.value = value },
  }) })
  app.mount(root)
  try {
    open.value = true
    await nextTick()
    const control = fixture.controls.RebornInput![0]!
    assert.equal(control.props.modelValue, '#000000')
    control.emit('update:modelValue', '#12345')
    await nextTick()
    assert.equal(open.value, true)
    assert.equal(applied.length, 0)
    control.emit('confirm')
    await nextTick()
    assert.equal(open.value, true)
    assert.equal(applied.length, 0)
    control.emit('update:modelValue', '#123456')
    await nextTick()
    control.emit('confirm')
    await nextTick()
    assert.deepEqual(applied, ['#123456'])
    assert.equal(open.value, false)
  }
  finally { app.unmount() }
})

it('预览按钮状态更新不改变绘图配置引用，模板引用不经模型外泄', async () => {
  const fixture = createFixture()
  const busy = shallowRef(false)
  const config = {
    text: 'test', margin: 1, ecc: 2, dotsType: 'rect', dotsColor: '#000000',
    backgroundColor: '#ffffff', logoSize: 'medium', logoMargin: 'small', logoShape: 'rectangle',
  }
  const updates: unknown[] = []
  const app = createApp({ render: () => h(Preview, {
    config, isGenerating: busy.value,
    'onUpdate:qrcodeRef': (value: unknown) => updates.push(value),
  }) })
  app.config.warnHandler = () => {}
  app.mount(document.createElement('div'))
  try {
    const props = fixture.controls.RebornQrcode![0]!.props
    const before = [props.logoOptions, props.cornersSquareOptions, props.cornersDotOptions]
    busy.value = true
    await nextTick()
    assert.deepEqual([props.logoOptions, props.cornersSquareOptions, props.cornersDotOptions], before)
    assert.equal(props.logoOptions, before[0])
    assert.equal(props.cornersSquareOptions, before[1])
    assert.equal(updates.length, 0)
  }
  finally { app.unmount() }
})

it('前景图：选图保留已改的前景色，清除才复位为黑色，未选图直接应用不改颜色', async () => {
  const fixture = createFixture()
  const app = createApp({ render: () => h(QrcodeDemo) })
  app.config.warnHandler = () => {}
  app.mount(document.createElement('div'))
  try {
    const config = () => fixture.controls.PreviewSection![0]!.props.config
    const colorModal = fixture.controls.ColorPickerModal![0]!
    const imageModal = fixture.controls.ForegroundImageModal![0]!
    colorModal.emit('apply', '#ff0000')
    await nextTick()
    assert.equal(config().dotsColor, '#ff0000')
    imageModal.emit('apply', null)
    await nextTick()
    assert.equal(config().dotsColor, '#ff0000', '没有前景图时直接应用不应复位颜色')
    imageModal.emit('apply', 'texture.jpeg')
    await nextTick()
    assert.equal(config().dotsImage, 'texture.jpeg')
    assert.equal(config().dotsGradient, null)
    assert.equal(config().dotsColor, '#ff0000', '码眼与 pdColor 取 dotsColor，选图不能把它复位')
    imageModal.emit('apply', null)
    await nextTick()
    assert.equal(config().dotsImage, null)
    assert.equal(config().dotsColor, '#000000')
  }
  finally { app.unmount() }
})
