/* eslint test/no-import-node-test: off -- 使用仓库现有测试运行器 */
import assert from 'node:assert/strict'
import { after, it } from 'node:test'
import { installDom } from '../composables/harness'
import { createFixture, loadUniDemo } from './harness'

const dom = installDom()
const { createApp, h, nextTick } = await import('vue')
after(() => dom.window.close())

/** 搜索框替身：记录父级实际传入了哪些属性（含未声明的），用于判断 history 与 history-key 是否混用 */
const searchBoxMock = `const {defineComponent,getCurrentInstance,h}=require('vue');export default defineComponent({
  inheritAttrs:false,props:['modelValue','history','historyKey'],emits:['update:modelValue','update:history','search','clickCamera'],
  setup(props,{emit}){const bound=Object.keys(getCurrentInstance().vnode.props??{});
    (globalThis.__uniDemo.controls.RebornSearchBox??=[]).push({props,slots:{},emit,bound});
    return()=>h('div',{'data-control':'RebornSearchBox'});
  }});`
const Page = await loadUniDemo('packages/uniapp-project/src/pages/reborn-search-box/RebornSearchBoxDemo.vue', {
  '@/components/reborn-search-box/RebornSearchBox.vue': searchBoxMock,
})

interface SearchBoxControl { props: Record<string, any>, emit: (name: string, ...args: any[]) => void, bound: string[] }

/** 挂载演示页，并给 uni 补上按键读取的本地存储替身 */
function mountPage(store: Map<string, string>) {
  const fixture = createFixture()
  Object.assign((globalThis as any).uni, { getStorageSync: (key: string) => store.get(key) ?? '' })
  const root = document.createElement('div')
  const app = createApp({ render: () => h(Page) })
  app.config.warnHandler = () => {}
  app.mount(root)
  const boxes = fixture.controls.RebornSearchBox as unknown as SearchBoxControl[]
  const hasKey = (box: SearchBoxControl) => box.bound.includes('history-key') || box.bound.includes('historyKey')
  return { root, app, boxes, hasKey }
}

it('演练场只用 v-model:history，历史在页面上回显并可由页面清空；history-key 只出现在未绑定 history 的实例上', async () => {
  const { root, app, boxes, hasKey } = mountPage(new Map())
  try {
    const bound = boxes.filter(box => box.bound.includes('history'))
    assert.equal(bound.length, 1, '只有演练场绑定 history')
    assert.equal(hasKey(bound[0]!), false, '绑定 history 时 history-key 被组件忽略，不应同时传')
    const keyed = boxes.filter(hasKey)
    assert.equal(keyed.length, 1)
    assert.equal(keyed[0]!.bound.includes('history'), false)

    const playground = bound[0]!
    playground.emit('update:history', ['降噪耳机', '机械键盘'])
    await nextTick()
    assert.deepEqual(playground.props.history, ['降噪耳机', '机械键盘'])
    assert.ok(root.textContent!.includes('降噪耳机') && root.textContent!.includes('机械键盘'), '搜索后历史要在页面上可见')

    const clear = [...root.querySelectorAll('text')].find(el => el.textContent === '清空')
    assert.ok(clear, '有历史时显示清空入口')
    clear.dispatchEvent(new window.Event('tap'))
    await nextTick()
    assert.deepEqual(playground.props.history, [])
    assert.equal(root.textContent!.includes('降噪耳机'), false)
  }
  finally { app.unmount() }
})

it('本地存储示例进入页面即回显已存记录，search 回调后刷新回显', async () => {
  const store = new Map([['demo-search-history', JSON.stringify(['上次的关键词'])]])
  const { root, app, boxes, hasKey } = mountPage(store)
  try {
    await nextTick()
    assert.ok(root.textContent!.includes('上次的关键词'), '离开再进来时存储里的历史仍要回显')
    const storageBox = boxes.find(hasKey)!
    // 组件先把新关键词写进存储再派发 search，这里按同样顺序模拟
    store.set('demo-search-history', JSON.stringify(['新关键词', '上次的关键词']))
    storageBox.emit('search', '新关键词')
    await nextTick()
    assert.ok(root.textContent!.includes('新关键词'))
  }
  finally { app.unmount() }
})
