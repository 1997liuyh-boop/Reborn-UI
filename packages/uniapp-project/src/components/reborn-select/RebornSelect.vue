<script setup lang="ts">
import type { ClassValue } from 'clsx'
import type { SelectOption } from '../reborn-picker-view/RebornPickerView.vue'
import theme, { type selectColors, type selectSizes } from './reborn-select.config'

import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'

import { isEmpty, isNull } from 'lodash-es'
import { computed, shallowRef, watch } from 'vue'
import { useFormInject } from '@/composables/useFieldGroup'

import RebornButton from '../reborn-button/RebornButton.vue'
import RebornPickerView from '../reborn-picker-view/RebornPickerView.vue'
import RebornPopup from '../reborn-popup/RebornPopup.vue'
import RebornSelectTrigger from '../reborn-select-trigger/RebornSelectTrigger.vue'

defineOptions({
  name: 'RebornSelect',
})

const props = withDefaults(defineProps<SelectProps>(), {
  title: '请选择',
  placeholder: '请选择',
  options: () => [],
  showTrigger: true,
  disabled: false,
  columnCount: 1,
  splitor: ' - ',
  confirmText: '确定',
  showConfirm: true,
  cancelText: '取消',
  showCancel: true,
  clearable: true,
  color: 'primary',
  size: 'lg',
})

const emit = defineEmits<{
  /** 确认 / 清空后的选择变动事件，第二个参数为对应的选项对象（多列时为数组） */
  (e: 'change', value: SelectValue, select: any): void
  /** 滚轮滚动过程中的实时值变化 */
  (e: 'changing', value: SelectValue): void
}>()

defineSlots<{
  tag: (props: { selectItem: any[] }) => any
  prepend: () => any
  append: () => any
  option: (props: { item: SelectOption, index: number }) => any
  empty: () => any
}>()

/**
 * 选择器的值（v-model）：单列为选项的 value，多列为各列 value 组成的数组。
 * 未传入时回落为 null，与清空后的取值保持一致。
 */
const model = defineModel<SelectValue>({ default: null })

export type SelectValue = string | number | (string | number)[] | null

/** options 的字段别名映射：数据字段名与默认的 label / value / children 不一致时配置 */
export interface SelectFieldNames {
  /** 展示文案字段名，默认 `label` */
  label?: string
  /** 选项值字段名，默认 `value` */
  value?: string
  /** 下一列选项字段名，默认 `children` */
  children?: string
}

export interface SelectProps {
  /** 标题 */
  title?: string
  /** 占位符 */
  placeholder?: string
  /** 选项数据；多列时由 children 逐级给出下一列，字段名与默认不一致时配合 fieldNames 使用 */
  options?: (SelectOption | Record<string, any>)[]
  /** options 的字段别名配置：按这里给出的字段名去每一层数据里取 label / value / children */
  fieldNames?: SelectFieldNames
  /** 是否显示触发器 */
  showTrigger?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 列数 */
  columnCount?: number
  /** 分隔符 */
  splitor?: string
  /** 确认按钮文本 */
  confirmText?: string
  /** 是否显示确认按钮 */
  showConfirm?: boolean
  /** 取消按钮文本 */
  cancelText?: string
  /** 是否显示取消按钮 */
  showCancel?: boolean
  /** 是否显示清空按钮 */
  clearable?: boolean
  /** 颜色 */
  color?: typeof selectColors[number]
  /** 尺寸 */
  size?: typeof selectSizes[number]
  ui?: Partial<{
    empty: ClassValue
    buttons: ClassValue
    emptyText: ClassValue
    cancel: ClassValue
    cancelButton: ClassValue
    confirm: ClassValue
    confirmButton: ClassValue
  }>,
  /** 样式覆盖 */
  triggerUi?: Partial<{
    wrapper: ClassValue
    content: ClassValue
    text: ClassValue
    placeholder: ClassValue
    iconWrapper: ClassValue
    clearIcon: ClassValue
    arrowIcon: ClassValue
  }>
  /** 底部弹出层（RebornPopup）样式覆盖对象，可重写遮罩、面板、头部、标题等区域 */
  popupUi?: Partial<{
    wrapper: ClassValue
    mask: ClassValue
    popup: ClassValue
    inner: ClassValue
    draw: ClassValue
    header: ClassValue
    title: ClassValue
    container: ClassValue
  }>
  /** 滚轮选择器（RebornPickerView）样式覆盖对象，可重写表头、选项、指示器等区域 */
  pickerUi?: Partial<{
    wrapper: ClassValue
    header: ClassValue
    headerText: ClassValue
    pickerContainer: ClassValue
    item: ClassValue
    itemText: ClassValue
    indicator: ClassValue
  }>
}

