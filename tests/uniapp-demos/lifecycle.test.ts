/* eslint test/no-import-node-test: off -- 使用仓库现有测试运行器 */
import assert from 'node:assert/strict'
import { after, it } from 'node:test'
import { installDom } from '../composables/harness'
import { createFixture, loadUniDemo } from './harness'

const dom = installDom()
const { createApp, h, nextTick } = await import('vue')
after(() => dom.window.close())
const inputNumber = await loadUniDemo('packages/uniapp-project/src/pages/reborn-input-number/RebornInputNumberDemo.vue')

it('数字输入框各个演示和变体独立持有模型', async () => {
  const fixture = createFixture()
  const app = createApp({ render: () => h(inputNumber) })
  app.config.warnHandler = () => {}
  app.mount(document.createElement('div'))
  try {
    const inputs = fixture.controls.RebornInputNumber!
    const before = inputs.map(input => input.props.modelValue)
    assert.ok(inputs.length > 10)
    for (const [index, input] of inputs.entries()) {
      input.emit('update:modelValue', 40 + index)
      await nextTick()
      assert.deepEqual(inputs.map(control => control.props.modelValue), before.map((value, current) => current <= index ? 40 + current : value))
    }
  }
  finally { app.unmount() }
})

const tabsDemo = await loadUniDemo('packages/uniapp-project/src/pages/reborn-tabs/RebornTabsDemo.vue', {
  // 标签栏替身声明 activeKey，记录 v-model:active-key 的当前值；面板沿用通用替身
  '@/components/reborn-tabs/RebornTabs.vue': `const {defineComponent,h}=require('vue');export default defineComponent({
    inheritAttrs:false,props:['activeKey','type','color','ui'],emits:['update:activeKey'],
    setup(props,{emit,slots}){(globalThis.__uniDemo.controls.RebornTabs??=[]).push({props,slots,emit});return()=>h('div',slots.default?.())}});`,
})

it('Tabs 样式定制两例各自持有选中项，切换时不带动「类型」一节及其他示例', async () => {
  const fixture = createFixture()
  const app = createApp({ render: () => h(tabsDemo) })
  app.config.warnHandler = () => {}
  app.mount(document.createElement('div'))
  try {
    const tabs = fixture.controls.RebornTabs!
    const colorTabs = tabs.find(tab => tab.props.color === 'success')!
    const uiTabs = tabs.find(tab => String(tab.props.ui?.indicator ?? '').includes('h-[8rpx]'))!
    assert.ok(colorTabs && uiTabs && colorTabs !== uiTabs)
    for (const target of [colorTabs, uiTabs]) {
      const before = tabs.map(tab => tab.props.activeKey)
      target.emit('update:activeKey', 'doing')
      await nextTick()
      assert.deepEqual(tabs.map(tab => tab.props.activeKey), tabs.map((tab, index) => tab === target ? 'doing' : before[index]))
    }
  }
  finally { app.unmount() }
})

const slideVerifyDemo = await loadUniDemo('packages/uniapp-project/src/pages/reborn-slide-verify/RebornSlideVerifyDemo.vue', {
  // 滑块验证替身不渲染插槽（自定义插槽示例依赖作用域参数），只记录 emit
  '@/components/reborn-slide-verify/RebornSlideVerify.vue': `const {defineComponent}=require('vue');export default defineComponent({
    inheritAttrs:false,emits:['success','fail'],setup(props,{emit,slots}){(globalThis.__uniDemo.controls.RebornSlideVerify??=[]).push({props,slots,emit});return()=>null}});`,
})

it('SlideVerify 事件记录只保留最近 6 条，最新的在最前', async () => {
  const fixture = createFixture()
  const root = document.createElement('div')
  const app = createApp({ render: () => h(slideVerifyDemo) })
  app.config.warnHandler = () => {}
  app.mount(root)
  try {
    const basic = fixture.controls.RebornSlideVerify![0]!
    for (let index = 0; index < 10; index++) basic.emit(index % 2 ? 'fail' : 'success')
    await nextTick()
    const log = [...root.querySelectorAll('text')].find(el => el.textContent!.includes('基础示例'))!
    const lines = log.textContent!.split('\n')
    assert.equal(lines.length, 6)
    assert.ok(lines[0]!.endsWith('基础示例 未滑动到终点'), '最后一次是 fail，应排在最前')
  }
  finally { app.unmount() }
})

