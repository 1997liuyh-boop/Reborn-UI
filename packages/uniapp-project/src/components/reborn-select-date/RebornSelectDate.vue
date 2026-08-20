<script setup lang="ts">
import type { ClassValue } from 'clsx'
import type { SelectOption } from '../reborn-picker-view/RebornPickerView.vue'
import type { selectDateColors, selectDateSizes } from './reborn-select-date.config'
import type { SelectDateShortcut } from './types'
import { isEmpty, isNull } from 'lodash-es'
import { computed, nextTick, ref, watch } from 'vue'

import { useFormInject } from '@/composables/useFieldGroup'
import { dayUts } from '@/lib/dayUts'
import { tv } from '@/lib/tv'

import RebornButton from '../reborn-button/RebornButton.vue'
import RebornPickerView from '../reborn-picker-view/RebornPickerView.vue'
import RebornPopup from '../reborn-popup/RebornPopup.vue'
import RebornSelectTrigger from '../reborn-select-trigger/RebornSelectTrigger.vue'
import RebornText from '../reborn-text/RebornText.vue'
import theme from './reborn-select-date.config'

defineOptions({
  name: 'RebornSelectDate',
})

export type SelectDateType = 'year' | 'month' | 'date' | 'hour' | 'minute' | 'second'

export interface TriggerUiShape {
  wrapper?: ClassValue
  content?: ClassValue
  text?: ClassValue
  placeholder?: ClassValue
  iconWrapper?: ClassValue
  clearIcon?: ClassValue
  arrowIcon?: ClassValue
}

export interface PopupUiShape {
  wrapper?: ClassValue
  mask?: ClassValue
  popup?: ClassValue
  inner?: ClassValue
  draw?: ClassValue
  header?: ClassValue
  title?: ClassValue
  container?: ClassValue
}

export interface PickerUiShape {
  wrapper?: ClassValue
  header?: ClassValue
  headerText?: ClassValue
  pickerContainer?: ClassValue
  item?: ClassValue
  itemText?: ClassValue
  indicator?: ClassValue
}

export interface SelectDateUiShape {
  wrapper?: ClassValue
  popupOp?: ClassValue
  rangeBox?: ClassValue
  rangeValues?: ClassValue
  rangeStart?: ClassValue
  rangeEnd?: ClassValue
  shortcuts?: ClassValue
  shortcutItem?: ClassValue
  separator?: ClassValue
  rangeValueText?: ClassValue
  rangePlaceholder?: ClassValue
  footer?: ClassValue
  cancel?: ClassValue
  cancelButton?: ClassValue
  confirm?: ClassValue
  confirmButton?: ClassValue
}

export interface SelectDateProps {
  modelValue?: string
  values?: string[]
  title?: string
  headers?: string[]
  placeholder?: string
  showTrigger?: boolean
  disabled?: boolean
  confirmText?: string
  showConfirm?: boolean
  cancelText?: string
  showCancel?: boolean
  labelFormat?: string
  valueFormat?: string
  start?: string
  end?: string
  type?: SelectDateType
  rangeable?: boolean
  startPlaceholder?: string
  endPlaceholder?: string
  rangeSeparator?: string
  showShortcuts?: boolean
  shortcuts?: SelectDateShortcut[]
  clearable?: boolean
  size?: typeof selectDateSizes[number]
  color?: typeof selectDateColors[number]
  triggerUi?: Partial<TriggerUiShape>
  /** 底部弹出层（RebornPopup）样式覆盖对象，可重写遮罩、面板、头部、标题等区域 */
  popupUi?: Partial<PopupUiShape>
  /** 滚轮选择器（RebornPickerView）样式覆盖对象，可重写表头、选项、指示器等区域 */
  pickerUi?: Partial<PickerUiShape>
  /** 组件自身样式覆盖对象，可重写范围选择区、快捷选项、底部按钮等区域 */
  ui?: Partial<SelectDateUiShape>
}

