<script setup lang="ts">
import type { ClassValue } from 'clsx'
import type { PropType } from 'vue'
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

// 组件属性定义
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  values: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  title: {
    type: String,
    default: () => '请选择',
  },
  // 表头
  headers: {
    type: Array as PropType<string[]>,
    default: () => ["年", "月", "日", "时", "分", "秒"]
  },
  placeholder: {
    type: String,
    default: () => '请选择',
  },
  showTrigger: {
    type: Boolean,
    default: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  confirmText: {
    type: String,
    default: () => '确定',
  },
  showConfirm: {
    type: Boolean,
    default: true,
  },
  cancelText: {
    type: String,
    default: () => '取消',
  },
  showCancel: {
    type: Boolean,
    default: true,
  },
  labelFormat: {
    type: String as PropType<string>,
    default: '',
  },
  valueFormat: {
    type: String as PropType<string>,
    default: '',
  },
  start: {
    type: String,
    default: '1970-01-01 00:00:00',
  },
  end: {
    type: String,
    default: '2099-12-31 23:59:59',
  },
  type: {
    type: String as PropType<'year' | 'month' | 'date' | 'hour' | 'minute' | 'second'>,
    default: 'second',
  },
  rangeable: {
    type: Boolean,
    default: false,
  },
  startPlaceholder: {
    type: String,
    default: () => '开始日期',
  },
  endPlaceholder: {
    type: String,
    default: () => '结束日期',
  },
  rangeSeparator: {
    type: String,
    default: () => '至',
  },
  showShortcuts: {
    type: Boolean,
    default: true,
  },
  shortcuts: {
    type: Array as PropType<SelectDateShortcut[]>,
    default: () => [],
  },
  clearable: {
    type: Boolean,
    default: true,
  },
  size: {
    type: String as PropType<typeof selectDateSizes[number]>,
    default: 'md',
  },
  color: {
    type: String as PropType<typeof selectDateColors[number]>,
    default: 'primary',
  },
  triggerUi: {
    type: Object as PropType<Partial<{ wrapper: ClassValue, content: ClassValue, text: ClassValue, placeholder: ClassValue, iconWrapper: ClassValue, clearIcon: ClassValue, arrowIcon: ClassValue }>>,
    default: () => ({}),
  },
  popupUi: {
    type: Object as PropType<Partial<{ wrapper: ClassValue, mask: ClassValue, popup: ClassValue, inner: ClassValue, draw: ClassValue, header: ClassValue, title: ClassValue, container: ClassValue }>>,
    default: () => ({}),
  },
  pickerUi: {
    type: Object as PropType<Partial<{ wrapper: ClassValue, header: ClassValue, headerText: ClassValue, pickerContainer: ClassValue, item: ClassValue, itemText: ClassValue, indicator: ClassValue }>>,
    default: () => ({}),
  },
  ui: {
    type: Object as PropType<Partial<{ wrapper: ClassValue, popupOp: ClassValue, rangeBox: ClassValue, rangeValues: ClassValue, rangeStart: ClassValue, rangeEnd: ClassValue, shortcuts: ClassValue, separator: ClassValue }>>,
    default: () => ({}),
  },
})

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
    separator: (opts?: { class?: any }) => styles.separator({ class: [opts?.class, props.ui?.separator] }),
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
      return values.value[0]
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

  const [year, month, date, hour, minute] = value.value
  const isLeapYear = (year % 4 == 0 && year % 100 != 0) || year % 400 == 0
  const days = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month > 0 ? month - 1 : 0]
  const yearRange = Math.max(60, endYear - startYear + 1)

  for (let i = 0; i < yearRange; i++) {
    const yearNum = startYear + i
    if (yearNum <= endYear) {
      arr[0].push({ label: yearNum.toString(), value: yearNum })
    }

    const monthNum = startYear == year ? startMonth + i : i + 1
    const endMonthNum = endYear == year ? endMonth : 12
    if (monthNum <= endMonthNum) {
      arr[1].push({ label: monthNum.toString().padStart(2, '0'), value: monthNum })
    }

    const dateNum = startYear == year && startMonth == month ? startDate + i : i + 1
    const endDateNum = endYear == year && endMonth == month ? endDate : days
    if (dateNum <= endDateNum) {
      arr[2].push({ label: dateNum.toString().padStart(2, '0'), value: dateNum })
    }

    const hourNum = startYear == year && startMonth == month && startDate == date ? startHour + i : i
    const endHourNum = endYear == year && endMonth == month && endDate == date ? endHour : 24
    if (hourNum < endHourNum) {
      arr[3].push({ label: hourNum.toString().padStart(2, '0'), value: hourNum })
    }

    const minuteNum = startYear == year && startMonth == month && startDate == date && startHour == hour ? startMinute + i : i
    const endMinuteNum = endYear == year && endMonth == month && endDate == date && endHour == hour ? endMinute : 60
    if (minuteNum < endMinuteNum) {
      arr[4].push({ label: minuteNum.toString().padStart(2, '0'), value: minuteNum })
    }

    const secondNum = startYear == year && startMonth == month && startDate == date && startHour == hour && startMinute == minute ? startSecond + i : i
    const endSecondNum = endYear == year && endMonth == month && endDate == date && endHour == hour && endMinute == minute ? endSecond : 60
    if (secondNum < endSecondNum) {
      arr[5].push({ label: secondNum.toString().padStart(2, '0'), value: secondNum })
    }
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

  let [year, month, date, hour, minute, second] = checkedValues
  const isLeapYear = (year % 4 == 0 && year % 100 != 0) || year % 400 == 0
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  const maxDay = daysInMonth[month > 0 ? month - 1 : 0] || 31

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
}