// reborn-form 上下文
const { disabled, validate } = useFormInject(props)
const isDisabled = computed(() => disabled.value || props.disabled)


// 是否为空选项
const noOptions = computed(() => {
  return isEmpty(props.options)
})

// ui 样式系统
const b = tv(theme)
const ui = computed(() => {
  const styles = b({
    hideButtons: !props.showCancel && !props.showConfirm,
  })

  return {
    buttons: (opts?: { class?: any }) => styles.buttons({ class: cn(opts?.class, props.ui?.buttons) }),
    empty: (opts?: { class?: any }) => styles.empty({ class: cn(opts?.class, props.ui?.empty) }),
    emptyText: (opts?: { class?: any }) => styles.emptyText({ class: cn(opts?.class, props.ui?.emptyText) }),
    cancel: (opts?: { class?: any }) => styles.cancel({ class: cn(opts?.class, props.ui?.cancel) }),
    cancelButton: (opts?: { class?: any }) => styles.cancelButton({ class: cn(opts?.class, props.ui?.cancelButton) }),
    confirm: (opts?: { class?: any }) => styles.confirm({ class: cn(opts?.class, props.ui?.confirm) }),
    confirmButton: (opts?: { class?: any }) => styles.confirmButton({ class: cn(opts?.class, props.ui?.confirmButton) }),
  }
})

// 当前选中的值
const value = shallowRef<any[]>([])

// 当前选中项的索引
const indexes = shallowRef<number[]>([])

const selectItem = shallowRef<any[]>([])
const renderKey = shallowRef(0)


// 按 fieldNames 把每一层选项统一成 label / value / children，原有字段随展开保留，供 option 插槽与 change 事件读取
const normalizedOptions = computed<SelectOption[]>(() => {
  const label = props.fieldNames?.label ?? 'label'
  const value = props.fieldNames?.value ?? 'value'
  const children = props.fieldNames?.children ?? 'children'
  const normalize = (list: Record<string, any>[]): SelectOption[] =>
    list.map(item => ({
      ...item,
      label: item[label],
      value: item[value],
      children: Array.isArray(item[children]) ? normalize(item[children]) : undefined,
    }))
  return normalize(props.options || [])
})

// 计算选择器列表数据
function buildColumns(values: any[]): SelectOption[][] {
  let options = normalizedOptions.value
  const cols: SelectOption[][] = []

  for (let i = 0; i < props.columnCount; i++) {
    const column = [...options]
    const val = i >= values.length ? null : values[i]

    let item = options?.find(item => item.value == val)
    if (item == null && !isEmpty(options)) {
      item = options[0]
    }

    if (item?.children != null) {
      options = item.children
    }

    cols.push(column)
  }

  return cols
}
const columns = computed(() => buildColumns(value.value))

// 已提交值决定显示文本，编辑中的列不会提前影响触发器。
const text = computed(() => {
  const val = model.value
  if (val == null) return ''
  const values = Array.isArray(val) ? val : [val]
  const selectedColumns = buildColumns(values)
  return values.map((item, index) => selectedColumns[index]?.find(option => option.value == item)?.label ?? '').join(props.splitor)
})

function getValue() {
  return props.columnCount == 1 ? value.value[0] : value.value
}

function getSelectItem(a: number[]): any[] {
  return columns.value.map((c, i) => {
    return isNull(c[a[i]]) ? 0 : c[a[i]]
  })
}

function setValue(val: SelectValue) {
  let nextValues: any[]

  if (val == null) {
    nextValues = []
  }
  else if (Array.isArray(val)) {
    nextValues = [...val]
  }
  else {
    nextValues = [val]
  }

  const nextIndexes: number[] = []
  const nextColumns = buildColumns(nextValues)

  for (let i = 0; i < props.columnCount; i++) {
    const column = nextColumns[i]

    if (i >= nextValues.length) {
      nextIndexes.push(0)
      if (!isNull(column) && column.length > 0 && !isNull(column[0])) {
        nextValues.push(column[0].value)
      }
    }
    else {
      let index = column.findIndex(e => e.value == nextValues[i])
      if (index < 0) { index = 0 }
      nextIndexes.push(index)
    }
  }

  value.value = nextValues
  indexes.value = nextIndexes

  if (val == null || (Array.isArray(val) && val.length === 0)) {
    selectItem.value = []
  } else {
    selectItem.value = getSelectItem(indexes.value)
  }
}