const props = withDefaults(
  defineProps<SelectDateProps>(),
  {
    modelValue: '',
    values: () => [],
    title: '请选择',
    headers: () => ['年', '月', '日', '时', '分', '秒'],
    placeholder: '请选择',
    showTrigger: true,
    disabled: false,
    confirmText: '确定',
    showConfirm: true,
    cancelText: '取消',
    showCancel: true,
    labelFormat: '',
    valueFormat: '',
    start: '1970-01-01 00:00:00',
    end: '2099-12-31 23:59:59',
    type: 'second',
    rangeable: false,
    startPlaceholder: '开始日期',
    endPlaceholder: '结束日期',
    rangeSeparator: '至',
    showShortcuts: true,
    shortcuts: () => [],
    clearable: true,
    size: 'md',
    color: 'primary',
    triggerUi: () => ({}),
    popupUi: () => ({}),
    pickerUi: () => ({}),
    ui: () => ({}),
  },
)

const emit = defineEmits(['update:modelValue', 'change', 'update:values', 'range-change'])

const popupRef = ref<any>(null)

// Form integration
const { disabled: formDisabled, validate } = useFormInject(props as any)
const isDisabled = computed(() => formDisabled.value || props.disabled)

const b = tv(theme)
const ui = computed(() => {
  const styles = b({ color: props.color })
  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: [opts?.class, props.ui?.wrapper] }),
    popupOp: (opts?: { class?: any }) => styles.popupOp({ class: [opts?.class, props.ui?.popupOp] }),
    rangeBox: (opts?: { class?: any }) => styles.rangeBox({ class: [opts?.class, props.ui?.rangeBox] }),
    rangeValues: (opts?: { class?: any }) => styles.rangeValues({ class: [opts?.class, props.ui?.rangeValues] }),
    rangeStart: (opts?: { class?: any }) => styles.rangeStart({ class: [opts?.class, props.ui?.rangeStart] }),
    rangeEnd: (opts?: { class?: any }) => styles.rangeEnd({ class: [opts?.class, props.ui?.rangeEnd] }),
    shortcuts: (opts?: { class?: any }) => styles.shortcuts({ class: [opts?.class, props.ui?.shortcuts] }),
    shortcutItem: (opts?: { class?: any, active?: boolean }) => b({ color: props.color, shortcutActive: opts?.active === true }).shortcutItem({ class: [opts?.class, props.ui?.shortcutItem] }),
    separator: (opts?: { class?: any }) => styles.separator({ class: [opts?.class, props.ui?.separator] }),
    rangeValueText: (opts?: { class?: any }) => styles.rangeValueText({ class: [opts?.class, props.ui?.rangeValueText] }),
    rangePlaceholder: (opts?: { class?: any }) => styles.rangePlaceholder({ class: [opts?.class, props.ui?.rangePlaceholder] }),
    footer: (opts?: { class?: any }) => styles.footer({ class: [opts?.class, props.ui?.footer] }),
    cancel: (opts?: { class?: any }) => styles.cancel({ class: [opts?.class, props.ui?.cancel] }),
    cancelButton: (opts?: { class?: any }) => styles.cancelButton({ class: [opts?.class, props.ui?.cancelButton] }),
    confirm: (opts?: { class?: any }) => styles.confirm({ class: [opts?.class, props.ui?.confirm] }),
    confirmButton: (opts?: { class?: any }) => styles.confirmButton({ class: [opts?.class, props.ui?.confirmButton] }),
  }
})

const rangeActiveStyle = computed(() => {
  const s = b({ color: props.color, rangeActive: 'start' }).rangeStart()
  const e = b({ color: props.color, rangeActive: 'end' }).rangeEnd()
  return { start: s, end: e }
})

// 格式化类型
const formatType = computed(() => {
  switch (props.type) {
    case 'year':
      return 'YYYY'
    case 'month':
      return 'YYYY-MM'
    case 'date':
      return 'YYYY-MM-DD'
    case 'hour':
    case 'minute':
    case 'second':
      return 'YYYY-MM-DD HH:mm:ss'
    default:
      return 'YYYY-MM-DD HH:mm:ss'
  }
})

const labelFormat = computed(() => {
  if (isNull(props.labelFormat) || isEmpty(props.labelFormat)) {
    return formatType.value
  }
  return props.labelFormat
})

const valueFormat = computed(() => {
  if (isNull(props.valueFormat) || isEmpty(props.valueFormat)) {
    return formatType.value
  }
  return props.valueFormat
})

const shortcutsIndex = ref<number>(-1)

