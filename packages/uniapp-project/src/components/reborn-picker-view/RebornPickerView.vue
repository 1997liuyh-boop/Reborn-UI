<script setup lang="ts">
import type { ClassValue } from 'clsx'
import type { pickerColors } from './reborn-picker-view.config'
import { isEqual, isNull } from 'lodash-es'
import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue'
import { initTheme, isAppAndroid, isAppIOS } from '@/lib/device'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-picker-view.config'

defineOptions({
  name: 'RebornPickerView',
})

const props = withDefaults(defineProps<PickerViewProps>(), {
  color: 'primary',
  headers: () => [],
  value: () => [],
  columns: () => [],
  itemHeight: isAppIOS() ? 50 : 42,
  height: 300,
})

const emit = defineEmits<{
  (e: 'change-value', values: any[]): void
  (e: 'change-index', indexes: number[]): void
  (e: 'change-item', item: any): void
}>()

export interface SelectOption {
  label: string
  value: any
  children?: SelectOption[]
  [key: string]: any
}

export interface PickerViewProps {
  /** 颜色 */
  color?: typeof pickerColors[number]
  /** 表头 */
  headers?: string[]
  /** 当前选中索引 */
  value?: number[]
  /** 列数据 */
  columns?: SelectOption[][]
  /** 每项高度 */
  itemHeight?: number
  /** 整体高度 */
  height?: number
  /** 样式覆盖 */
  ui?: Partial<{
    wrapper: ClassValue
    header: ClassValue
    headerText: ClassValue
    pickerContainer: ClassValue
    item: ClassValue
    itemText: ClassValue
    indicator: ClassValue
  }>
}

// ui 样式系统
const uiOverrides = computed(() => props.ui || {})
const b = tv(theme)

const ui = computed(() => {
  const styles = b({
    color: props.color,
  })

  return {
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    header: (opts?: { class?: any }) =>
      styles.header({ class: cn(opts?.class, uiOverrides.value.header) }),
    headerText: (opts?: { class?: any }) =>
      styles.headerText({ class: cn(opts?.class, uiOverrides.value.headerText) }),
    pickerContainer: (opts?: { class?: any }) =>
      styles.pickerContainer({ class: cn(opts?.class, uiOverrides.value.pickerContainer) }),
    item: (opts?: { class?: any }) =>
      styles.item({ class: cn(opts?.class, uiOverrides.value.item) }),
    itemText: (opts?: { class?: any, active?: boolean, color?: any }) =>
      styles.itemText({ active: opts?.active, color: opts?.color, class: cn(opts?.class, uiOverrides.value.itemText) }),
    indicator: (opts?: { class?: any }) =>
      styles.indicator({ class: cn(opts?.class, uiOverrides.value.indicator) }),
  }
})

// 获取窗口宽度，用于计算选择器列宽
const { windowWidth } = uni.getWindowInfo()
const isDark = ref(false)

// 顶部显示表头
const computedHeaders = computed(() => {
  return props.headers.slice(0, props.columns.length)
})

// 监听选择器值改变事件
function onChange(e: any) {
  const indexs = e.detail.value

  // 处理快速滑动导致的索引越界
  indexs.forEach((v: number, i: number, arr: number[]) => {
    if (i < props.columns.length) {
      const n = props.columns[i].length
      if (v >= n) {
        arr[i] = n - 1
      }
    }
  })

  // 相同值不触发事件
  if (isEqual(indexs, props.value)) {
    return
  }

  // 获取所有列的值
  const values = props.columns.map((c, i) => {
    return c?.[indexs[i]]?.value ?? 0
  })
  const select = props.columns.map((c, i) => {
    return c?.[indexs[i]] ?? null
  })
  emit('change-value', values)
  emit('change-index', indexs)
  emit('change-item', select)
}

// === Android Canvas 渲染 ===
const columnItemRef = shallowRef<any[]>([])