function onChange(a: number[]) {
  const b = [...indexes.value]
  let changed = false

  for (let i = 0; i < a.length; i++) {
    if (changed) {
      b[i] = 0
    }
    else if (b[i] != a[i]) {
      b[i] = a[i]
      changed = true
    }
  }

  indexes.value = b
  value.value = b.map((e, i) => (isNull(columns.value[i][e]) ? 0 : columns.value[i][e].value))
  emit('changing', getValue())
}

const visible = shallowRef(false)
let callback: ((value: SelectValue) => void) | null = null

function open(cb: ((value: SelectValue) => void) | null = null) {
  renderKey.value++
  visible.value = true
  setValue(model.value)
  callback = cb
}

function close() {
  visible.value = false
}

function clear() {
  if (props.columnCount == 1) {
    model.value = null
    emit('change', null, null)
  }
  else {
    model.value = []
    emit('change', [], [])
  }
  if (validate) { validate('change') }
}

function confirm() {
  onChange(indexes.value)
  const val = getValue()

  selectItem.value = getSelectItem(indexes.value)

  model.value = val
  emit('change', val, selectItem.value)
  if (validate) { validate('change') }
  if (callback != null) {
    callback(val)
  }
  close()
}

// 已提交值或列数变化：按模型重建滚轮位置
watch([model, () => props.columnCount], () => setValue(model.value), { immediate: true })
// 只有选项变化时：弹层打开期间保留用户已滚到、尚未确认的草稿，只按新选项校正下标（找不到时回到首项）；
// 关闭时仍按已提交值同步。父级在 @changing 里改状态并传内联 / 新建的 options 数组时，草稿不会被拉回
watch(normalizedOptions, () => setValue(visible.value ? value.value : model.value))

defineExpose({
  /** 打开底部选择弹出层；可传入回调，在点击确认时接收选中值 */
  open,
  /** 关闭底部选择弹出层 */
  close,
})
</script>

<template>
  <RebornSelectTrigger v-if="showTrigger" :placeholder="placeholder" :disabled="isDisabled" :focus="visible"
    :text="text" :clearable="clearable" :color="color" :size="size" :ui="triggerUi" @open="open()" @clear="clear">

    <template #default="{ showText, text, placeholder, ui }">
      <!-- #ifndef MP-WEIXIN -->
      <slot name="tag" :selectItem="selectItem" />
      <!-- #endif -->
      <!-- #ifdef MP-WEIXIN -->
      <slot v-if="$slots.tag" name="tag" :selectItem="selectItem" />
      <text v-else-if="showText" :class="ui.text()">{{ text }}</text>
      <text v-else :class="ui.placeholder()">{{ placeholder }}</text>
      <!-- #endif -->
    </template>
  </RebornSelectTrigger>
  <RebornPopup v-model="visible" :title="title" :ui="popupUi"
    :swipe-close-threshold="noOptions ? 90 : undefined">
    <view @touchmove.stop.prevent @wheel.stop.prevent>
      <slot name="prepend" />

      <view>
        <RebornPickerView :key="renderKey" v-if="!noOptions" :color="color" :value="indexes" :columns="columns"
          :ui="pickerUi" @change-index="onChange">
          <!-- #ifndef MP-WEIXIN -->
          <template #default="{ item, index }">
            <slot name="option" :item="item" :index="index" />
          </template>
          <!-- #endif -->
        </RebornPickerView>

        <view v-else :class="ui.empty()">
          <slot name="empty">
            <text :class="ui.emptyText()">暂无数据</text>
          </slot>
        </view>
      </view>

      <slot name="append" />

      <view :class="ui.buttons()">
        <view :class="ui.cancel()">
          <RebornButton v-if="showCancel" :size="size" variant="outlined" :color="color"
            :ui="{ base: ui.cancelButton() }" block @tap="close">
            {{ cancelText }}
          </RebornButton>
        </view>
        <view v-if="showConfirm && !noOptions" :class="ui.confirm()">
          <RebornButton :size="size" variant="filled" :color="color" :ui="{ base: ui.confirmButton() }" block
            @tap.stop="confirm">
            {{ confirmText }}
          </RebornButton>
        </view>
      </view>
    </view>
  </RebornPopup>
</template>