const shortcuts = computed<SelectDateShortcut[]>(() => {
  if (!isEmpty(props.shortcuts)) {
    return props.shortcuts
  }

  return [
    {
      label: '今天',
      value: [dayUts().format(valueFormat.value), dayUts().format(valueFormat.value)],
    },
    {
      label: '近7天',
      value: [
        dayUts().subtract(7, 'day').format(valueFormat.value),
        dayUts().format(valueFormat.value),
      ],
    },
    {
      label: '近30天',
      value: [
        dayUts().subtract(30, 'day').format(valueFormat.value),
        dayUts().format(valueFormat.value),
      ],
    },
    {
      label: '近90天',
      value: [
        dayUts().subtract(90, 'day').format(valueFormat.value),
        dayUts().format(valueFormat.value),
      ],
    },
    {
      label: '近一年',
      value: [
        dayUts().subtract(1, 'year').format(valueFormat.value),
        dayUts().format(valueFormat.value),
      ],
    },
  ]
})

const rangeIndex = ref<number>(0)
const values = ref<string[]>(['', ''])
const value = ref<number[]>([])

const start = computed(() => {
  if (props.rangeable) {
    if (rangeIndex.value == 0) {
      return props.start
    }
    else {
      // 结束日期模式下，必须大于等于已选的开始日期；若未选开始日期则使用全局开始日期
      return values.value[0] || props.start
    }
  }
  else {
    return props.start
  }
})

// 时间选择器列表，动态生成每一列的选项
const list = computed(() => {
  const [startYear, startMonth, startDate, startHour, startMinute, startSecond] = dayUts(start.value).toArray()
  const [endYear, endMonth, endDate, endHour, endMinute, endSecond] = dayUts(props.end).toArray()
  const arr = [[], [], [], [], [], []] as SelectOption[][]

  if (isEmpty(value.value)) {
    return arr
  }

  // 获取当前选中的各个分量，用于判断后续列的边界
  const [year, month, date, hour, minute] = value.value

  // 1. 年份列
  for (let y = startYear; y <= endYear; y++) {
    arr[0].push({ label: y.toString(), value: y })
  }

  // 2. 月份列
  const sM = (year === startYear) ? startMonth : 1
  const eM = (year === endYear) ? endMonth : 12
  for (let m = sM; m <= eM; m++) {
    arr[1].push({ label: m.toString().padStart(2, '0'), value: m })
  }

  // 3. 日期列
  const isLeapYear = (year % 4 == 0 && year % 100 != 0) || year % 400 == 0
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] || 31
  const sD = (year === startYear && month === startMonth) ? startDate : 1
  const eD = (year === endYear && month === endMonth) ? endDate : daysInMonth
  for (let d = sD; d <= eD; d++) {
    arr[2].push({ label: d.toString().padStart(2, '0'), value: d })
  }

  // 4. 小时列
  const sH = (year === startYear && month === startMonth && date === startDate) ? startHour : 0
  const eH = (year === endYear && month === endMonth && date === endDate) ? endHour : 23
  for (let h = sH; h <= eH; h++) {
    arr[3].push({ label: h.toString().padStart(2, '0'), value: h })
  }

  // 5. 分钟列
  const smm = (year === startYear && month === startMonth && date === startDate && hour === sH) ? startMinute : 0
  const emm = (year === endYear && month === endMonth && date === endDate && hour === eH) ? endMinute : 59
  for (let m = smm; m <= emm; m++) {
    arr[4].push({ label: m.toString().padStart(2, '0'), value: m })
  }

  // 6. 秒钟列
  const ss = (year === startYear && month === startMonth && date === startDate && hour === sH && minute === smm) ? startSecond : 0
  const es = (year === endYear && month === endMonth && date === endDate && hour === eH && minute === emm) ? endSecond : 59
  for (let s = ss; s <= es; s++) {
    arr[5].push({ label: s.toString().padStart(2, '0'), value: s })
  }

  return arr
})

const columnNum = computed(() => {
  return (['year', 'month', 'date', 'hour', 'minute', 'second'].findIndex(e => e == props.type) + 1)
})

const columns = computed(() => {
  return list.value.slice(0, columnNum.value)
})

const indexes = computed(() => {
  if (isEmpty(value.value)) {
    return []
  }

  return value.value.map((e, i) => {
    let index = list.value[i].findIndex(a => a.value == e) as number
    if (index == -1) { index = list.value[i].length - 1 }
    if (index < 0) { index = 0 }
    return index
  })
})