const visible = ref(false)
let callback: ((value: string | string[]) => void) | null = null

function open(cb: ((value: string | string[]) => void) | null = null) {
  if (isDisabled.value) { return }

  visible.value = true
  callback = cb

  nextTick(() => {
    if (props.rangeable) {
      rangeIndex.value = 0
      setValues(props.values)
      setValue(values.value[0])
    }
    else {
      setValue(props.modelValue)
    }
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
  console.log(props.rangeable)
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
    const val = dayUts(toDate()).format(valueFormat.value)

    emit('update:modelValue', val)
    emit('change', val)
    if (validate) { validate('change') }

    if (callback != null) { callback!(val) }
  }

  updateText()
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
  open,
  close,
  clear,
  confirm,
  setValue,
  setValues,
  setRange,
})
</script>

<template>
  <RebornSelectTrigger v-if="showTrigger" :placeholder="placeholder" :disabled="isDisabled" :focus="popupRef?.isOpen"
    :text="text" arrow-icon="i-lucide-calendar" :ui="triggerUi" :color="color" :size="size" :clearable="clearable"
    @open="open()" @clear="clear">
    <!-- #ifndef MP-WEIXIN -->
    <template #default>
      <slot name="tag" />
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
      <view v-if="rangeable" :class="ui.rangeBox()">
        <view v-if="showShortcuts" :class="ui.shortcuts()">
          <view v-for="(item, index) in shortcuts" :key="index" class="
              flex cursor-pointer items-center gap-1 rounded-md border
              border-solid px-2 py-1 text-xs transition-colors
            " :class="shortcutsIndex == index ? `
              border-${color}
              text-${color}
              bg-${color}-50
              dark:bg-${color}-900/20
            ` : `
              border-gray-2
              dark:border-gray-7
              text-gray-6
              dark:text-gray-4
              bg-transparent
            `" @tap="setRangeValue(item.value, index)">
            <text class="i-lucide-zap" />
            <text>{{ item.label }}</text>
          </view>
        </view>

        <view :class="ui.rangeValues()">
          <view :class="ui.rangeStart({
            class: rangeIndex == 0 ? rangeActiveStyle.start : '',
          })" @tap="setRange(0)">
            <RebornText v-if="values.length > 0 && values[0] != ''" :ui="{ base: 'text-center block w-full' }"
              :color="rangeIndex == 0 ? color : 'neutral'">
              {{
                values[0] }}
            </RebornText>
            <RebornText v-else class="text-surface-400 block w-full text-center">
              {{ startPlaceholder
              }}
            </RebornText>
          </view>

          <RebornText :ui="{ base: ui.separator() }">
            {{ rangeSeparator }}
          </RebornText>

          <view :class="ui.rangeEnd({
            class: rangeIndex == 1 ? rangeActiveStyle.end : '',
          })" @tap="setRange(1)">
            <RebornText v-if="values.length > 1 && values[1] != ''" :ui="{ base: 'text-center block w-full' }"
              :color="rangeIndex == 1 ? color : 'neutral'">
              {{
                values[1] }}
            </RebornText>
            <RebornText v-else class="text-surface-400 block w-full text-center">
              {{ endPlaceholder
              }}
            </RebornText>
          </view>
        </view>
      </view>

      <view>
        <RebornPickerView :headers="headers" :value="indexes" :columns="columns" :ui="pickerUi" :color="color"
          @change-value="onChange" />
      </view>

      <view class="flex flex-row items-center justify-center gap-2 p-3">
        <RebornButton v-if="showCancel" :size="size" variant="outline" :color="color" class="flex-1" @tap="close">
          {{ cancelText }}
        </RebornButton>
        <RebornButton v-if="showConfirm" :size="size" variant="solid" :color="color" class="flex-1" @click="confirm">
          {{ confirmText }}
        </RebornButton>
      </view>
    </view>
  </RebornPopup>
</template>

<style scoped></style>