function renderColumnItem() {
  const fontSize = 14
  const color = isDark.value ? 'white' : '#666666'

  for (let i = 0; i < columnItemRef.value.length; i++) {
    const column = props.columns[i]
    const dom = columnItemRef.value[i]
    if (!dom) { continue }
    const rect = dom.getBoundingClientRect()
    const ctx = dom.getDrawableContext()
    if (!ctx) { continue }

    ctx.reset()
    ctx.textAlign = 'center'

    const x = rect.width / 2

    for (let j = 0; j < column.length; j++) {
      ctx.fillStyle = color
      ctx.font = `${fontSize}px`
      const y = 12 + (props.itemHeight - fontSize) / 2 + props.itemHeight * j
      ctx.fillText(column[j].label, x, y)
    }
    ctx.update()
  }
}

// 遮罩层样式
const maskStyle = computed(() => {
  if (isDark.value) {
    return `background-image: linear-gradient(180deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0))`
  }
  return ''
})

// 选择器指示器样式
const indicatorStyle = computed(() => {
  let str = ''
  const columnsCount = props.columns.length || 1
  const width = Math.ceil((windowWidth - 8) / columnsCount - 10)

  const style: Record<string, string> = {
    'height': `${props.itemHeight}px`,
    'width': 'calc(100% - 4px)',
    'left': '2px',
    'border-radius': '10px',
    'box-sizing': 'border-box',
    'border': 'none',
  }

  if (isAppIOS()) {
    if (isDark.value) {
      style['box-shadow'] = 'none'
      style.width = `${width - 3}px`
    }
    else {
      style.width = `${width + 2}px`
    }
  }

  if (isAppAndroid()) {
    style.width = `${width + 1}px`
  }

  const objKeys = Object.keys(style)
  for (let i = 0; i < objKeys.length; i++) {
    const key = objKeys[i]
    str += `${key}: ${style[key]};`
  }
  return str
})

function render() {
  renderColumnItem()
}

onMounted(() => {
  isDark.value = initTheme() === 'dark'
  nextTick(() => {
    render()
  })

  watch(
    computed(() => [props.columns, props.itemHeight]),
    () => {
      render()
    },
  )
})
</script>

<template>
  <view class="reborn-picker-view" :class="ui.wrapper()">
    <view v-if="computedHeaders.length > 0" :class="ui.header()" @touchstart.stop @touchmove.stop @touchend.stop
      @touchcancel.stop>
      <text v-for="(label, index) in computedHeaders" :key="index" :class="ui.headerText()">
        {{ label }}
      </text>
    </view>

    <view :class="ui.pickerContainer()" :style="{ height: `${height}px` }" @touchstart.stop @touchmove.stop
      @touchend.stop @touchcancel.stop>
      <picker-view class="h-full" :value="value" :mask-style="maskStyle" :mask-top-style="maskStyle"
        :indicator-class="ui.indicator()" :mask-bottom-style="maskStyle" :immediate-change="true"
        :indicator-style="indicatorStyle" @change="onChange">
        <picker-view-column v-for="(column, columnIndex) in columns" :key="columnIndex">
          <!-- #ifdef APP-ANDROID -->
          <view ref="columnItemRef" :style="{ height: `${itemHeight * column.length}px` }" />
          <!-- #endif -->

          <!-- #ifndef APP-ANDROID -->
          <view v-for="(item, index) in column" :key="index" :class="ui.item()" :style="{ height: `${itemHeight}px` }">
            <slot :item="item" :index="index">
              <text :class="ui.itemText({ active: index == value[columnIndex], color })">
                {{ item.label }}
              </text>
            </slot>
          </view>
          <!-- #endif -->
        </picker-view-column>
      </picker-view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.reborn-picker-view {
  .uni-picker-view-indicator {

    // #ifdef H5
    &::after,
    &::before {
      display: none;
    }

    // #endif
  }
}
</style>