function toDate() {
  const parts: string[] = []
  const units = ['', '-', '-', ' ', ':', ':']
  const defaultValue = [2000, 1, 1, 0, 0, 0]

  units.forEach((key, i) => {
    let val = value.value[i]
    if (i >= columnNum.value) { val = defaultValue[i] }
    parts.push(key + val.toString().padStart(2, '0'))
  })
  return parts.join('')
}

function checkDate(values: number[]): number[] {
  if (values.length == 0) { return values }

  const checkedValues = [...values]
  const defaultValues = [2000, 1, 1, 0, 0, 0]
  for (let i = checkedValues.length; i < 6; i++) {
    checkedValues.push(defaultValues[i])
  }

  // 修复可能出现的 NaN 情况
  for (let i = 0; i < 6; i++) {
    if (isNaN(checkedValues[i])) {
      checkedValues[i] = defaultValues[i]
    }
  }

  let [year, month, date, hour, minute, second] = checkedValues
  const isLeapYear = (year % 4 == 0 && year % 100 != 0) || year % 400 == 0
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  const maxDay = daysInMonth[month > 0 ? month - 1 : 0] || 31

  if (month < 1) { month = 1 }
  else if (month > 12) { month = 12 }

  if (date < 1) { date = 1 }
  else if (date > maxDay) { date = maxDay }

  if (hour < 0) { hour = 0 }
  else if (hour > 23) { hour = 23 }
  if (minute < 0) { minute = 0 }
  else if (minute > 59) { minute = 59 }
  if (second < 0) { second = 0 }
  else if (second > 59) { second = 59 }

  return [year, month, date, hour, minute, second]
}

const text = ref('')

function updateText() {
  if (props.rangeable) {
    text.value = values.value
      .filter(e => e)
      .map(e => dayUts(e).format(labelFormat.value))
      .join(` ${props.rangeSeparator} `)
  }
  else {
    if (!props.modelValue) {
      text.value = ''
    }
    else { text.value = dayUts(toDate()).format(labelFormat.value) }
  }
}

async function onChange(data: number[]) {
  value.value = checkDate([...data])

  if (dayUts(toDate()).isAfter(dayUts(props.end))) { value.value = dayUts(props.end).toArray() }
  if (dayUts(toDate()).isBefore(dayUts(props.start))) { value.value = dayUts(props.start).toArray() }

  if (props.rangeable) {
    values.value[rangeIndex.value] = dayUts(toDate()).format(valueFormat.value)

    if (dayUts(values.value[0]).isAfter(dayUts(values.value[1])) && values.value[1] != '') {
      values.value[1] = values.value[0]
    }

    shortcutsIndex.value = -1
  }
}

function setValue(val: string) {
  if (isNull(val) || isEmpty(val)) {
    value.value = checkDate(dayUts().toArray())
    text.value = ''
  }
  else {
    value.value = checkDate(dayUts(val).toArray())
    updateText()
  }
}

function setValues(val: string[]) {
  if (isEmpty(val)) {
    values.value = ['', '']
    text.value = ''
  }
  else {
    values.value = [...val]
    updateText()
  }
}

function setRange(index: number) {
  rangeIndex.value = index
  setValue(values.value[index])
}

function setRangeValue(val: string[], index: number) {
  shortcutsIndex.value = index
  values.value = [...val] as string[]
  setValue(val[rangeIndex.value])
  pickerKey.value += 1
}

const visible = ref(false)
const pickerKey = ref(0)
let callback: ((value: string | string[]) => void) | null = null

function open(cb: ((value: string | string[]) => void) | null = null) {
  if (isDisabled.value) { return }

  callback = cb
  // 先同步写好选中值，再打开弹窗，避免首帧用空 value 渲染
  nextTick(() => {
    if (props.rangeable) {
      rangeIndex.value = 0
      setValues(props.values)
      setValue(values.value[0])
      // 打开时若无已选范围，滚轮会显示当前时间，把当前展示同步到 values 以便直接点确定即可选中
      const currentStr = dayUts(toDate()).format(valueFormat.value)
      if (!values.value[0])
        values.value[0] = currentStr
      if (!values.value[1])
        values.value[1] = values.value[0]
    }
    else {
      setValue(props.modelValue)
    }
    visible.value = true
    pickerKey.value += 1
  })
}

function close() {
  visible.value = false
}