for (const [name, size] of [['Loadmore', 10], ['Waterfall', 4]] as const) {
  const Page = await loadUniDemo(`packages/uniapp-project/src/pages/reborn-${name.toLowerCase()}/Reborn${name}Demo.vue`)
  it(`${name} 离开页面后取消尚未完成的模拟请求`, async (ctx) => {
    const fixture = createFixture()
    const root = document.createElement('div')
    const app = createApp({ render: () => h(Page) })
    app.config.warnHandler = () => {}
    ctx.mock.timers.enable({ apis: ['setTimeout'] })
    app.mount(root)
    fixture.hooks.load.forEach(fn => fn())
    ctx.mock.timers.tick(900)
    await nextTick()
    assert.equal(name === 'Waterfall' ? fixture.appended.length : root.querySelectorAll('[data-title]').length / 2, size)
    fixture.hooks.reach.forEach(fn => fn())
    app.unmount()
    ctx.mock.timers.tick(5000)
    await nextTick()
    assert.equal(fixture.appended.length, name === 'Waterfall' ? size : 0)
  })
}

for (const [directory, name, slot] of [['empty', 'Empty', 'extra'], ['result', 'Result', 'extra'], ['textarea', 'Textarea', 'limit']] as const) {
  const Page = await loadUniDemo(`packages/uniapp-project/src/pages/reborn-${directory}/Reborn${name}Demo.vue`)
  it(`${name} 关闭条件插槽时换成不声明该插槽的实例`, async () => {
    const fixture = createFixture()
    const app = createApp({ render: () => h(Page) })
    app.config.warnHandler = () => {}
    app.mount(document.createElement('div'))
    try {
      const toggles = fixture.controls.RebornSwitch!
      const toggle = directory === 'textarea' ? toggles[2]! : toggles[1]!
      const count = fixture.controls[`Reborn${name}`]!.length
      toggle.emit('update:modelValue', directory === 'textarea')
      await nextTick()
      const control = fixture.controls[`Reborn${name}`]!.slice(count).find(item => Boolean(item.slots[slot]) === (directory === 'textarea'))
      assert.ok(control)
      toggle.emit('update:modelValue', directory !== 'textarea')
      await nextTick()
      const latest = fixture.controls[`Reborn${name}`]!.at(-1)!
      assert.equal(Boolean(latest.slots[slot]), directory !== 'textarea')
    }
    finally { app.unmount() }
  })
}

const toastCalls: { method: string, options?: Record<string, unknown> }[] = []
const promises: (() => void)[] = []
Object.assign(globalThis, { __toastDemo: { calls: toastCalls, promises } })
const Toast = await loadUniDemo('packages/uniapp-project/src/pages/reborn-toast/RebornToastDemo.vue', {
  '@/components/reborn-toast/index': `
    const fixture=globalThis.__toastDemo;
    export const messageTypes=['success','error','info','warning','loading'];
    export const messageVariants=['base','filled'];
    export const message=Object.fromEntries(['success','error','info','warning','loading','config','destroy'].map(method=>[method,options=>{
      fixture.calls.push({method,options});
      return method==='loading'?new Promise(resolve=>fixture.promises.push(resolve)):Promise.resolve();
    }]));
  `,
})

it('Toast 连续触发取消旧更新，卸载后不弹出后续消息并恢复配置', async (ctx) => {
  createFixture()
  toastCalls.length = 0
  promises.length = 0
  const root = document.createElement('div')
  const app = createApp({ render: () => h(Toast) })
  app.config.warnHandler = () => {}
  ctx.mock.timers.enable({ apis: ['setTimeout'] })
  app.mount(root)
  const button = (label: string) => [...root.querySelectorAll<HTMLElement>('[data-control="RebornButton"]')].find(item => item.textContent?.trim() === label)!
  const click = (label: string) => button(label).click()
  click('同 key 原位更新')
  ctx.mock.timers.tick(600)
  click('同 key 原位更新')
  ctx.mock.timers.tick(600)
  assert.equal(toastCalls.filter(call => call.method === 'success').length, 0)
  click('maxCount 限流')
  click('loading 后接续 success')
  app.unmount()
  const stoppedAt = toastCalls.length
  promises.forEach(resolve => resolve())
  ctx.mock.timers.tick(10000)
  await nextTick()
  assert.equal(toastCalls.length, stoppedAt)
  assert.equal(toastCalls.filter(call => call.method === 'config').at(-1)?.options?.maxCount, 0)
})
