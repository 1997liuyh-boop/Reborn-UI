import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- 与既有回归共用 Node 测试运行器。
import test from 'node:test'
import { h, nextTick, reactive, shallowRef } from 'vue'
import { find, fixture, loadComponent, node, renderer } from './harness'

test('Draggable H5：原地字段、深层字段和外部插槽状态独立更新', async () => {
  fixture()
  const Comp = await loadComponent('reborn-draggable/RebornDraggable.vue')
  const rows = reactive([{ label: 'before', detail: { text: 'deep-before' } }])
  const external = shallowRef('external-before')
  const root = node('root')
  const warnings: string[] = []
  const app = renderer.createApp({ setup: () => () => h(Comp, { modelValue: rows }, { item: ({ item }: any) => h('text', `${item.label}/${item.detail.text}/${external.value}`) }) })
  app.config.warnHandler = message => warnings.push(message)
  app.mount(root)
  const read = () => find(root, item => item.type === 'text')[0]?.text
  try {
    await nextTick()
    assert.equal(read(), 'before/deep-before/external-before')
    rows[0]!.label = 'after'
    await nextTick()
    assert.equal(read(), 'after/deep-before/external-before')
    rows[0]!.detail.text = 'deep-after'
    await nextTick()
    assert.equal(read(), 'after/deep-after/external-before')
    external.value = 'external-after'
    await nextTick()
    assert.equal(read(), 'after/deep-after/external-after')
    assert.deepEqual(warnings, [])
  }
  finally { app.unmount() }
})

test('Draggable H5 50 项：逐帧位移不调用业务插槽，字段变更只更新所属项', async () => {
  const host = fixture()
  // 原生测量宿主返回全部 50 项；数据、渲染节点与排序范围保持一致。
  ;(globalThis as any).uni.createSelectorQuery = () => {
    let all = false
    const query = {
      in: () => query,
      select: () => query,
      selectAll() { all = true; return query },
      boundingClientRect: () => query,
      exec(callback: (rects: unknown[]) => void) {
        host.pending.push(() => callback([all
          ? Array.from({ length: 50 }, (_, i) => ({ top: i * 50, left: 0, width: 100, height: 50 }))
          : { top: 0, left: 0, width: 100, height: 2500 }]))
        return query
      },
    }
    return query
  }
  const Comp = await loadComponent('reborn-draggable/RebornDraggable.vue')
  const rows = reactive(Array.from({ length: 50 }, (_, id) => ({ id, label: `row-${id}` })))
  const calls = new Array(50).fill(0)
  const root = node('root')
  const warnings: string[] = []
  const app = renderer.createApp({ setup: () => () => h(Comp, { modelValue: rows, longPress: false }, { item: ({ item }: any) => { calls[item.id]++; return h('text', item.label) } }) })
  app.config.warnHandler = message => warnings.push(message)
  app.mount(root)
  const items = () => find(root, item => String(item.props.class).includes('reborn-draggable__item') && item.props.onTouchstart)
  const touch = (y: number) => ({ touches: [{ clientX: 0, clientY: y }], preventDefault() {}, stopPropagation() {} })
  try {
    await nextTick()
    assert.equal(items().length, 50)
    const start = items()[0]!.props.onTouchstart(touch(0))
    host.flush(); host.flush()
    await start
    await nextTick()
    const before = [...calls]
    const styles = items().map(item => JSON.stringify(item.props.style))
    for (let y = 1; y <= 10; y++) { items()[0]!.props.onTouchmove(touch(y)); await nextTick() }
    const delta = calls.map((value, i) => value - before[i])
    const changed = items().flatMap((item, i) => JSON.stringify(item.props.style) !== styles[i] ? [i] : [])
    assert.deepEqual(delta, new Array(50).fill(0))
    assert.deepEqual(changed, [0])
    rows[25]!.label = 'changed-during-drag'
    await nextTick()
    assert.deepEqual(calls.map((value, i) => value - before[i]), calls.map((_, i) => i === 25 ? 1 : 0))
    assert.equal(find(root, item => item.type === 'text')[25]?.text, 'changed-during-drag')
    const beforeCrossing = [...calls]
    items()[0]!.props.onTouchmove(touch(60))
    await nextTick()
    // 跨越排序边界会改变公开 insertIndex，所有业务插槽都应收到新作用域。
    assert.deepEqual(calls.map((value, i) => value - beforeCrossing[i]), new Array(50).fill(1))
    // eslint-disable-next-line no-console -- 保存 50 项拖动的更新范围证据。
    console.log(JSON.stringify({ items: 50, measuredItems: 50, frames: 10, businessSlotCalls: delta, styleChangedIndices: changed, fieldUpdatedIndices: [25], crossingSlotCalls: calls.map((value, i) => value - beforeCrossing[i]) }))
    items()[0]!.props.onTouchcancel()
    assert.deepEqual(warnings, [])
  }
  finally { app.unmount() }
})