function clear() {
  text.value = ''

  if (props.rangeable) {
    emit('update:values', [] as string[])
    emit('range-change', [] as string[])
  }
  else {
    emit('update:modelValue', '')
    emit('change', '')
  }
  if (validate) { validate('change') }
}

function confirm() {
  if (props.rangeable) {
    const [a, b] = values.value

    if (a == '' || b == '') {
      uni.showToast({ title: '请选择完整时间范围', icon: 'none' })
      if (a != '') { rangeIndex.value = 1 }
      return
    }

    if (dayUts(a).isAfter(dayUts(b))) {
      uni.showToast({ title: '开始日期不能大于结束日期', icon: 'none' })
      return
    }

    emit('update:values', values.value)
    emit('range-change', values.value)
    if (validate) { validate('change') }

    if (callback != null) { callback!(values.value as string[]) }
  }
  else {
    // 打开时若无初始值，内部已用当前时间作为选中；确认时若 value 仍为空则兜底为当前时间，确保能赋上值
    if (isEmpty(value.value)) {
      value.value = checkDate(dayUts().toArray())
    }
    const val = dayUts(toDate()).format(valueFormat.value)

    emit('update:modelValue', val)
    emit('change', val)
    if (validate) { validate('change') }

    if (callback != null) { callback!(val) }
  }

  updateText()
  // 非范围模式：确认后用当前选中值更新展示（props 未同步时避免文案被清空）
  if (!props.rangeable && !isEmpty(value.value)) {
    text.value = dayUts(toDate()).format(labelFormat.value)
  }
  close()
}

watch(
  computed(() => props.modelValue),
  (val: string) => {
    if (!props.rangeable) {
      setValue(val)
    }
  },
  { immediate: true },
)

watch(
  computed(() => props.values),
  (val: string[]) => {
    if (props.rangeable) {
      setValues(val)
    }
  },
  { immediate: true },
)

watch(
  computed(() => props.labelFormat),
  () => {
    updateText()
  },
)

defineExpose({
  /** 打开底部选择弹出层（禁用状态下无效）；可传入回调，在确认时接收选中值 */
  open,
  /** 关闭底部选择弹出层（不触发确认） */
  close,
  /** 清空已选值并触发 change / range-change 事件 */
  clear,
  /** 以当前滚轮选中值执行确认逻辑（范围不完整或倒序时会提示并中断），随后关闭弹出层 */
  confirm,
  /** 设置非范围模式的当前选中值（空值时重置为当前时间，仅更新内部状态，不触发事件） */
  setValue,
  /** 设置范围模式的开始/结束值数组（仅更新内部状态，不触发事件） */
  setValues,
  /** 切换范围模式当前编辑项：0 为开始时间，1 为结束时间 */
  setRange,
})
</script>

