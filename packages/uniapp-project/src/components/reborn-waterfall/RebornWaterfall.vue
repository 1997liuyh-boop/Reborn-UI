<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-waterfall.config'

export interface Props {
  ui?: any
  customClass?: string
  /** 瀑布流列数。 */
  column?: number
  /** 列间距，单位 px，保留现有公开尺寸契约。 */
  gutter?: number
  /** 数据项的唯一标识字段，默认 id。 */
  nodeKey?: string
}
defineOptions({ name: 'reborn-waterfall' })
defineSlots<{ item: (props: { item: any, index: number }) => any }>()
const props = withDefaults(defineProps<Props>(), {
  column: 2, gutter: 16, nodeKey: 'id', ui: () => ({}),
})
const { proxy } = getCurrentInstance()!
const b = tv(theme)
const uiClasses = computed(() => {
  const styles = b()
  const overrides = props.ui || {}
  return {
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, overrides.root) }),
    column: () => styles.column({ class: overrides.column }),
    item: (opts?: { class?: any }) => styles.item({ class: cn(opts?.class, overrides.item) }),
    inner: () => styles.inner({ class: overrides.inner }),
    virtual: () => styles.virtual({ class: overrides.virtual }),
  }
})

// 列内数据会被就地更新，保留深层响应式；高度只参与内部排布。
const columns = ref<any[][]>([])
let heights: number[] = []
let generation = 0
let batchSeed = 0
let queue: Promise<void> = Promise.resolve()
let disposed = false
let measureTimer: ReturnType<typeof setTimeout> | undefined
let finishDelay: (() => void) | undefined

/** 查询只属于当前组件的节点，节点缺失时返回空数组。 */
async function queryRects(selector: string): Promise<UniApp.NodeInfo[]> {
  await nextTick()
  if (disposed) return []
  return new Promise(resolve => {
    uni.createSelectorQuery().in(proxy).selectAll(selector).boundingClientRect()
      .exec(rect => resolve(Array.isArray(rect?.[0]) ? rect[0] : []))
  })
}

/** 每批串行分列；清空或卸载后，旧批次不再提交。 */
function append(data: any[]): Promise<void> {
  const version = generation
  const items = [...data]
  queue = queue.then(() => appendBatch(items, version))
  return queue
}

async function appendBatch(data: any[], version: number): Promise<void> {
  if (disposed || version !== generation || !data.length) return
  const nodes = await queryRects('.cl-waterfall__column-inner')
  if (disposed || version !== generation) return
  heights = columns.value.map((_, index) => nodes[index]?.height ?? 0)
  const batch = ++batchSeed
  columns.value[0].push(...data.map((item, index) => ({ ...item, isVirtual: true, batch, virtualIndex: index })))
  await nextTick()
  if (disposed || version !== generation) return
  await new Promise<void>(resolve => {
    finishDelay = resolve
    measureTimer = setTimeout(() => { finishDelay = undefined; resolve() }, 300)
  })
  if (disposed || version !== generation) return
  const rects = await queryRects(`.is-virtual-${batch}`)
  if (disposed || version !== generation) return
  columns.value[0] = columns.value[0].filter(item => !(item.isVirtual && item.batch === batch))
  data.forEach((item, index) => {
    const column = heights.indexOf(Math.min(...heights))
    columns.value[column].push(item)
    heights[column] += rects[index]?.height ?? 0
  })
}

/**
 * 比较业务标识：数字与等值的数字字符串视为同一项（与改造前的宽松比较一致）。
 * id 常取自路由参数或 dataset，类型未必与数据一致，严格比较会让 remove('1') 静默失效
 */
function isSameKey(value: unknown, id: string | number) {
  if (typeof value === typeof id) return value === id
  return (typeof value === 'number' || typeof value === 'string') && Number(value) === Number(id)
}

/** 按业务标识移除数据，其他项的 key 保持不变。 */
function remove(id: string | number) {
  columns.value = columns.value.map(column => column.filter(item => !isSameKey(item[props.nodeKey], id)))
}

/** 更新数据字段，保留响应式对象身份。 */
function update(id: string | number, data: any) {
  columns.value.forEach(column => column.forEach(item => {
    if (isSameKey(item[props.nodeKey], id)) Object.assign(item, data)
  }))
}

function clear() {
  generation++
  clearTimeout(measureTimer)
  finishDelay?.()
  finishDelay = undefined
  queue = Promise.resolve()
  const count = Math.max(1, Math.floor(props.column) || 1)
  columns.value = Array.from({ length: count }, () => [])
  heights = Array.from({ length: count }, () => 0)
}
watch(() => props.column, clear, { immediate: true })
onBeforeUnmount(() => { disposed = true; clear() })
defineExpose({ append, remove, update, clear })
</script>

<template>
  <view :class="uiClasses.root({ class: customClass })" :style="{ padding: `0 ${props.gutter / 2}px` }">
    <view
      v-for="(column, columnIndex) in columns" :key="columnIndex"
      :class="uiClasses.column()" :style="{ margin: `0 ${props.gutter / 2}px` }"
    >
      <view :class="[uiClasses.inner(), 'cl-waterfall__column-inner']">
        <view
          v-for="(item, index) in column" :key="item.isVirtual ? `v-${item.batch}-${item.virtualIndex}` : item[props.nodeKey]"
          :class="[uiClasses.item({ class: item.isVirtual ? uiClasses.virtual() : '' }), item.isVirtual ? `is-virtual-${item.batch}` : '']"
        >
          <slot name="item" :item="item" :index="index" />
        </view>
      </view>
    </view>
  </view>
</template>
