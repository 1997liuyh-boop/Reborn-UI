<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, { waterfallColumnInnerClass, waterfallVirtualClass } from './reborn-waterfall.config'

export interface WaterfallProps {
  column?: number
  gutter?: number
  nodeKey?: string
  customClass?: string
  ui?: any
}

defineOptions({
  name: 'RebornWaterfall',
})

const props = withDefaults(defineProps<WaterfallProps>(), {
  column: 2,
  gutter: 16,
  nodeKey: 'id',
  customClass: '',
  ui: () => ({}),
})

defineSlots<{
  item: (props: { item: any, index: number }) => any
}>()

const { proxy } = getCurrentInstance()!
const b = tv(theme)

const heights = ref<number[]>([])
const columns = ref<any[][]>([])

const ui = computed(() => {
  const styles = b()
  return {
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, props.customClass, props.ui?.root) }),
    column: (opts?: { class?: any }) => styles.column({ class: cn(opts?.class, props.ui?.column) }),
    inner: (opts?: { class?: any }) => styles.inner({ class: cn(opts?.class, props.ui?.inner) }),
    item: (opts?: { class?: any }) => styles.item({ class: cn(opts?.class, props.ui?.item) }),
    virtual: (opts?: { class?: any }) => styles.virtual({ class: cn(opts?.class, props.ui?.virtual) }),
  }
})

async function getHeight(): Promise<void> {
  await nextTick()

  return new Promise((resolve) => {
    uni.createSelectorQuery()
      .in(proxy)
      .selectAll(`.${waterfallColumnInnerClass}`)
      .boundingClientRect()
      .exec((rect) => {
        const nodes = rect[0] as any[]
        if (nodes) {
          heights.value = nodes.map(e => e.height ?? 0)
        }
        resolve()
      })
  })
}

async function append(data: any[]) {
  await getHeight()

  columns.value[0].push(...data.map(e => ({ ...e, isVirtual: true })))

  await nextTick()

  setTimeout(() => {
    uni.createSelectorQuery()
      .in(proxy)
      .selectAll(`.${waterfallVirtualClass}`)
      .boundingClientRect()
      .exec((rect) => {
        (rect[0] as any[]).forEach((e, i) => {
          const min = Math.min(...heights.value)
          const index = heights.value.indexOf(min)

          columns.value[index].push(data[i])
          heights.value[index] += e.height ?? 0
          columns.value[0] = columns.value[0].filter(item => item.isVirtual !== true)
        })
      })
  }, 300)
}

function remove(id: string | number) {
  columns.value.forEach((column, columnIndex) => {
    columns.value[columnIndex] = column.filter(e => e[props.nodeKey] !== id)
  })
}

function update(id: string | number, data: any) {
  columns.value.forEach((column) => {
    column.forEach((e) => {
      if (e[props.nodeKey] === id) {
        Object.assign(e, data)
      }
    })
  })
}

function clear() {
  columns.value = []
  for (let i = 0; i < props.column; i++) {
    columns.value.push([])
  }
}

onMounted(() => {
  watch(
    () => props.column,
    () => {
      clear()
      getHeight()
    },
    { immediate: true },
  )
})

defineExpose({
  append,
  remove,
  update,
  clear,
})
</script>

<template>
  <view :class="ui.root()" :style="{ padding: `0 ${props.gutter / 2}px` }">
    <view
      v-for="(columnItems, columnIndex) in columns" :key="columnIndex" :class="ui.column()"
      :style="{ margin: `0 ${props.gutter / 2}px` }"
    >
      <view :class="ui.inner()">
        <view
          v-for="(item, index) in columnItems" :key="`${columnIndex}-${index}-${item[props.nodeKey]}`"
          :class="item.isVirtual ? ui.item({ class: ui.virtual() }) : ui.item()"
        >
          <slot name="item" :item="item" :index="index" />
        </view>
      </view>
    </view>
  </view>
</template>