<template>
  <view>
    <RebornSelectTrigger v-if="showTrigger" :placeholder="placeholder" :disabled="isDisabled" :focus="popupRef?.isOpen"
      :text="text" arrow-icon="i-lucide-calendar" :ui="triggerUi" :color="color" :size="size" :clearable="clearable"
      @open="open()" @clear="clear">

      <template #default="{ showText, text, placeholder, ui }">
        <!-- #ifndef MP-WEIXIN -->
        <slot name="tag" />
        <!-- #endif -->
        <!-- #ifdef MP-WEIXIN -->
        <slot v-if="$slots.tag" name="tag" />
        <text v-else-if="showText" :class="ui.text()">{{ text }}</text>
        <text v-else :class="ui.placeholder()">{{ placeholder }}</text>
        <!-- #endif -->
      </template>
    </RebornSelectTrigger>

    <RebornPopup ref="popupRef" v-model="visible" :title="title" :ui="popupUi" position="bottom" :color="color">
      <view @touchmove.stop class="bg-white">
        <view v-if="rangeable" :class="ui.rangeBox()">
          <view v-if="showShortcuts" :class="ui.shortcuts()">
            <!-- #ifdef H5 -->
            <view v-for="(item, index) in shortcuts" :key="index"
              :class="ui.shortcutItem({ active: shortcutsIndex === index })"
              @tap.stop="setRangeValue(item.value, index)" @touchstart.stop @touchmove.stop @touchend.stop
              @touchcancel.stop>
              <text class="i-lucide-zap" />
              <text>{{ item.label }}</text>
            </view>
            <!-- #endif -->
            <!-- #ifndef H5 -->
            <view v-for="(item, index) in shortcuts" :key="index"
              :class="ui.shortcutItem({ active: shortcutsIndex === index })"
              @tap.stop="setRangeValue(item.value, index)">
              <text class="i-lucide-zap" />
              <text>{{ item.label }}</text>
            </view>
            <!-- #endif -->
          </view>

          <view :class="ui.rangeValues()">
            <!-- #ifdef H5 -->
            <view :class="ui.rangeStart({
              class: rangeIndex == 0 ? rangeActiveStyle.start : '',
            })" @tap.stop="setRange(0)" @touchstart.stop @touchmove.stop @touchend.stop @touchcancel.stop>
              <RebornText v-if="values.length > 0 && values[0] != ''" :ui="{ base: ui.rangeValueText() }"
                :color="rangeIndex == 0 ? color : 'neutral'">
                {{
                  values[0] }}
              </RebornText>
              <RebornText v-else :ui="{ base: ui.rangePlaceholder() }">
                {{ startPlaceholder
                }}
              </RebornText>
            </view>
            <!-- #endif -->
            <!-- #ifndef H5 -->
            <view :class="ui.rangeStart({
              class: rangeIndex == 0 ? rangeActiveStyle.start : '',
            })" @tap.stop="setRange(0)">
              <RebornText v-if="values.length > 0 && values[0] != ''" :ui="{ base: ui.rangeValueText() }"
                :color="rangeIndex == 0 ? color : 'neutral'">
                {{
                  values[0] }}
              </RebornText>
              <RebornText v-else :ui="{ base: ui.rangePlaceholder() }">
                {{ startPlaceholder
                }}
              </RebornText>
            </view>
            <!-- #endif -->

            <RebornText :ui="{ base: ui.separator() }">
              {{ rangeSeparator }}
            </RebornText>

            <!-- #ifdef H5 -->
            <view :class="ui.rangeEnd({
              class: rangeIndex == 1 ? rangeActiveStyle.end : '',
            })" @tap.stop="setRange(1)" @touchstart.stop @touchmove.stop @touchend.stop @touchcancel.stop>
              <RebornText v-if="values.length > 1 && values[1] != ''" :ui="{ base: ui.rangeValueText() }"
                :color="rangeIndex == 1 ? color : 'neutral'">
                {{
                  values[1] }}
              </RebornText>
              <RebornText v-else :ui="{ base: ui.rangePlaceholder() }">
                {{ endPlaceholder
                }}
              </RebornText>
            </view>
            <!-- #endif -->
            <!-- #ifndef H5 -->
            <view :class="ui.rangeEnd({
              class: rangeIndex == 1 ? rangeActiveStyle.end : '',
            })" @tap.stop="setRange(1)">
              <RebornText v-if="values.length > 1 && values[1] != ''" :ui="{ base: ui.rangeValueText() }"
                :color="rangeIndex == 1 ? color : 'neutral'">
                {{
                  values[1] }}
              </RebornText>
              <RebornText v-else :ui="{ base: ui.rangePlaceholder() }">
                {{ endPlaceholder
                }}
              </RebornText>
            </view>
            <!-- #endif -->
          </view>
        </view>

        <view>
          <!-- rangeable 时仅在 pickerKey>0 后渲染，避免首帧用空 indexes 导致 1970/1/1；非 rangeable 始终渲染 -->
          <RebornPickerView v-if="!rangeable || pickerKey > 0" :key="pickerKey" :headers="headers" :value="indexes"
            :columns="columns" :ui="pickerUi" :color="color" @change-value="onChange" />
        </view>
        <view :class="ui.footer()">
          <view :class="ui.cancel()">
            <RebornButton v-if="showCancel" :size="size" variant="outline" :color="color"
              :ui="{ base: ui.cancelButton() }" block @tap="close">
              {{ cancelText }}
            </RebornButton>
          </view>
          <view :class="ui.confirm()">
            <RebornButton v-if="showConfirm" :size="size" variant="solid" :color="color"
              :ui="{ base: ui.confirmButton() }" block @click="confirm">
              {{ confirmText }}
            </RebornButton>
          </view>
        </view>
      </view>
    </RebornPopup>
  </view>
</template>

<style scoped></style>
