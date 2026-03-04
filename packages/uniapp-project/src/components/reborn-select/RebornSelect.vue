<script setup lang="ts">
import type { ClassValue } from 'clsx'
import type { SelectOption } from '../reborn-picker-view/RebornPickerView.vue'
import theme, { type selectColors, type selectSizes } from './reborn-select.config'

import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'

import { isEmpty, isNull } from 'lodash-es'
import { computed, onMounted, ref, watch } from 'vue'
import { useFormInject } from '@/composables/useFieldGroup'

import RebornButton from '../reborn-button/RebornButton.vue'
import RebornPickerView from '../reborn-picker-view/RebornPickerView.vue'
import RebornPopup from '../reborn-popup/RebornPopup.vue'
import RebornSelectTrigger from '../reborn-select-trigger/RebornSelectTrigger.vue'

defineOptions({
  name: 'RebornSelect',
})

const props = withDefaults(defineProps<SelectProps>(), {
  modelValue: null,
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
  size: 'md',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: SelectValue): void
  (e: 'change', value: SelectValue, select: any): void
  (e: 'changing', value: SelectValue): void
}>()

defineSlots<{
  tag: (props: { selectItem: any[] }) => any
  prepend: () => any
  append: () => any
  option: (props: { item: SelectOption, index: number }) => any
}>()

export type SelectValue = string | number | (string | number)[] | null

export interface SelectProps {
  /** 选择器的值 */
  modelValue?: SelectValue
  /** 标题 */
  title?: string
  /** 占位符 */
  placeholder?: string
  /** 选项数据 */
  options?: SelectOption[]
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
    confirm: ClassValue
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

// 弹出层引用
const popupRef = ref<any>(null)

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
    confirm: (opts?: { class?: any }) => styles.confirm({ class: cn(opts?.class, props.ui?.confirm) }),
  }
})

// 当前选中的值
const value = ref<any[]>([])

// 当前选中项的索引
const indexes = ref<number[]>([])

const selectItem = ref<any[]>([])

// 计算选择器列表数据
const columns = computed<SelectOption[][]>(() => {
  let options = props.options || []
  const cols: SelectOption[][] = []

  for (let i = 0; i < props.columnCount; i++) {
    const column = [...options]
    const val = i >= value.value.length ? null : value.value[i]

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
})

// 显示文本
const text = ref('')

function updateText() {
  const val = props.modelValue
  if (val == null || val == undefined) {
    text.value = ''
  }
  else {
    let arr: any[]
    if (props.columnCount == 1) {
      arr = [val]
    }
    else {
      arr = val as any[]
    }

    text.value = arr
      .map((e, i) => columns.value[i]?.find(a => a.value == e)?.label ?? '')
      .join(props.splitor)
  }
}

function getValue() {
  return props.columnCount == 1 ? value.value[0] : value.value
}

function getSelectItem(a: number[]): any[] {
  return columns.value.map((c, i) => {
    return isNull(c[a[i]]) ? 0 : c[a[i]]
  })
}

function setValue(val: SelectValue) {
  let _value: any[]

  if (val == null) {
    _value = []
  }
  else if (Array.isArray(val)) {
    _value = [...val]
  }
  else {
    _value = [val]
  }

  const _indexes: number[] = []

  for (let i = 0; i < props.columnCount; i++) {
    const column = columns.value[i]

    if (i >= _value.length) {
      _indexes.push(0)
      if (!isNull(column) && column.length > 0 && !isNull(column[0])) {
        _value.push(column[0].value)
      }
    }
    else {
      let index = column.findIndex(e => e.value == _value[i])
      if (index < 0) { index = 0 }
      _indexes.push(index)
    }
  }

  value.value = _value
  indexes.value = _indexes

  selectItem.value = getSelectItem(indexes.value)
  updateText()
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

const visible = ref(false)
let callback: ((value: SelectValue) => void) | null = null

function open(cb: ((value: SelectValue) => void) | null = null) {
  visible.value = true
  setValue(props.modelValue)
  callback = cb
}

function close() {
  visible.value = false
}

function clear() {
  text.value = ''
  if (props.columnCount == 1) {
    emit('update:modelValue', null)
    emit('change', null, null)
  }
  else {
    emit('update:modelValue', [])
    emit('change', [], [])
  }
  if (validate) { validate('change') }
}

function confirm() {
  onChange(indexes.value)
  const val = getValue()

  selectItem.value = getSelectItem(indexes.value)

  emit('update:modelValue', val)
  emit('change', val, selectItem.value)
  if (validate) { validate('change') }
  if (callback != null) {
    callback(val)
  }
  close()
}

onMounted(() => {
  watch(
    () => props.modelValue,
    (val) => {
      setValue(val)
    },
    { immediate: true },
  )

  watch(
    () => props.options,
    () => {
      updateText()
    },
  )
})

defineExpose({
  open,
  close,
})
</script>

<template>
  <RebornSelectTrigger v-if="showTrigger" :placeholder="placeholder" :disabled="isDisabled" :focus="popupRef?.isOpen"
    :text="text" :clearable="clearable" :color="color" :size="size" :ui="triggerUi" @open="open()" @clear="clear">
    <!-- #ifndef MP-WEIXIN -->
    <template #default>
      <slot name="tag" :selectItem="selectItem" />
    </template>
    <!-- #endif -->

    <!-- #ifdef MP-WEIXIN -->
    <template #default="{ showText, text, placeholder, ui }">
      <slot v-if="$slots.tag" name="tag" :selectItem="selectItem" />
      <text v-else-if="showText" :class="ui.text()">{{ text }}</text>
      <text v-else :class="ui.placeholder()">{{ placeholder }}</text>
    </template>
    <!-- #endif -->
  </RebornSelectTrigger>
  <RebornPopup ref="popupRef" v-model="visible" :title="title" :ui="popupUi">
    <view @touchmove.stop>
      <slot name="prepend" />

      <view>
        <RebornPickerView v-if="!noOptions" :color="color" :value="indexes" :columns="columns" :ui="pickerUi"
          @change-index="onChange">
          <!-- #ifndef MP-WEIXIN -->
          <template #default="{ item, index }">
            <slot name="option" :item="item" :index="index" />
          </template>
          <!-- #endif -->
        </RebornPickerView>

        <view v-else :class="ui.empty()">
          <text :class="ui.emptyText()">暂无数据</text>
        </view>
      </view>

      <slot name="append" />

      <view :class="ui.buttons()">
        <RebornButton v-if="showCancel" :size="size" variant="outline" :color="color" :class="ui.cancel()">
          {{ cancelText }}
        </RebornButton>
        <RebornButton v-if="showConfirm && !noOptions" :size="size" variant="solid" :color="color" :class="ui.confirm()"
          @tap="confirm">
          {{ confirmText }}
        </RebornButton>
      </view>
    </view>
  </RebornPopup>
</template>
